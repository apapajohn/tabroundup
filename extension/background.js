
const collator = new Intl.Collator();
const tabQueryOpts = {

    windowType: "normal"
}
chrome.action.onClicked.addListener(async (event) => {
    await sortAllTabsAndMergeWindows()
    groupTabs().then()
});

/**
 * This would be nice, but it goes by url only, so could blow away someone's work in a form or app
 * @returns {Promise<void>}
 */
async function removeAllDupes() {
    let setTabs = new Set();
    let tabDupeIds = []

    let tabs = await chrome.tabs.query(tabQueryOpts);
    tabs.forEach((tab, i) => {
        if (setTabs.has(tab.url)) {
            tabDupeIds.push(tab.id)
        } else {
            setTabs.add(tab.url)
        }
    })
    await chrome.tabs.remove(tabDupeIds)
}

async function sortAllTabsAndMergeWindows() {
    let tabs = await chrome.tabs.query(tabQueryOpts);
    let mainWindowId = tabs.find(t => t.active)?.windowId??tabs[0].windowId

    tabs.sort((a, b) =>
        collator.compare(a.url.replace(new RegExp("www", ""), ""),
            b.url.replace(new RegExp("www", ""), ""))
    );

    tabs.forEach(async (tab, i) =>
        await chrome.tabs.move(tab.id, {index: i, windowId: mainWindowId})
    )
}

async function groupTabs() {
    let tabs = await chrome.tabs.query(tabQueryOpts);

    //group tabs only if the window is running out of room
    if (tabs.length < 15) return

    let groups = tabs.reduce(function (m, tab) {
        let domain = tab.url.replace(/http.+\/\//, '').replace(/\/.*/, '')
        if (!m.has(domain)) {
            m.set(domain, [])
        }
        m.get(domain).push(tab)
        return m
    }, new Map())

    for (let e of groups.keys()) {
        let tabGroup = groups.get(e)
        if (tabGroup.length > 1) {
            let groupTitle = e.replace(/www./, '').replace(/\..+$/, '')
            let options = {tabIds: tabGroup.map(t => t.id)}
            let tabGroups = await chrome.tabGroups.query({title: groupTitle})
            if (tabGroups.length > 0) {
                options.groupId = tabGroups[0].id
            }
            chrome.tabs.group(options, (groupId) => chrome.tabGroups.update(groupId, {
                title: groupTitle,
                collapsed: tabGroup.length > 2
            }))
        }

    }
}
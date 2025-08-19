const collator = new Intl.Collator();
const tabQueryOpts = {
    windowType: "normal"
};

const tabQueryActiveWindowOpts = {
    active: true,
    lastFocusedWindow: true
};

chrome.action.onClicked.addListener(async (event) => {
    const tabs = await chrome.tabs.query(tabQueryOpts);
    await sortAllTabsAndMergeWindows(tabs);
    await groupTabs(tabs);
});

/**
 * Find dupes, return them as a set of IDs
 *
 */
function findDupes(tabs) {
    const setTabs = new Set();
    const setDupeIds = new Set();

     tabs.forEach((tab, i) => {
        if (setTabs.has(tab.url)) {
            setDupeIds.add(tab.id);
        } else {
            setTabs.add(tab.url);
        }
    });
    return setDupeIds;
}

async function sortAllTabsAndMergeWindows(tabs) {
    const activeWindowTab =  await chrome.tabs.query(tabQueryActiveWindowOpts);
    const mainWindowId = activeWindowTab[0].windowId ?? tabs[0].windowId;
    tabs.sort((a, b) => {
             return collator.compare(a.url.replace(/https*...(www\.)*/, ""),
                b.url.replace(/https*...(www\.)*/, ""));
        }
    );

    tabs.forEach(async (tab, i) =>
        await chrome.tabs.move(tab.id, {index: i, windowId: mainWindowId})
    );
}
async function groupTabs(tabs) {
    //group tabs only if the window is running out of room
    if (tabs.length < 15) return;

    const setDupeIds = findDupes(tabs);

    const groups = tabs.reduce(function (m, tab) {
        let domain = setDupeIds.has(tab.id) ? "dupes" : tab.url.replace(/http.+\/\//, '').replace(/\/.*/, '');
        if (!m.has(domain)) {
            m.set(domain, []);
        }
        m.get(domain).push(tab);
        return m;
    }, new Map());

    for (let e of groups.keys()) {
        let tabGroup = groups.get(e);
        if (tabGroup.length > 1 || e === "dupes") {
            let groupTitle = e.replace(/www./, '').replace(/\..+$/, '');
            let options = {tabIds: tabGroup.map(t => t.id)};
            let tabGroups = await chrome.tabGroups.query({title: groupTitle});
            if (tabGroups.length > 0) {
                options.groupId = tabGroups[0].id;
            }
            chrome.tabs.group(options, (groupId) => chrome.tabGroups.update(groupId, {
                title: groupTitle,
                collapsed: tabGroup.length > 2
            }));
        }

    }
}
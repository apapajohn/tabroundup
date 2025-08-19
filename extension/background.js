const collator = new Intl.Collator();
const minTabs = 1; //minimum number of tabs to group
const tabQueryOpts = {
    windowType: "normal"
};

const tabQueryActiveWindowOpts = {
    active: true,
    lastFocusedWindow: true
};

chrome.action.onClicked.addListener(async () => {
    const tabs = await chrome.tabs.query(tabQueryOpts);
    chrome.storage.sync.get(
        { mergeWindows: undefined, deleteDuplicateTabs: undefined },
        async (options) => {
            const optionsWithDefaults = {
                deleteDuplicateTabs: options.deleteDuplicateTabs ?? false,
                mergeWindows: options.mergeWindows ?? true
            };
            await sortAllTabsAndMergeWindows(tabs, optionsWithDefaults);
            await groupTabs(tabs, optionsWithDefaults);
        }
    );
});

/**
 * Find dupes, return them as a set of IDs
 *
 */
function findDupes(tabs) {
    const setTabs = new Set();
    const setDupeIds = new Set();

     tabs.forEach((tab) => {
        if (setTabs.has(tab.url)) {
            setDupeIds.add(tab.id);
        } else {
            setTabs.add(tab.url);
        }
    });
    return setDupeIds;
}

async function sortAllTabsAndMergeWindows(tabs, options) {
    const activeWindowTab =  await chrome.tabs.query(tabQueryActiveWindowOpts);
    const mainWindowId = activeWindowTab[0]?.windowId ?? tabs[0].windowId;
    tabs.sort((a, b) => {
             return collator.compare(a.url.replace(/https*...(www\.)*/, ""),
                b.url.replace(/https*...(www\.)*/, ""));
        }
    );

    if (options.mergeWindows) {
        tabs.forEach(async (tab, i) =>
            await chrome.tabs.move(tab.id, {index: i, windowId: mainWindowId})
        );
    }
}
async function groupTabs(tabs, options) {
    //group tabs only if the window is running out of room
    if (tabs.length < minTabs) return;

    const setDupeIds = findDupes(tabs);
    //if the option to do so was selected, remove all the dupes we just found (otherwise, they'll be placed in a special "dupes" tab group):
    if (options.deleteDuplicateTabs) {
        tabs.forEach((tab) => {
            if (setDupeIds.has(tab.id)) {
                chrome.tabs.remove(tab.id);
            }
        });    
        setDupeIds.clear();
    }

    const groups = tabs.reduce(function (m, tab) {
        let domain = setDupeIds.has(tab.id)  ? "dupes" : tab.url.replace(/http.+\/\//, '').replace(/\/.*/, '');
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
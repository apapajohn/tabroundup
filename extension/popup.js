// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const tabs = await chrome.tabs.query({
  url: [
    'https://*/*',


  ]
});

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.url.replace(new RegExp("www", ""), ""), b.url.replace(new RegExp("www", ""), "")));

const template = document.getElementById('li_template');
const debug = document.getElementById('debug_info');
const setTabs = new Set();
const tabDupeIds = []
debug.textContent = `${tabs[0].url}`
const mainWindowId = tabs[0].windowId

const button = document.querySelector('button');
button.addEventListener('click', async () => {

    for (let i = 0; i < tabs.length; i++) {

        if (setTabs.has(tabs[i].url)) {

            tabDupeIds.push(tabs[i].id)
        } else {
            //debug.textContent = `${debug.textContent} i${i} ${tabs[i].host}`
            await chrome.tabs.move(tabs[i].id, {index: i, windowId: mainWindowId});
            setTabs.add(tabs[i].url)
        }



    }
  chrome.tabs.remove(tabDupeIds)

});

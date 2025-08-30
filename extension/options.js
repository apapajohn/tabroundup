// Saves options to chrome.storage
const saveOptions = () => {
  const mergeWindows = document.getElementById('mergeWindows').checked;
  const deleteDuplicateTabs = document.getElementById('deleteDuplicateTabs').checked;

  chrome.storage.sync.set(
    {  mergeWindows, deleteDuplicateTabs },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    { mergeWindows: true, deleteDuplicateTabs: false },
    (items) => {
      document.getElementById('mergeWindows').checked = items.mergeWindows;
      document.getElementById('deleteDuplicateTabs').checked = items.deleteDuplicateTabs;
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('mergeWindows').addEventListener('change', saveOptions);
document.getElementById('deleteDuplicateTabs').addEventListener('change', saveOptions);
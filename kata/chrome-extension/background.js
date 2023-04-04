let notes = [];

chrome.browserAction.onClicked.addListener(function(tab) {
  let note = prompt("Enter your note:");
  if (note) {
    notes.push(note);
    chrome.storage.local.set({notes: notes}, function() {
      console.log("Note saved: " + note);
    });
  }
});

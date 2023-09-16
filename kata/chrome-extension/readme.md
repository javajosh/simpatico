# Chrome Extension Kata
Get started like this:
```bash
mkdir chrome-extension
touch readme.md manifest.json
```

`manifest.json` contents:
```json
{
  "manifest_version": 2,
  "name": "Note Taker",
  "version": "1.0",
  "description": "Simple note-taking extension",
  "permissions": [
    "storage"
  ],
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  "browser_action": {
    "default_title": "Take a note"
  },
  "commands": {
    "take-note": {
      "suggested_key": {
        "default": "Ctrl+Shift+1",
        "mac": "Command+Shift+1"
      },
      "description": "Take a note"
    }
  }
}
```
`background.js` contents:
```js
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

```
## Load the extension
Load the extension in Chrome by starting Chrome and pasting the string "chrome://extensions/" (it's not actually a URL so I didn't hyperlink it) in the address bar and hitting "enter" . Enable Developer mode, and click the "Load unpacked" button to select the directory containing your extension files. For me, that's approx. `/home/jbr/simpatico/kata/chrome-extension`.

## Idea
I prefer editing these short snippets in one place, here.
It would be great to treat this file as the source of truth and the other files generated from this one.

## References
- [Chrome Extension Tutorial](https://developer.chrome.com/extensions/getstarted)
- [Chrome Command reference](https://developer.chrome.com/docs/extensions/reference/commands/)
- [Debugger API] (https://chromedevtools.github.io/devtools-protocol/tot/Debugger/)

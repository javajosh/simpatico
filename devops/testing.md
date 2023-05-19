# Testing

Unit tests for a js library are written in html with testable.js.
Some integration tests for a server are written in bash/curl.
Test automation is done with bash + curl + headless chrome.

```bash
chromium --headless --dump-dom --virtual-time-budget=2000 https://simpatico.local:8443/acceptance
```

If the tests pass, the body is empty.
If the tests don't pass, the body contains a serialized error.

Here is code to use a regex to test for an empty body in the output string.
This code is in [acceptance.js](acceptance.js), and run with `node acceptance.js`. The server must already be running.

TODO: check that the server is running.
Get its configuration somehow.
Run this as a pre commit hook (it runs in .5 seconds)


```node
import { exec } from 'child_process';

const url = 'https://simpatico.local:8443/acceptance';
const command = `chromium --headless --dump-dom --virtual-time-budget=2000 ${url} `;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`error: ${error},'stderror', ${stderr}`);
  } else {
    const content = extractBodyContent(stdout);
    if (content !== null && content !== ''){
      console.error('foo', content);
    }
  }
});

function extractBodyContent(html) {
  const bodyRegex = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
  const match = bodyRegex.exec(html);
  return match && match[1] ? match[1].trim() : null;
}

  ```

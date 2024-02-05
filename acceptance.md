# acceptance

```css
div#iframes {
  display: flex;
  flex-wrap: wrap;
}

iframe {
  flex: 1 0 calc(33.33% - 20px); /* Adjust the width as needed */
  margin: 10px;
}

```
<div id="iframes">
  <a href="/index.html">/index.html</a>
  <iframe src="/index.html"></iframe>

  <a href="/core">/core</a>
  <iframe src="/core"></iframe>

  <a href="/combine">/combine</a>
  <iframe src="/combine"></iframe>

  <a href="/stree">/stree</a>
  <iframe src="/stree"></iframe>

  <a href="/stree3">/stree3</a>
  <iframe src="/stree3"></iframe>

  <a href="/crypto">/crypto</a>
  <iframe src="/crypto"></iframe>

  <a href="/friendly">/friendly</a>
  <iframe src="/friendly"></iframe>

  <a href="/svg">/svg</a>
  <iframe src="/svg"></iframe>

  <a href="/chat">/chat</a>
  <iframe src="/chat"></iframe>
</div>

# About

If your test suite is self-executing html pages, then including them as an
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe">iframe</a> and checking their color is enough.
This technique is mapping over html resources with a "fresh" browser to produce a tab state.

## Running the browser, running in a CLI
The canonical way to run these tests is interactively in the browser.
Run them from the command line using the [acceptance.js script](acceptance.js). (Requires chrome or chromium). Note that `acceptance.js` and `testable.js` are linked in that testable checks the runtime and modifies the DOM based on test success.

Possibly interesting: [iframes in responsive layous](https://www.benmarshall.me/responsive-iframes/)


## curl
Lower level issues (and some performance tests) are better done outside the browser using a tool like `curl`.

  1. Curl is very straightforward on mac and linux.
  1. Curl in windows can run in wsl, but it can be difficult to hit a windows node process.
  1. Curl native to windows must be <a href="https://curl.se/windows/">installed manually</a>.
  1. Native win10 curl takes the url first and won't accept quotes.
  1. (Although win10/chrome has some interesting options for "copy value as" like powershell, cmd or bash).

Here is what you get if you "copy as curl" on Linux/Firefox:

```bash
  curl 'https://simpatico.io/' \
  -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/109.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'\
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br' \
  -H 'DNT: 1' \
  -H 'Connection: keep-alive' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Sec-Fetch-Dest: document' \
  -H 'Sec-Fetch-Mode: navigate' \
  -H 'Sec-Fetch-Site: none' \
  -H 'Sec-Fetch-User: ?1' \
  -H 'Pragma: no-cache' \
  -H 'Cache-Control: no-cache'
```

Manipulation of the request at this level is useful for testing code that rejects invalid requests.
For example, missing User-Agent headers (this app is designed for human users only)
Note that the `reflector` is insensitive to almost all of these headers.
(However, `node:http` *may* be sensitive to them.)


To test you can do this:
```bash
  curl 'https://simpatico.io/' \
  -H 'User-Agent: Can be anything but blank' \
  -H 'Accept-Encoding: gzip, deflate, br' \
  -H 'X-The-Rest: are ignored
```

```bash
  curl 'https://simpatico.local:8443/' -H 'User-Agent: '
```

## Fetch

Browser dev tools network pane copy value as fetch.
This can be used in browser javascript, or in node javascript.
See html source:

```js
  // This "fetch()" is equivalent to the curl above
  if (!window.location) await fetch("https://simpatico.io/", {
    "credentials": "omit",
    "headers": {
      "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/109.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache"
    },
    "method": "GET",
    "mode": "cors"
  });
```
This code combines the other test results into an overall "pass/fail" on *this* page:
```js
  const headless = /\bHeadlessChrome\//.test(navigator.userAgent);
  let testCount = document.querySelectorAll("iframe").length;

  const svgIcon = fill => `data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='${fill}' />
    </svg>`;

  // Here we interact with the iframes indirectly, by listening for events the iframes may emit.
// Communicate with the outside world if in headless chrome through the DOM.
  window.addEventListener('test-failure', (e) => {
    favicon.href = svgIcon('red');
    document.body.style.backgroundColor = 'red';
    if (headless){
      document.body.innerText = JSON.stringify(e);
    }
  })
  window.addEventListener('test-success', () => {
    favicon.href = svgIcon('green');
    if (headless && (--testCount === 0)){
      document.body.innerText = '';
    }
  })
```

Finally, the functional test runner script. Note that it checks the body innerHTML to determine success or failure (litmd note: this code is not executed in the browser because it is labelled as "node" and not "js"):

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

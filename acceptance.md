# Acceptance Tests

```html
<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 40 30"
  style="border: 1px solid gray; pointer-events: visible; max-width: 100%; height: auto"
  id="iframe-svg"
>
</svg>
```
# Running in the browser
Our approach is to add a list of `iframes` to an `svg` and position a `rect` in front that responds to click events.
(Without this, the click would be consumed by the underlying iframe.
Intercepting clicks to iframes is almost impossible in regular DOM.)
Since the iframes are not interactive we remove the scrollbar with `scrolling="no"` (which was certainly new to me!)

The svg container is reactive to page width, and the pixel height is computed based on .
To adjust the logical height use `viewBox` parameters.

```js
import {svg} from './simpatico.js';

const iframeSvg = svg.elt('iframe-svg');
// NB: adjust viewbox of svg to add more rows of content
const urls = [
  'index', 'chat','combine', 'core',
  'crypto', 'friendly', 'reflector', 'lit.md',
  'stree', 'svg', 'websocket'
];

const clickableIframe = (url, {x,y}) => `
  <g transform="translate(${x} ${y})">
    <foreignObject id="embedded-iframe" width="500px" height="500px" transform="scale(.02)">
      <iframe width="500px" height="500px" src="${url}" style="overflow:hidden" scrolling="no"></iframe>
    </foreignObject>
    <rect onclick="window.open('${url}','_blank')" width="10" height="10" fill-opacity="0"/>
  </g>
`;

const pos = (index, cols=4, W=10, H=10) => {
  const x = index % cols * W;
  const y = Math.floor(index / cols) * H;
  return { x, y };
}
const iframeAtIndex = (url, i) => clickableIframe(url, pos(i));
const html = urls.map(iframeAtIndex).reduce((a,b) => a + b, '');
iframeSvg.innerHTML = html;

```


# Headless execution
If your test suite is self-executing html pages, then including them as an `iframe` with [testable.js](testable.js) and visually checking their background color works great.

This code combines the results of all tests into an overall "pass/fail" on *this* page:

```js
  const headless = /\bHeadlessChrome\//.test(navigator.userAgent);
  let testCount = document.querySelectorAll("iframe").length;

  const svgIcon = fill => `data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='${fill}' />
    </svg>`;

  // Here we interact with the iframes indirectly, by listening for events the iframes may emit.
// Communicate with the outside world if in headless chrome through the DOM.
  let failed = false;
  window.addEventListener('test-failure', (e) => {
    failed = true;
    favicon.href = svgIcon('red');
    document.body.style.backgroundColor = 'red';
    if (headless){
      document.body.innerText = JSON.stringify(e);
    }
  })
  window.addEventListener('test-success', () => {
    if (!failed) favicon.href = svgIcon('green');
    if (headless && (--testCount === 0)){
      document.body.innerText = '';
    }
  })
```

In the future I'd like to capture logging output and put it in the DOM to support command-line usage a little better. Instead of printing out 'success' we'd see the output of all tests, which is a nice check that the tests actually ran.

## Invoking headless chrome
Note the check `/\bHeadlessChrome\//.test(navigator.userAgent);` in the code in the previous section.
If you run this page in headless chrome, overall test success is indicated by removing the document body.
For convenience, the [acceptance.js script](acceptance.js) invokes headless chrome with the correct command line options and checks the dom dump for the appropriate emptiness (invoke with `node acceptance.js` after running the server):

```js
/// DO NOT EXECUTE - this is node code
import { exec } from 'child_process';

// Headless chrome is invoked with the dump-dom flag, which we'll use to check results.
const command = (url) => `chromium --headless --dump-dom --disable-gpu --virtual-time-budget=2000 ${url} `;

// The acceptance page knows to check for headless chrome via user agent headers.
// If the tests pass, the body is cleaned out.
// TODO: change this behavior/protocol to add logging output to DOM
const defaultUrl = 'https://simpatico.local:8443/acceptance';

// Get the body content of an HTML string.
// TODO: look for specific test output nodes.
const extractBodyContent = (html) => {
  const bodyRegex = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
  const match = bodyRegex.exec(html);
  return match && match[1] ? match[1].trim() : null;
}

// Run the headless chrome command asynchronously
// Get the --dump-dom in the stdout handler.
// Note that error/stderror refer only to the external chrome process and not the internals of the tab.
// (for that you need to start chrome with debbugging enabled and connect to that port, which is what puppeteer does.)
const runAcceptance = (url=defaultUrl) => {
  exec(command(url), (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error},'stderror', ${stderr}`);
    } else {
      const content = extractBodyContent(stdout);
      if (content !== null && content !== '') {
        console.error('body content not empty', content);
      } else {
        console.log('success')
      }
    }
  });
};

// Support running this module directly from the command line, as well as incorporating it into another process.
// This is a bit hacky, but honestly acceptance.js is very tightly coupled to acceptence.md
// So supporting an alternative url on the command line is kind of window dressing
const isRunFromCommandline = () => process.argv[1].endsWith('acceptance.js');

if (isRunFromCommandline()) {
  const [node, acceptance, url=defaultUrl] = process.argv;
  console.debug(`running acceptance test with command line ${command(url)}`);
  runAcceptance(url);
}

export default runAcceptance;

```
## Discussion
The `acceptance.js` script replaces libraries like puppeteer, which themselves operate by putting headless chrome in debugging mode.
The problem of timing is an interesting one, as it's not necessarily the case that all the tests finished loading and running.
This means it's possible for headless chrome to exit before the tests completed.
However we work around this by counting iframes and only indicating success once we've counted that many `test-success` events.

The callbacks on the `exec` call refer to headless chrome itself, not the `window` context of the page its running.

# Using cURL to check low-level failures
Lower level issues (and some performance tests) are better done outside the browser using a tool like `curl`.

  1. Curl is very straightforward on mac and linux.
  1. Curl in windows can run in wsl, but it can be difficult to hit a windows node process.
  1. Curl native to windows must be [installed manually](https://curl.se/windows/).
  1. Native win10 curl takes the url first and won't accept quotes.
  1. (Although win10/chrome has some interesting options for "copy value as" like `powershell`, `cmd` or `bash`).

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

Manipulation of the request at this level is useful for testing cod that rejects invalid requests.
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
This test will give a 500:
```bash
  curl 'https://simpatico.local:8443/' -H 'User-Agent: '
```

# An idea to cover the iframes not in a rect but in another foreignObject, a single anchor, so that the user sees the URL on hover
```html
<!---DOCTYPE html>
<html>
<head>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
        }
        a {
            display: block;
            width: 100vw;
            height: 100vh;
            background-color: #f0f0f0; /* Set your desired background color */
            text-align: center;
            line-height: 100vh;
            text-decoration: none;
            color: transparent; /* Make the text color transparent */
        }
    </style>
</head>
<body>
    <a href="#">This is a link that takes up the entire viewport</a>
</body>
</html>

```

<!--<!DOCTYPE html>
<head>
  <title>Simpaticode: acceptance</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='DodgerBlue' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css?###">

</head>-->

# Simpaticode: acceptance

<iframe id="homepage-frame"
        title="homepage"
        width="300"
        height="200"
        src="/index.html">
</iframe>
<iframe id="core-frame"
        title="core"
        width="300"
        height="200"
        src="/core.html">
</iframe>
<iframe id="combine2-frame"
        title="combine"
        width="300"
        height="200"
        src="/combine2">
</iframe>
<iframe id="stree2-frame"
        title="stree"
        width="300"
        height="200"
        src="/stree2">
</iframe>
<iframe id="crypto-frame"
        title="crypto"
        width="300"
        height="200"
        src="/crypto.md">
</iframe>
<iframe id="friendly-frame"
        title="friendly"
        width="300"
        height="200"
        src="/friendly.html">
</iframe>
<iframe id="svg-frame"
        title="svg"
        width="300"
        height="200"
        src="/svg">
</iframe>
<iframe id="chat-frame"
        title="chat"
        width="300"
        height="200"
        src="/chat">
</iframe>

If your test suite is self-executing html pages, then including them as an
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe">iframe</a> and checking their color is enough.
This technique is mapping over html resources with a "fresh" browser to produce a tab state.

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

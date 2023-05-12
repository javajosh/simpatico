<!--<!DOCTYPE html>
<head>
  <title>Simpaticode: chat</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='white' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">
  <link class="hljs" rel="stylesheet" href="/kata/highlight.github.css">
  <meta id="refresh" http-equiv="refresh" content="-1">
  <script class="testable" src="testable.js" type="module"></script>
  <script class="hljs" type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    const d=document, elts = a => d.querySelectorAll(a);
    hljs.registerLanguage('javascript', javascript);
    d.addEventListener('DOMContentLoaded', () =>
      elts('pre code').forEach(block =>
        hljs.highlightElement(block)));
  </script>
</head>-->

# Simpaticode: chat
2023

See:
[home](/),
[litmd](/lit.md),
[audience](/audience.md),
[reflector](/reflector.md)

This is a very tiny chat system.
It demonstrates "low-level" web-sockets programming with modern javascript.
It also demonstrates the use of [webcryptobox](https://github.com/jo/webcryptobox), a truly excellent minimalist library.
Messages are broadcast to all connected clients.

## Messages

```html

<button id="reset-button">Reset keypair</button>
<ol id="display-chat">
  <li><label>Say something:<input type="text"></label></li>
</ol>
```

## Goals

1. [x] Connect to websocket server
1. [x] Generate public/private keypair if doesn't exist
1. [x] Use old keypair if it does exist
1. [ ] Send public key to server
1. [ ] convert this file into markdown.
1. [ ] Server associates the pubkey with the connection
1. [ ] use stree to manage server connections?
1. [ ] Modify server to accept targeted messages [from, to, msg]
1. [ ] Either allow an array of "to" or use aliases
1. [ ] Target a connected process with public key
1. [ ] Encrypt messages in flight
1. [ ] Encrypt messages at rest
1. [ ] Combine messages in client using the stree


```js
  import * as wcb from './webcryptobox.js';

  const DEBUG = false;
  const DP_LOCAL_STORAGE_KEY = 'durable-process';
  const body = document.body;
  const displayChat = document.getElementById('display-chat');
  const resetButton = document.getElementById('reset-button');
  const websocketURL = window.location.toString().replace(/^http/, 'ws');
  const ls = window.localStorage;

  // Initialize either by restoring a keypair or generating a new one.
  const {keyPair, keyPairPem} = await initializeDurableProcess(DP_LOCAL_STORAGE_KEY);

  // Start the connection, register a listener/msg handler
  // TODO: connection may be lost and recreated.
  let connection = connect(websocketURL, keyPair, keyPairPem, e => receiveMessage(e.data));

  // Turn body change events (emitted by form fields) into msg sends.
  body.addEventListener('change', e =>  {
    sendMessage(e.target.value);
    e.target.value = "";
  });

  // A click deletes the old keys, make new ones, and refreshes the page.
  resetButton.addEventListener('click', () => {
    initializeDurableProcess(DP_LOCAL_STORAGE_KEY, true);
    window.location.reload();
    return false;
  });

  // ==============================================================
  // Begin support functions:
  async function initializeDurableProcess(key=DP_LOCAL_STORAGE_KEY, resetKeys = false) {
    let keyPair, keyPairPem;
    if (resetKeys) ls.removeItem(key);
    if (!ls.hasOwnProperty(key)) {
      // Generate a new keypair
      keyPair = await wcb.generateKeyPair();
      keyPairPem = {
        publicKeyPem:  await wcb.exportPublicKeyPem(keyPair.publicKey),
        privateKeyPem: await wcb.exportPrivateKeyPem(keyPair.privateKey)
      };
      ls.setItem(key, JSON.stringify(keyPairPem));
      if (DEBUG) console.log('created durable-process keypair in localStorage', keyPairPem, keyPair);
    } else {
      try{
        const keyPairString = ls.getItem(key);
        keyPairPem = JSON.parse(keyPairString);
        keyPair = {
          publicKey: await wcb.importPublicKeyPem(keyPairPem.publicKeyPem),
          privateKey: await wcb.importPrivateKeyPem(keyPairPem.privateKeyPem)
        };
        if (DEBUG) console.log('recovered durable-process keypair from localStorage', keyPairPem, keyPair);
      } catch (e) {
        console.error('invalid keys, deleting and start again');
        ls.removeItem(key);
        throw e;
      }
    }
    return {keyPair, keyPairPem};
  }

  // Read: Open the socket and) become capable of sending and recieving messages
  function connect (url, keyPair, keyPairPem, handler) {
    const conn = new WebSocket(url);
    conn.onopen = () => {
      sendMessage(keyPairPem.publicKeyPem, conn);
    }
    conn.onmessage = handler;
    return conn;
  }

  // Display a string as a new list element
  function addListItem (itemHtml, parent = displayChat) {
    const li = document.createElement("li");
    li.innerHTML = itemHtml;
    parent.appendChild(li);
    if (DEBUG) console.debug(`itemHtml received and appended as li [${itemHtml}]`);
  }

  function isConnReady (conn = connection) {
    return (conn !== undefined) && (conn.readyState === conn.OPEN);
  }

  // Send a message over the websocket, reconnecting if necessary.
  function sendMessage(msg, conn = connection) {
    if (!isConnReady(conn)) throw 'connection is not ready';
    try {
      conn.send(msg);
      if (DEBUG) console.debug(`msg sent ${msg}`);
      return conn;
    } catch (ex) {
      console.error('problem sending message');
      throw ex;
    }
  }
  function receiveMessage(msg) {
    addListItem(msg);
  }
```

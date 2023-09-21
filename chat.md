# Simpaticode: chat
2023

See:
[home](/),
[litmd](/lit.md),
[chat](/chat.md),
[reflector](/reflector.md)

# Ephemeral chat client
An ephemeral chat client has no durable state, and generates a new address on every invocation.
The client boots and provides a URL that encodes it's address.
Open the link in a new tab, and you get two things: a new address, and a connection between the two.
This change requires a [reflector](reflector) change, wrapping the wss reference with metadata, the addresses,
and a reverse lookup that maps addresses to a wss reference.
The key property of the wss reference is the existence of a `send()` method so we can model our solution in the browser.

Note that to get this to work you need to run `npm install` to add the qr code library.

## Client

```html
<ol id="chat-app">
  <li><input id="text-entry" type="text" placeholder="type hit enter"></li>
</ol>

<script src="./node_modules/qrcode/build/qrcode.js"></script>
```

```js
  import * as wcb from './webcryptobox.js';

  // Bind to UI elts
  const chatApp = document.getElementById('chat-app');
  const textEntry = document.getElementById('text-entry');

  // Generate a new keypair
  const keyPair = await wcb.generateKeyPair();
  const keyPairPem = {
    publicKeyPem:  await wcb.exportPublicKeyPem(keyPair.publicKey),
    privateKeyPem: await wcb.exportPrivateKeyPem(keyPair.privateKey),
    pubKeyFingerprint: c.base64EncodeBuffer(await wcb.sha256Fingerprint(keyPair.publicKey)),
  };

  const address = keyPairPem.pubKeyFingerprint;
  const addressLink = window.location.href + '#' + address;

  // Get an address out of the hash
  let parentAddress='';
  if (window.location.hash){
    parentAddress = window.location.hash;
  } else {
    // For now, just send messages to ourself.
    parentAddress = address;
  }

  addListItem(`<pre>${JSON.stringify(keyPairPem, null, 2)}</pre>`);
  addListItem(`<a href="${addressLink}">${addressLink}</a>`);
  addListItem(`parentAddress: ${parentAddress}`);
  addListItem(`address QR code: <canvas id="qr"></canvas>`);

  QRCode.toCanvas(document.getElementById('qr'), addressLink, debug);

  // strip the hash because websocket urls cannot have a hash
  const websocketURL = window.location.toString().replace(/^http/, 'ws').split('#')[0];

  // Start the connection, register a listener/msg handler
  let connection = connect(websocketURL, keyPair, keyPairPem, e => addListItem(e.data));

  // Turn body change events (emitted by form fields) into msg sends.
  chatApp.addEventListener('change', e =>  {
    if (isConnReady(connection)) {
      sendMessage({
        from: address,
        to: parentAddress,
        body: e.target.value,
      });
      e.target.value = "";
    } else {
        window.alert('Unable to send message, connection not ready');
        log(connection);
    }
  });

  // Generic DOM helper function to add a list element
  function addListItem (itemHtml, parent = chatApp) {
    const li = document.createElement("li");
    li.innerHTML = itemHtml;
    parent.appendChild(li);
  }

  // Read: Open the socket and) become capable of sending and recieving messages
  function connect (url, keyPair, keyPairPem, handler) {
    const conn = new WebSocket(url);
    conn.onopen = () => {
      sendMessage({address: keyPairPem.pubKeyFingerprint});
    }
    conn.onmessage = handler;
    return conn;
  }

  function isConnReady (conn = connection) {
    return (conn !== undefined) && (conn.readyState === conn.OPEN);
  }

  // Send a message over the websocket
  function sendMessage(msg, conn = connection) {
    msg = JSON.stringify(msg);
    debug(`sendMessage(${msg})`);
    if (!isConnReady(conn)) throw 'connection is not ready';
    conn.send(msg);
    return conn;
  }
```

# UI options
Note about UI: I've not yet implemented a UI for this.
[hugging face](https://github.com/huggingface/chat-ui) released theirs recently, and it looks good.
It's made with [svelte](https://svelte.dev/) (which I like) over [Mongo](https://www.mongodb.com/) (which I don't particularly like).

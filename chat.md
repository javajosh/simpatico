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


## Client

```html

<ol id="chat-app">
  <li><input id="text-entry" type="text" placeholder="type hit enter"></li>
  <li><span id="private-key"></span></li>
  <li><span id="public-key-fingerprint"></span></li>
</ol>
```

```js
  import * as wcb from './webcryptobox.js';

  // Bind to UI elts
  const chatApp = document.getElementById('chat-app');
  const privateKey = document.getElementById('private-key');
  const publicKeyFingerprint = document.getElementById('public-key-fingerprint');
  const textEntry = document.getElementById('text-entry');

  // Generate a new keypair
  const keyPair = await wcb.generateKeyPair();
  const keyPairPem = {
    publicKeyPem:  await wcb.exportPublicKeyPem(keyPair.publicKey),
    privateKeyPem: await wcb.exportPrivateKeyPem(keyPair.privateKey)
  };

  const pubKeyFingerprint = wcb.encodeBase64(await wcb.sha256Fingerprint(keyPair.publicKey));
  publicKeyFingerprint.innerText = pubKeyFingerprint;

  // Show the private key. Obviously this is not secure, but we're still under construction.
  privateKey.innerText = keyPairPem.privateKeyPem;


  const websocketURL = window.location.toString().replace(/^http/, 'ws');
  // Start the connection, register a listener/msg handler
  // TODO: connection may be lost and recreated.
  // TODO: client keep-alive messages
  let connection = connect(websocketURL, keyPair, keyPairPem, e => addListItem(e.data));

  // Turn body change events (emitted by form fields) into msg sends.
  chatApp.addEventListener('change', e =>  {
    if (isConnReady(connection)) {
      sendMessage(e.target.value);
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
      sendMessage(pubKeyFingerprint, conn);
    }
    conn.onmessage = handler;
    return conn;
  }

  function isConnReady (conn = connection) {
    return (conn !== undefined) && (conn.readyState === conn.OPEN);
  }

  // Send a message over the websocket
  function sendMessage(msg, conn = connection) {
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

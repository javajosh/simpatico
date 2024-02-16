# Simpaticode: chat
2023

See:
[home](/),
[litmd](/lit.md),
[chat](/chat.md),
[reflector](/reflector.md)

# Ephemeral chat client
An ephemeral chat client lives only as long as the DOM - as long as the browser tab.

The client boots and provides a URL that encodes it's address.
Open the link in a new tab, and you get two things: a new address, and a connection between the two.
This change requires a [reflector](reflector) change, wrapping the wss reference with metadata, the addresses,
and a reverse lookup that maps addresses to a wss reference.
The key property of the wss reference is the existence of a `send()` method so we can model our solution in the browser.

Note that to get this to work you need to run `npm install` to add the qr code library; however this uses `node_gyp` which is problematic, so I've committed the bundle to avoid this necessity.

Note also that this is incomplete: symmetric keys are not being shared, and messages are not encrypted yet.
HTML is sanitized, but [prototype pollution will eventually be possible](https://portswigger.net/daily-swig/google-engineers-plot-to-mitigate-prototype-pollution).

## Client

```html
<ol id="chat-app">
  <li><input
    id="text-entry"
    type="text"
    placeholder="type hit enter">
  </li>
</ol>

<!-- Idiosyncratic dependencies. -->
<!-- npm install && cp ./node_modules/qrcode/build/qrcode.js . -->
<script src="qrcode.js"></script>
<!-- curl https://raw.githubusercontent.com/chancejs/chancejs/master/chance.js > chance.js -->
<script src="./node_modules/chance/dist/chance.min.js"></script>
<!--
  Sadly only Chrome supports setHTML(). We need DOMPurify as a polyfill
  See : https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
  curl https://raw.githubusercontent.com/cure53/DOMPurify/main/dist/purify.min.js > purify.min.js
-->
<script src="./node_modules/dompurify/dist/purify.js"></script>
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
  const addressLink = window.location.href.split('#')[0] + '#' + address;

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

  const profile = {
    address: keyPairPem.pubKeyFingerprint,
    name: chance.name({ prefix: true }),
    color: chance.color({format: 'hex'}),
    animal: chance.animal(),
    roll: chance.d20(),
  }

  // strip the hash because websocket urls cannot have a hash
  const websocketURL = window.location.toString().replace(/^http/, 'ws').split('#')[0];

  // Start the connection, register a listener/msg handler
  let connection = connect(websocketURL, keyPair, keyPairPem, e => addListItem(`<pre>${e.data}</pre>`));

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
  // Sanitizes
  function addListItem (itemHtml, parent = chatApp) {
    const li = document.createElement("li");
    // li.setHTML(itemHtml);
    li.innerHTML = DOMPurify.sanitize(itemHtml);
    parent.appendChild(li);
  }

  // Read: Open the socket and become capable of sending and recieving messages
  function connect (url, keyPair, keyPairPem, handler) {
    const conn = new WebSocket(url);
    conn.onopen = () => sendMessage(profile);
    conn.onmessage = handler;
    return conn;
  }

  function isConnReady (conn = connection) {
    return (conn !== undefined) && (conn.readyState === conn.OPEN);
  }

  // Send a message over the websocket
  function sendMessage(msg, conn = connection) {
    msg = JSON.stringify(msg, null, 2);
    debug(`sendMessage(${msg})`);
    if (!isConnReady(conn)) throw 'connection is not ready';
    conn.send(msg);
    return conn;
  }
  // close the demo code to not confuse readers
  document.querySelectorAll('details:nth-of-type(1), details:nth-of-type(2)').forEach(detail => detail.removeAttribute('open'));
```

# Address Book
Your address book is where you store your Simpatico contacts.
It is initialized with an entry for yourself.
That entry can generate an invite.
You add a contact with an invitation link which they accept by accessing it.
You can add arbitrary values to the contact, such as name, notes, birthday, or whatever else is useful to you.
Once you have a set of active contacts, you can select them and message them individually.
If they are online, send the message.
If they are offline, the message can be queued for later sending.

## Data sketch
```js
// modelled as an stree, the address book reserves the first row for yourself
const me = {
  address: "Hx464RfvNMOrrdVskMPwjzuXj8vY5/yMHmXTRPZ1YLk=",
}
// subsequent rows are created with an one-time invite
const invited = {
  link: 'https://simpatico.local:8443/chat.md#Hx464RfvNMOrrdVskMPwjzuXj8vY5/yMHmXTRPZ1YLk=,s3cret',
  secret: 's3cret',
  timestamp: 1707867458787,
  expires: 1707867459787,
  via: 'qrcode', //optional field indicating how you got the link to them, qrcode, sms, signal, email, etc.
  info: {}, //optional fields like name, context of meeting, etc can go here.
}

// contacts become accepted when they successfully send you a message that encrypts the secret with their private key and your public key
// note that anyone can send you a message if they have your address, but the message is dropped if not valid.
// this means that a single message must be matched against all pending invites.
// alternatively, we can do this work in the server to avoid extra client work, at the cost of reducing the flexibility of the client.
const accepted = {
  address: "fXHkT7u25M0aBCTvExF83uEjWt+QoECF0COV5UxTHHs=",
}
```




# UI options
Note about UI: I've not yet implemented a UI for this.
[hugging face](https://github.com/huggingface/chat-ui) released theirs recently, and it looks good.
It's made with [svelte](https://svelte.dev/) (which I like) over [Mongo](https://www.mongodb.com/) (which I don't particularly like).

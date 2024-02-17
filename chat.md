# Simpaticode: chat
2023

See:
[home](/),
[litmd](/lit.md),
[crypto](/crypto.md),
[reflector](/reflector.md)

# Simple secure chat system
On load, create a public/private key pair for the browser tab.
This means you create a new, isolated address with each tab or iframe process.

To test chat between processes, create tab via an invitation link.
Each process can generate a unique invitation link by adding it's public key signature and a secret in the link hash.
The guest process will generate its keypair, add a peer record, and then message the peer process.
When the host process receives the guest message, it will convert it's guest record into a peer record.

At this point the guest and host can communicate as peers.
Note that only if both processes are currently connected can they message each other.

Server-side routing is done via public key signature.
This data-structure is ephemeral and dies with the server, and built back up when clients reconnect.
TODO: explore server-side verification of message route validity before routing.

## Keep the websocket connection alive
Websockets naturally die after a time-out period (where is this set?).
Clients will have a keep-alive timer that periodically pings the server.
As a side-effect, we can accurately measure round-trip client-server lag over time.
A connection that dies will be reconnected periodically.

## Process states
Transient states:
  1. The local process is always alive and always has a valid keypair.
  1. A process may or may not be currently connected to the websocket server.
  1. A remote process can be invited but not accepted.
  1. A remote process can be invited and accepted.

In the steady state:
  1. A local process can send a message to a remote process.
  1. A remote process can send a message to a local process.

## STree process state sketch
Row 0 describes the local process, rows 1-3 describe remote processes.
In row 0, we see that we connect, disconnect, and reconnect.
When disconnected we cannot send or receive messages, but can generate invite links.
When connected we can send and receive messages to any accepted remote.
A remote may fail to accept a message, so it moves into an offline state.

The first row can invite() with the special property that it always generates a new row.
Branching peer rows may or may not be useful, grouping messages into "sessions".
```js
/*
    - {process} {local} {connect, disconnect, invite, keepalive}{connected}{disconnected}{connected}
  1 - {process} {remote} {invited, accepted, send, recieve}
  2 - {invited} {accepted} {to:msg} {from:msg}
  2 - {invited} {accepted} {to:msg} {offline}
  3 - {invite}
*/
```
In this stree, we have a root process, which has an address.
Process branches to local, which adds connection and invitation handlers.
Responsibility of the local process is to manage the websocket connection and add invites.
It measures lag and tries to keep the connection alive.

Process branches to remote, which adds accepted, send/receive handlers.
Responsibility of remote processes is to accept invitations, source {from} and sink {to}.
It measures reachability.

The remaining branches are instances of remote, created with a local invite.

## Attempt to visualize this structure
Focus on the tricky parts revolving around sending and accepting invites.

```html
<div id="process-render"></div>
```

```js
import {stree, renderStree, svg, h} from './simpatico.js';

const renderParent = svg.elt('process-render');

const secret = 's3cret';
const error  = (process, {error}) => [{ error }];
const address  = (process, {address}) => [{ address }]; // address shorthand for publicKey, privateKey, pubKeySig
const invite  = (process, {secret, msg, notes}) => [{ secret, msg, notes }];
const acceptInvitation = (process, {address, secret}) => {
  if (process.secret === secret) return [{ handler:'address', address }];
  else return [{error: `secrets didn't match ${process.secret} !== ${secret} ` }]
}

const s = stree([ h(error), h(address), h(invite), h(acceptInvitation), ]);

const localProcessNode = s.add({
  handler: 'address',
  address: 'localAddress'
});

// invite bob with successful acceptance
// target the penultimate node of row 0 to force a branch
s.add({
  handler: 'invite',
  secret,
  note: 'nice man at conferance, bob',
  msg: 'hello from alice please join me',
}, localProcessNode.parent);
s.add({
  handler: 'acceptInvitation',
  secret,
  address:'remoteBob'
});
// invite christi with unsuccessful acceptance.
s.add({handler: 'invite',
  secret,
  note: 'nice woman at dealership, christi',
  msg: 'hello from alice please join me',
}, localProcessNode.parent);
s.add({
  handler: 'acceptInvitation',
  secret: 'wrong',
  address: 'remoteChristi'
});


renderStree(s, renderParent);
```

## Side-effects
Creating a side-effect like creating a websocket is a natural thing to want to do inside a handler.
But this violates the requirement that combine() is pure.
If you recompute residue for a given node, you'll trigger the side-effect again.
One way to avoid this is store residue at every node in the stree, such that combine() need not be computed again.
Maybe mitigate the memory load by labelling the handler as requiring a residue store.

Consider this stree that is all logging statements (e.g. side-effects).

### Logging
```html
<div id="core-render"></div>
```
```js
import {stree, renderStree, svg, h} from './simpatico.js';

const renderParent = svg.elt('core-render');

const logger = (core, {msg}) => {
  if (!core.replay) log(msg);
  return [{msg}];
};
const s = stree([h(logger)]);
const msg = msg => ({handler: 'logger', msg})
s.add(msg('hi 1'))
s.add(msg('hi 2'))
s.add(msg('hi 3'), 1)

const s2 = stree([h(logger), msg('no log 1')]);

renderStree(s, renderParent);
```


### Connection

Modelling a websocket connection with stree.

```html
<div id="connection-render"></div>
```
```js
import {stree, renderStree, svg, h} from './simpatico.js';

const renderParent = svg.elt('connection-render');

const websocketURL = window.location.toString().replace(/^http/, 'ws').split('#')[0];
const isConnReady = (conn) =>  (conn !== undefined) && (conn.readyState === conn.OPEN);
const {CONNECTING, OPEN, CLOSING, CLOSED} = WebSocket;
const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// events target the same stree row as the connection lives. for now target root with a special number, +infinity (0 is reserved for root node)
// note that calling s.add inside this handler does not constitute a side-effect, and so is allowed
const connect = (ctx, {websocketURL, row}) => {
  const connection = (ctx.replay) ? {} : new WebSocket(websocketURL);
  if (row === 0 ) row = Number.POSITIVE_INFINITY;
  connection.onclose = (e) => s.add({open: false, state: CLOSING, connection: null}, row);
  connection.onerror = (e) => s.add({error: e}, row);
  connection.onopen = (e) => s.add({open: true, state: OPEN}, row);
  connection.onmessage = (e) => s.add({handler: 'receive', msg: e.data}, row);
  return [{websocketURL, connection, open: false, state: CONNECTING}];
}

// todo: support retry
const send = (ctx, {msg}) => {
  // we can also check ctx state for this, eventually
  if (ctx.replay) return [{out: msg}];
  if (!ctx.connection) throw 'connection is does not exist';
  if (!ctx.open) throw `connection is not ready, in state ${states[ctx.state]}`;
  try{
    ctx.connection.send(msg);
    log('message sent ' + msg);
  } catch (e){
      return {error: e}
  }

  return [{out: msg}];
};
const msg = msg => ({handler: 'send', msg})

const receive = (ctx, {msg}) => [{in: msg}];
const close = (ctx, _) => [ctx.connection.close()];

// add the handlers
const s = stree([h(connect),h(close),h(send),h(receive)]);
assertEquals(false, !!s.residue().replay);

//trigger a connect. we know our connection is row 0
s.add({handler: 'connect', websocketURL, row: 0});

// wait a second, and then send a message
setTimeout(() => {
    s.add(msg('hello from stree'))
}, 1000);

window.s = s;

renderStree(s, renderParent);
```


## Client

```html
<ol id="chat-app">
  <li><input
    id="text-entry"
    type="text"
    placeholder="type hit enter">
  </li>
</ol>

<!-- Idiosyncratic, global dependencies. -->
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
///
  import * as wcb from './node_modules/webcryptobox/index.js';

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

  const myAddress = keyPairPem.pubKeyFingerprint;
  // remove the prev hash (present in invite links) and add my fingerprint
  const myAddressLink = window.location.href.split('#')[0] + '#' + myAddress;

  // Get an address out of the hash
  let parentAddress='';
  if (window.location.hash){
    parentAddress = window.location.hash;
  } else {
    // For now, just send messages to ourself.
    parentAddress = myAddress;
  }

  addListItem(`<pre>${JSON.stringify(keyPairPem, null, 2)}</pre>`);
  addListItem(`<a href="${myAddressLink}">${myAddressLink}</a>`);
  addListItem(`parentAddress: ${parentAddress}`);
  addListItem(`address QR code: <canvas id="qr"></canvas>`);

  QRCode.toCanvas(document.getElementById('qr'), myAddressLink, debug);

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

# Notes
The `qrcode` library is problematic to use with `npm install`. It uses `node_gyp` which fails for me, so I've committed the bundle as a workaround.

HTML is sanitized, but [prototype pollution](https://portswigger.net/daily-swig/google-engineers-plot-to-mitigate-prototype-pollution) will eventually be possible when handlers flow over the wire.

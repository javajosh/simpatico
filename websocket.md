# Websocket
2024

Modeling client and server websocket connections in an [stree](stree.md) with both real and mock WebSockets.
Also explore state transitions related to the [chat](chat.md) protocol.


See:
[home](/),
[chat](/chat.md),
[reflector](/reflector.md)

# Introduction
Model a websocket with combine, then allow branching (and multiple websockets) in stree.
Perhaps one day [redbean will get websockets](https://github.com/jart/cosmopolitan/pull/967).

# Wrapping a Websocket in an Stree

Start with a thin wrapper around websocket.
Call active methods (`connect`, `close`, and `send`) with objects.
Record passive callbacks (`onopen`, `onclose`, `onmessage` and `onerror`) with objects.
We ONLY send and receive (JSON) objects.

```html
<div id="connection-render"></div>
```

```js
import {combineRules, stree, renderStree, svg, h, DELETE, equals, encodeBase64URL, decodeBase64URL} from './simpatico.js';
import {connect, send, register1, register2, register3, register4, sendEnvelop, deliverEnvelop, acceptEnvelop, state, summarize, generateKeyPair} from "./websocket.js";
import * as wcb from './node_modules/webcryptobox/index.js';

const renderParent = svg.elt('connection-render');


const s = new stree({}, (a,b) => combineRules(a,b,null,true), summarize)

const conn = s.addAll([h(connect), h(send), h(state)]); conn.add({cap: 'common handlers'});
  const server = conn.addAll([ h(register1),  h(register3), h(deliverEnvelop) ]); server.add({cap: 'server handlers'});
  const client = conn.addAll([ h(register2),  h(register4), h(sendEnvelop), h(acceptEnvelop) ]); client.add({cap: 'client handlers'});

const serverKeyPair = await generateKeyPair();
const makeConnectionPair = async (websocketURL = 'wss://example.com', delay=50) => {
  const clientKeyPair = await generateKeyPair();
  const connServer = server.add({server: true, ...serverKeyPair});
  const connClient = client.add({server: false, ...clientKeyPair});
  connServer.add({handler: 'connect', websocketURL, conn: connServer, remote: connClient, delay});
  connClient.add({handler: 'connect', websocketURL, conn: connClient, remote: connServer, delay});
}
let i = 4;
while (i--) await makeConnectionPair();


// Send and recieve similar messages to both connections
[
  // ()=>conn1.addLeaf({handler: 'send', msg: {value: 'hey from conn 1!', a:1, b:1}}),
  // ()=>conn2.addLeaf({handler: 'send', msg: {value: 'wassup from conn 2!', a:2, b:2}}),
  // ()=>conn1.addLeaf({handler: 'send', msg: {handler: 'invite1'}}),
  // ()=>conn2.getLeaf().residue.ws.receive(JSON.stringify({b:1})),

  ()=>renderStree(s, renderParent),
  ()=>log('connection summary', s.summary),
].forEach((fn, i)=>setTimeout(fn, 50*(i+5)));

```
## Thoughts
It would be cool to branch connections for testing, showing off all the error modes.
However we'd need to take care of the `ws` member which shouldn't be shared.
There's a general issue with keeping references to outside objects in residue that may be resolved with a naming convention like "prepend with _ to ignore"

Simulate multiple connecting clients, and have the server side maintain a lookup table by clientPublicKeySig via `summary`.
Problem: the rendered results are sometiems different. Some connections don't complete the protocol.
With any luck this is an artifact of testing, but it is concerning.

Simulate clients communicating with each other. Pick another signature from summary at random and send something. In the test harness we can do this in the state-machine.
```html
<div id="summary-render"></div>
```

```js
import {stree, renderStree, svg, h, DELETE, equals} from './simpatico.js';
import {MockWebSocket} from "./websocket.js";
import * as wcb from './node_modules/webcryptobox/index.js';

const summarize = (summary, node) => {
  if (node.id === 0) return {};
  const parent = node.parent;
  const residue = node.residue;
  if (parent.residue.state !== VERIFIED && residue.state === VERIFIED) {
    summary[node.residue.publicKeySig] = node;
  }
  if (parent.residue.state === VERIFIED && residue.state !== VERIFIED) {
    delete summary[node.residue.publicKeySig];
  }
  return summary;
}
const s = new stree({}, (a,b) => combineRules(a,b,null,true), summarize)

const renderParent = svg.elt('summary-render');

```


# Async handlers
The real invitation protocol requires both sync and async computation from the client and server.
The sync computation can and should be handled out of the stree, and the results added to context.
The async computation is trickier - one solution is to return something that indicates computation was requested, and in the promise then() use the computation to *really* react.

```js
import {stree, h} from '/simpatico.js';
import * as wcb from './node_modules/webcryptobox/index.js';

const compute = ({},{node}) => {
  wcb.generateKeyPair().then(keyPair => {
    return {
      publicKeyPem: wcb.exportPublicKeyPem(keyPair.publicKey),
      privateKeyPem: wcb.exportPrivateKeyPem(keyPair.privateKey),
    };
  }).then(keyPairPem => {
    const t1 = node.getLeaf().residue.t1;
    const t2 = Date.now();
    const dt = t2-t1;
    node.addLeaf({result: keyPairPem, dt})
  });
  return [{result: {}, t1: Date.now()}];
};
const s = stree(h(compute));
const node = s.add({});
s.add({handler: 'compute', node});
window.s = s;
```

## Connection Registration Protocol
Simpatico requires a challenge/response protocol to register your public key.
The challenge exists to prove that your public key is "real" in the sense it can be used to encrypt from and to another public key.
Without this challenge, a malicious client could connect and associate their connection with an arbitrary string.

The server sends its public key, and then expects a response with your public key and a clear-text message and that same message encrypted by your private key to its public key.
We pick as that message a simple timestamp from Date.now(), which is ms from the Epoch and can be used to measure client/server time-skew.
WebSockets support text, but we will want more structure so every message must be wrapped in an unencrypted JSON envelope.
The goal of the client at this point is to get `{registered: true}`.

To support this protocol we prep the stree with the data it needs to respond to the server challenge.
The client expects the first server message after connection to be the challenge, and responds appropriately.

```js
// protocol definitions
const MAX_MESSAGE_LENGTH = 4 * 1024;

const SERVER_CHALLENGE_PATTERN = {
  handler: 'serverChallenge',
  publicKey: ['str', 'between', 200, 300],
  timestamp: ['num'],
};
const CLIENT_CHALLENGE_PATTERN = {
  handler: 'clientChallenge',
  publicKey: ['str', 'between', 200, 300],
  publicKeySig: ['str', 'between', 40, 50],
  timestamp: ['num'],
  encryptedTimestamp: ['str'],
};
const SERVER_CHALLENGE_RESULT_PATTERN = {
  handler: 'serverChallengeResult',
  registered : ['bool']
};
const MESSAGE_PATTERN = {
  from: ['str', 'between', 40, 50 ],
  to: ['str', 'between', 40, 50 ],
  encryptedMessage : ['str'],
};

const sanitize = msg =>{
  if (msg.length > MAX_MESSAGE_LENGTH) throw `msg too long ${msg.length}`;
  const parsed = JSON.parse(msg);
  return parsed;
}
```

## Invitation Protocol
Simpatico supports sharing a public key signature via URL, which must be sent out-of-band (email, instant message, QR code, etc.)
This sharing should follow the invitation protocol

## Message Protocol
Before sending a message to another party, the client must know their public key and/or public key signature.
For the message to send successfully, the other party must be both connected and registered.
Let's assume that was successful and add friend addresses to our addressbook.
For test code, we'll use easy to read short strings like "pubKey1", "pubKeySig1", "privKey1" etc. but normally these would be long, random-looking strings.


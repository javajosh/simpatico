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
import {stree, renderStree, svg, h, DELETE, equals} from './simpatico.js';
import {MockWebSocket} from "./websocket.js";
import * as wcb from './node_modules/webcryptobox/index.js';

const renderParent = svg.elt('connection-render');

const {CONNECTING, OPEN, CLOSING, CLOSED} = MockWebSocket;
const stateNamesByIndex = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
const state2 = ['UNREGISTERED', 'CHALLENGED', 'RESPONDED', 'VERIFIED', 'UNVERIFIED', 'ERROR', 'COMPUTING'];
const [UNREGISTERED, CHALLENGED, RESPONDED, VERIFIED, UNVERIFIED, ERROR, COMPUTING] = state2;
const delay = 50;

const connect = (_ , {websocketURL, conn, remote, delay}) => {
  const ws = new MockWebSocket(websocketURL, delay);
  ws.onopen =    (e) => conn.addLeaf({handler: 'state', conn, state: OPEN});
  ws.onclose =   (e) => conn.addLeaf({handler: 'state', conn, state: CLOSED});
  ws.onmessage = (e) => conn.addLeaf(JSON.parse(e.data)); //eventually call receive
  ws.onerror =   (e) => conn.addLeaf({error: e});
  return [{ws, state: CONNECTING, conn, remote}];
}

const send = ({ws, remote}, {msg}) => {
  const msgString = JSON.stringify(msg);
  ws.send(msgString);
  // setTimeout prevents reentrance into stree.add(); note this line is only executed in a test environemnt
  if (remote) setTimeout(()=>remote.getLeaf().residue.ws.receive(msgString));
  return [];
};

// Eventually we'll use this to sanitize and parse. For now, that's done in-line in the onmessage handler in connect
// const receive = ({input}, _) => {
//   const receivedMessage = JSON.parse(input);
//   return [receivedMessage];
// };

const state = ({ws, state:prev}, {state:curr, active=false}) => {
  const result = [];
  log('state', prev, curr);

  // Put state-machine here
  if (prev !== OPEN && curr === OPEN){
    // kick off the protocol from the server connection; test harness only
    if (ws.id === 1) result.push({handler: 'register1'})
  }

  result.push({state: curr});
  return result;
}

const generateKeyPair = async () => {
  const keyPair = await wcb.generateKeyPair();
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyPem:  await wcb.exportPublicKeyPem(keyPair.publicKey),
    privateKeyPem: await wcb.exportPrivateKeyPem(keyPair.privateKey),
    publicKeySig: await wcb.sha256Fingerprint(keyPair.publicKey),
  };
}

// Executed by the server onopen - send server public key
const register1 = ({publicKeyPem}) => {
  const t1 = Date.now();
  return [{state2: CHALLENGED, t1}, {handler: 'send', msg: {handler: 'register2', publicKeyPem, t1}}];
}
const invite2 = () => {
  return [{state2: RESPONDED},{handler: 'send', msg: {handler: 'invite3'}}];
}
// Executed by the server - decrypt the message and compare with the clear text version.
const register3 = ({privateKey, conn, t1}, {clearText, cypherText, publicKey: clientPublicKey, publicKeySig}) => {
  const clearObj = JSON.parse(clearText);

  wcb.importPublicKeyPem(clientPublicKey)
    // TODO .then(() => wcb.sha256Fingerprint(clientPublicKey).then(sig => {if (sig !== publicKeySig) throw "signature does not match"}))
    .then(publicKey => wcb.decryptFrom({box: wcb.decodeHex(cypherText), privateKey, publicKey}))
    .then(box => wcb.encodeText(box))
    .then(json => JSON.parse(json))
    .then(obj => {
        const state2 = equals(clearObj, obj) && (obj.t1 === t1) ? VERIFIED : UNVERIFIED;
        conn.addLeaf({state2}).add({handler: 'send', msg: {handler: 'register4', state2}});
    })
    .catch(error => {
      log(error)
      conn.addLeaf({state2: ERROR, error})
    });
  return [{state2: COMPUTING}];
}
// Executed by the client - just record verification state.
const register4 = ({},{state2}) => {
  return [{state2}];
}

const websocketURL = 'wss://example.com';
const s = new stree();
// we could separate handlers between client and server, but don't bother.
const conn = s.addAll([h(connect), h(send), h(state), h(register1), h(register2), h(register3), h(register4)]);
conn.add({cap: 'force branch'});

// Make two connections
const kp1 = await generateKeyPair();
const kp2 = await generateKeyPair();
const conn1 = conn.add(kp1);
const conn2 = conn.add(kp2);
conn1.add({handler: 'connect', websocketURL, conn:conn1, remote:conn2, delay});
conn2.add({handler: 'connect', websocketURL, conn:conn2, remote:conn1, delay});


// Send and recieve similar messages to both connections
[
  // ()=>conn1.addLeaf({handler: 'send', msg: {value: 'hey from conn 1!', a:1, b:1}}),
  // ()=>conn2.addLeaf({handler: 'send', msg: {value: 'wassup from conn 2!', a:2, b:2}}),
  // Trigger our simple 4-way handshake
  // ()=>conn1.addLeaf({handler: 'send', msg: {handler: 'invite1'}}),
  // ()=>conn2.getLeaf().residue.ws.receive(JSON.stringify({b:1})),

  ()=>renderStree(s, renderParent),
].forEach((fn, i)=>setTimeout(fn, delay*(i+5)));

window.registrationHandlers = [h(connect), h(send), h(state), h(register1), h(register2), h(register3), h(register4)];

```
## Thoughts
Another (potentially more useful) way to mitigate is to add an 'observers' facility to *stree*.
These are handlers with two special properties: they execute after the message cascade, and are triggered by residue changes.
(It's tempting to want to define/use them in *combine* but the requirement to "wait" for cascade resolution prevents this.)
Such an observer facility would make the visualization a lot better in a lot of ways, since the triggering value will be added before, not after, the secondary effects.
In fact, a good way to do it is to add an `observers` field to residue, which is ignored by combine but used in `stree.add()` to generate more msgs.
An observer is a function that takes prev and curr residue and produces an array of msgs.
But before implementing this, I want to see how far I can get with just handlers.

It would be cool to branch connections for testing, showing off all the error modes.
However we'd need to take care of the `ws` member which shouldn't be shared.
There's a general issue with keeping references to outside objects in residue that may be resolved with a naming convention like "prepend with _ to ignore"

Next up is to simulate multiple connecting clients, and have the server side maintain a lookup table by clientPublicKeySig.
After that, we simulate clients communicating with each other.
```html
<div id="connection-render"></div>
```

```js
import {stree, renderStree, svg, h, DELETE, equals} from './simpatico.js';
import {MockWebSocket} from "./websocket.js";
import * as wcb from './node_modules/webcryptobox/index.js';

const renderParent = svg.elt('connection-render');

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


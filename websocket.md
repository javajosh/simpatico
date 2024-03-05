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
import {MockWebSocket} from "./websocket.js";
import * as wcb from './node_modules/webcryptobox/index.js';

const renderParent = svg.elt('connection-render');

const {CONNECTING, OPEN, CLOSING, CLOSED} = MockWebSocket;
const stateNamesByIndex = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
const state2 = ['UNREGISTERED', 'CHALLENGED', 'RESPONDED', 'VERIFIED', 'UNVERIFIED', 'ERROR', 'COMPUTING'];
const [UNREGISTERED, CHALLENGED, RESPONDED, VERIFIED, UNVERIFIED, ERROR, COMPUTING] = state2;
const delay = 10;

const connect = (_ , {websocketURL, conn, remote, delay}) => {
  const ws = new MockWebSocket(websocketURL, delay);
  ws.onopen =    (e) => conn.addLeaf({handler: 'state', conn, state: OPEN});
  ws.onclose =   (e) => conn.addLeaf({handler: 'state', conn, state: CLOSED});
  ws.onmessage = (e) => conn.addLeaf(JSON.parse(e.data)); //eventually call receive handler
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

const getRandomProperty = (obj, omitKey) => {
  const keys = Object.keys(obj);
  if (keys.length === 0) throw 'empty object'
  let found;
  // while (found !== omitKey)
    found = keys[ keys.length * Math.random() << 0];
  return obj[found];
}

const state = ({ws, conn, remote, publicKeySig, state:prevState, state2:prevState2}, {state:currState, state2:currState2, active=false}) => {
  const result = [];
  // log('state', prevState, currState);

  // Put rest of the state-machine here
  // kick off the protocol from the server connection
  if (prevState !== OPEN && currState === OPEN && conn.residue.server){
    result.push({handler: 'register1'})
  }
  // send a message to another random client
  if (prevState2 !== VERIFIED && currState2 === VERIFIED && !conn.residue.server){
    const clients = remote.summary;
    if (Object.keys(clients).length >= 2 ) {
      const target = getRandomProperty(clients, publicKeySig);
      log('sending', {handler: 'reflect', from: publicKeySig, to: target.residue.publicKeySig, message: {}});
      // result.push({handler: 'send', msg: {handler: 'reflect', from: publicKeySig, to: target.residue.publicKeySig, message: {}}})
    }
  }

  if (currState) result.push({state: currState});
  if (currState2) result.push({state2: currState2});
  return result;
}

const generateKeyPair = async () => {
  const keyPair = await wcb.generateKeyPair();
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyPem:  await wcb.exportPublicKeyPem(keyPair.publicKey),
    privateKeyPem: await wcb.exportPrivateKeyPem(keyPair.privateKey),
    publicKeySig: encodeBase64URL(await wcb.sha256Fingerprint(keyPair.publicKey)),
  };
}

// Executed by the server onopen - send server public key
const register1 = ({publicKeyPem}) => {
  const t1 = Date.now();
  return [{handler: 'state', state2: CHALLENGED}, {t1}, {handler: 'send', msg: {handler: 'register2', publicKeyPem, t1}}];
}

// Executed by the client - use server public key and client private key to encrypt a message back
// In this case we just encrypt two timestamps and their difference
const register2 = ({publicKey: clientPublicKey, publicKeyPem: clientPublicKeyPem, privateKey, publicKeySig, conn}, {publicKeyPem: serverPublicKeyPem, t1}) => {
  const t2 = Date.now();
  const messageText = JSON.stringify({t1, t2, dt: t2-t1});
  const messageArray = wcb.decodeText(messageText);
  wcb.importPublicKeyPem(serverPublicKeyPem)
    .then(serverPublicKey => wcb.encryptTo({message: messageArray, privateKey, publicKey: serverPublicKey}))
    .then(box => wcb.encodeHex(box))
    .then(encoded => conn.addLeaf({handler: 'state', state2: RESPONDED}).add({handler: 'send', msg: {handler: 'register3', clearText: messageText, cypherText: encoded, publicKeySig, publicKey: clientPublicKeyPem}}))
    .catch(error => {
      log(error)
      conn.addLeaf({handler: 'state', state2: ERROR, error})
    });
  return [{handler: 'state', state2: COMPUTING, serverPublicKeyPem}];
}

// Executed by the server - decrypt the message and compare with the clear text version.
const register3 = ({privateKey, conn, t1}, {clearText, cypherText, publicKey: clientPublicKey, publicKeySig}) => {
  const clearObj = JSON.parse(clearText);

  wcb.importPublicKeyPem(clientPublicKey)
    .then(publicKey => Promise.all([
        publicKey,
        wcb.sha256Fingerprint(publicKey),
    ]))
    .then(([publicKey, sig]) => {
        const encodedSig =  encodeBase64URL(sig);
        if (encodedSig !== publicKeySig) throw 'signature inconsistent with public key';
        if (conn.summary[encodedSig]) throw 'signature is not unique';
        return wcb.decryptFrom({box: wcb.decodeHex(cypherText), privateKey, publicKey})
    })
    .then(box => {
        const obj = JSON.parse(wcb.encodeText(box));
        const state2 = equals(clearObj, obj) && (obj.t1 === t1) ? VERIFIED : UNVERIFIED;
        conn.addLeaf({handler: 'state', state2}).add({handler: 'send', msg: {handler: 'register4', state2}});
    })
    .catch(error => {
      log(error);
      conn.addLeaf({handler: 'state', state2: ERROR, error});
      // todo close the connection
    });
  return [{handler: 'state', state2: COMPUTING}];
}

// Executed by the client - just record verification state.
const register4 = ({},{state2}) => {
  return [{handler: 'state', state2}];
}


const summarize = (summary, node) => {
  if (node.id === 0) return {};
  if (node.residue.server) return summary;
  const parent = node.parent;
  const residue = node.residue;
  if (parent.residue.state2 !== VERIFIED && residue.state2 === VERIFIED) {
    summary[node.residue.publicKeySig] = node;
  }
  if (parent.residue.state2 === VERIFIED && residue.state2 !== VERIFIED) {
    delete summary[node.residue.publicKeySig];
  }
  return summary;
}

const s = new stree({}, (a,b) => combineRules(a,b,null,true), summarize)
// we could separate handlers between client and server, but don't bother.
const conn = s.addAll([h(connect), h(send), h(state), h(register1), h(register2), h(register3), h(register4)]);
conn.add({cap: 'force branch'});

// Make two connections - the first one is a server, the second the client
const serverKeyPair = await generateKeyPair();
const makeConnectionPair = async (websocketURL = 'wss://example.com') => {
  const clientKeyPair = await generateKeyPair();
  const conn1 = conn.add({server: true, ...serverKeyPair});
  const conn2 = conn.add({server: false, ...clientKeyPair});
  conn1.add({handler: 'connect', websocketURL, conn: conn1, remote: conn2, delay});
  conn2.add({handler: 'connect', websocketURL, conn: conn2, remote: conn1, delay});
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
].forEach((fn, i)=>setTimeout(fn, delay*(i+5)));

window.registrationHandlers = [h(connect), h(send), h(state), h(register1), h(register2), h(register3), h(register4)];

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


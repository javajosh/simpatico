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

# MockWebSocket
We want to work with websockets locally so mock one up. (For another approach, see [jest-websocket-mock](https://www.npmjs.com/package/jest-websocket-mock))
```js
class MockWebSocket {

  static CONNECTING = 0;
  static OPENING = 1;
  static OPEN = 2;
  static CLOSING = 3;
  static CLOSED = 4;
  static NEXT_ID = 0;

  constructor(url, delay=1000) {
    this.url = url;
    this.delay = delay;
    this.id = MockWebSocket.NEXT_ID++;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;

    this.connect();
  }

  connect() {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPENING;
      if (this.onopen) {
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          this.onopen();
        }, this.delay); // Simulating delay between OPENING and OPEN
      }
    }, this.delay); // Simulating connection delay
  }

  send(data) {
    if (this.readyState === MockWebSocket.OPEN) {
      console.log('Sent:', data);
    } else {
      console.error('Error: Connection not open.');
    }
  }

  close() {
    if (this.readyState === MockWebSocket.OPEN) {
      this.readyState = MockWebSocket.CLOSING;
      console.log('Socket closing');
      setTimeout(() => {
        this.readyState = MockWebSocket.CLOSED;
      }, this.delay); // Simulating delay between CLOSING and CLOSED
    } else {
      console.error('Error: Connection not open.');
    }
  }

  // Simulate a message receipt
  receive(message) {
    if (this.readyState === MockWebSocket.OPEN && this.onmessage) {
      this.onmessage({ data: message });
    }
  }

  // Simulate a remote message close
  remoteClose() {
    if (this.readyState === MockWebSocket.OPEN) {
      this.readyState = MockWebSocket.CLOSING;

      setTimeout(() => {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
          this.onclose();
        }
      }, this.delay); // Simulating delay between CLOSING and CLOSED
    }
  }
}

// export {MockWebSocket}
window.MockWebSocket = MockWebSocket;

```
Ordinary usage (not executed):

```js
/// import {MockWebSocket} from "./chat.js";
const MockWebSocket = window.MockWebSocket;
const delay = 100;
const ws = new MockWebSocket('wss://example.com', delay);

ws.onopen = () => {
  console.log('Connection opened');
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

ws.onclose = () => {
  console.log('Connection closed');
};

setTimeout(() => ws.receive('Hi there from the server'), delay * 3);
setTimeout(() => ws.send('Hi there from the client'), delay * 4);
setTimeout(() => ws.remoteClose(), delay * 5);

```

# Wrapping a Websocket in an Stree
The idea here is to represent both passive and active events as objects targeting handlers.
The `connect()` function creates a new websocket, adds a reference to residue and adds all event listeners, which are themselves adding objects back into the stree.
This approach requires stable access to stree rows, which is accomplished here by adding an explicit row id to the connect handler.
(A better approach would be to add a "virtual node" to each row that always points to the last element to [stree](/stree.md) but that's not done yet.)

Future work: support message storage/retry, support keepAlive with round-trip lag measurement.

```html
<div id="connection-render"></div>
```

```js
///
import {stree, renderStree, svg, h} from './simpatico.js';
// import {MockWebSocket} from "./chat.js";
const MockWebSocket = window.MockWebSocket;

const renderParent = svg.elt('connection-render');

const delay = 100;
const websocketURL = window.location.toString().replace(/^http/, 'ws').split('#')[0];
const {CONNECTING, OPEN, CLOSING, CLOSED} = WebSocket;
const stateNamesByIndex = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// events target the same stree row as the connection lives. for now target root with a special number, +infinity (0 is reserved for root node)
// note that calling s.add inside this handler does not constitute a side-effect, and so is allowed
const connect = (ctx, {row}) => {
  const ws = new MockWebSocket(websocketURL, delay);
  if (row === 0 ) row = Number.POSITIVE_INFINITY;
  ws.onclose = (e) => s.add({open: false, state: CLOSED, ws: null}, row) && console.log('connection closed ' + row);
  ws.onerror = (e) => s.add({error: e}, row);
  ws.onopen = (e) => s.add({open: true, state: OPEN}, row);
  ws.onmessage = (e) => s.add({handler: 'receive', msg: e.data}, row);
  return [{websocketURL, ws, open: false, state: CONNECTING}];
}

// todo: support retry
const send = (ctx, {msg}) => {
  // we can also check ctx state for this, eventually
  if (!ctx.ws) throw 'ws is does not exist';
  if (!ctx.open) throw `ws is not ready, in state ${stateNamesByIndex[ctx.state]}`;
  try{
    ctx.ws.send(msg);
  } catch (e){
      return {error: e}
  }

  return [{out: msg}];
};

const receive = (ctx, {msg}) => {
  console.log('Recieved: ' + msg)
  return [{in: msg}];
};
// do we need one handler to trigger client close, and another to detect server close
const close = (ctx, _) => [ctx.ws.close()];

// add the handlers
const s = stree([h(connect),h(close),h(send),h(receive)]);
const node = s.add({websocketURL});
s.add({desc: 'this object forces new rows to branch from root'});

s.add({handler: 'connect', row: -1}, node);
s.add({handler: 'connect', row: -2}, node);

setTimeout(()=>s.add({handler: 'send', msg: 'hello from client 1'}, -1), delay * 3 );
setTimeout(()=>s.residue(-1).ws.receive('hello from server 1'), delay * 4 );
setTimeout(()=>s.residue(-1).ws.remoteClose(), delay * 5 );

setTimeout(()=>s.add({handler: 'send', msg: 'hello from client 2'}, -2), delay * 3 );
setTimeout(()=>s.residue(-2).ws.receive('hello from server 2'), delay * 4 );
setTimeout(()=>s.residue(-2).ws.remoteClose(), delay * 5 );

// setTimeout(()=>renderStree(s, renderParent, false), delay * 6 );
renderStree(s, renderParent);
```

# Building the protocol
The Simpatico chat protocol has three parts: registering a client connection's public key, inviting other public keys to be your 'friend', and the message protocol which describes the steady-state flow of messages between connections.

An unusual quality of Simpatico chat (Simpatichat) is its simplicity.
We think in terms of communicating processes, with each process having one websocket connection to one server, and the potential to message any registered connection.

The design balances the threat of malefactors with ease of implementation and the ability to run on modest server hardware.
PKI is famously compute-intensive and so we rely on clients to ver

## Connection Registration Protocol
Simpatico requires a challenge/response protocol to register your public key.
The challenge exists to prove that your public key is "real" in the sense it can be used to encrypt from and to another public key. Without this challenge, a malicious client can connect and associate their connection with an arbitrary string.

The server sends its public key, and then expects a response with your public key and a clear-text message and that same message encrypted by your private key to its public key.
We pick as that message a simple timestamp from Date.now(), which is ms from the Epoch and can be used to measure client/server time-skew.
WebSockets support text, but we will want more structure so every message must be wrapped in an unencrypted JSON envelope.
The goal of the client at this point is to get `{registered: true}`.

To support this protocol we prep the stree with the data it needs to respond to the server challenge.
The client expects the first server message after connection to be the challenge, and responds appropriately.


```html
<div id="registration-protocol-render"></div>
```
```js

import * as wcb from './node_modules/webcryptobox/index.js';
import {stree, renderStree, svg, h} from './simpatico.js';
import { validate } from "./friendly.js";

const renderParent = svg.elt('registration-protocol-render');
const delay = 100;
const {CONNECTING, OPEN, CLOSING, CLOSED} = MockWebSocket;
const stateNamesByIndex = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// generate information we need
const serverKeyPair = await wcb.generateKeyPair();
const serverKeyPairPem = {
  publicKeyPem:  await wcb.exportPublicKeyPem(serverKeyPair.publicKey),
  privateKeyPem: await wcb.exportPrivateKeyPem(serverKeyPair.privateKey),
};

const clientKeyPair = await wcb.generateKeyPair();
const clientKeyPairPem = {
  publicKeyPem:  await wcb.exportPublicKeyPem(clientKeyPair.publicKey),
  privateKeyPem: await wcb.exportPrivateKeyPem(clientKeyPair.privateKey),
  publicKeySig: 'foobar',
};
// clientKeyPairPem.publicKeySig= c.base64EncodeBuffer(await wcb.sha256Fingerprint(clientKeyPairPem.publicKey));

// protocol definitions
const MAX_MESSAGE_LENGTH = 4 * 1024;
const CHALLENGE_PATTERN = {
  publicKey: ['string', 'between', 200, 300],
  timestamp: ['number'],
};
const CHALLENGE_RESPONSE_PATTERN = {
  publicKey: ['string', 'between', 200, 300],
  publicKeySig: ['string', 'between', 40, 50],
  timestamp: ['number'],
  encryptedTimestamp: ['string'],
};
const MESSAGE_PATTERN = {
  from: ['string', 'between', 40, 50 ],
  to: ['string', 'between', 40, 50 ],
  encryptedMessage : ['string'],
};

// redefine handlers here to take advantage of s closure.
const connect = (ctx, {row}) => {
  const websocketURL = ctx.websocketURL;
  const ws = new MockWebSocket(ctx.websocketURL, delay);
  if (row === 0 ) row = Number.POSITIVE_INFINITY;
  ws.onclose = (e) => s.add({open: false, state: CLOSING, ws: null}, row);
  ws.onerror = (e) => s.add({error: e}, row);
  ws.onopen = (e) => s.add({open: true, state: OPEN}, row);
  ws.onmessage = (e) => s.add({handler: 'receive', msg: e.data}, row);
  return [{websocketURL, ws, open: false, state: CONNECTING}];
}

const send = (ctx, {msg}) => {
  // we can also check ctx state for this, eventually
  if (!ctx.ws) throw 'ws is does not exist';
  if (!ctx.open) throw `ws is not ready, in state ${stateNamesByIndex[ctx.state]}`;
  try{
    ctx.ws.send(msg);
  } catch (e){
    return {error: e}
  }
  return [{out: msg}];
};

const close = (ctx, _) => [ctx.ws.close()];

// override receive handler to trigger serverChallenge handler as long as we aren't registered
const receive = (ctx, {msg}) => {
  if (!ctx.registered){ // todo: i want this to be a new node in the stree
    return [{handler: 'serverChallenge', challenge: msg}]
  }
  return [{in: msg}];
};

// the register handler gets client properties from residue, and server values from message contents.
const serverChallenge = (ctx, {challenge}) => {
  const {publicKey: serverPublicKey, timestamp: serverTimestamp} = challenge;
  const {publicKey: clientPublicKey, privateKey: clientPrivateKey, publicKeySig} = ctx;
  const timestamp = Date.now();
  // const encryptedTimestamp = await wcb.encryptTo(timestamp, clientPrivateKey, serverPublicKey);
  const encryptedTimestamp = 'gibberish';

  const challengeResponse = {
    publicKey: clientPublicKey,
    publicKeySig,
    timestamp,
    encryptedTimestamp,
  }

  return [{handler: 'send', msg: JSON.stringify(challengeResponse)}];
}
const serverChallengeResponse = (ctx, {}) => {
  // todo deal with failure case - although perhaps the server will just close the connection
  return [{registered: true}];
}

const s = stree([h(connect),h(close),h(send),h(receive),h(serverChallenge),h(serverChallengeResponse)]);
const node = s.add({
  websocketURL: 'wss://example.com',
  registered: false,
  publicKey: clientKeyPair.publicKey,
  privateKey: clientKeyPair.privateKey,
});
s.add({desc: 'this object forces new rows to branch from root'});
s.add({handler: 'connect', row: -1}, node);
// after connect, the server responds with a challenge
setTimeout(()=>s.residue(-1).ws.receive(JSON.stringify({publicKey: 'foobar', timestamp: Date.now()})), delay * 4 );

renderStree(s, renderParent);
```


## Invitation Protocol
Simpatico supports sharing a public key signature via URL, which must be sent out-of-band (email, instant message, QR code, etc.)
This sharing should follow the invitation protocol

## Message Protocol
Before sending a message to another party, the client must know their public key and/or public key signature.
For the message to send successfully, the other party must be both connected and registered.
Let's assume that was successful and add friend addresses to our addressbook.
For test code, we'll use easy to read short strings like "pubKey1", "pubKeySig1", "privKey1" etc. but normally these would be long, random-looking strings.


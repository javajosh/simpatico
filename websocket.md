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
Server connection triggers a 4-way registration handshake that ends in a `VERIFIED` state at both ends.
In test, client `VERIFIED` state triggers a `sendEvelop` to a random peer.

```html
<div id="server-tree-render"></div>
<div id="client-trees-render"></div>
```

```js
import {combineRules, stree, renderStree, renderStrees, svg, h, DELETE, equals, encodeBase64URL, decodeBase64URL} from './simpatico.js';
import {state, connect, send, register1, register2, register3, register4, sendEnvelop, deliverEnvelop, acceptEnvelop, summarizeServer, summarizeClient, generateKeyPair, MockWebSocket} from "./websocket.js";
import * as wcb from './node_modules/webcryptobox/index.js';

const renderServerTreeParent = svg.elt('server-tree-render');
const renderClientTreesParent = svg.elt('client-trees-render');

// Override the state handler for testing.
const {CONNECTING, OPEN, CLOSING, CLOSED} = MockWebSocket;
const state2 = ['UNREGISTERED', 'CHALLENGED', 'RESPONDED', 'VERIFIED', 'UNVERIFIED', 'ERROR', 'COMPUTING'];
const [UNREGISTERED, CHALLENGED, RESPONDED, VERIFIED, UNVERIFIED, ERROR, COMPUTING] = state2;
const state3 = ['SENDING', 'SENT', 'RECEIVING', 'RECEIVED', 'ERROR'];
const [SENDING, SENT, RECEIVING, RECEIVED] = state3; // ERROR elided to avoid name conflict

// Currently this handler is shared clent and server, but we may want to split it, too.
const clientState = ({ws, conn, remote, server, publicKeySig, state:prevState, state2:prevState2}, {state:currState, state2:currState2}) => {

  const getRandomKey = (obj, omitKey) => {
    const keys = Object.keys(obj);
    if (keys.length === 0) throw 'empty object';
    let found;
    found = keys[ keys.length * Math.random() << 0];
    // do found = keys[ keys.length * Math.random() << 0]; while (found === omitKey)
    return found;
  }
  const sendEnvelopToRandomPeer = () => {
    // cheat and get clients from the server stree.
    const clients = remote.summary;
    if (Object.keys(clients).length >= 2 ) {
      const to = getRandomKey(clients, publicKeySig);
      // log('sending', {handler: 'sendEnvelop', from: publicKeySig, to, message: {}});
      // use the full from and to public keys because we are not in a relationship yet
      conn.addLeaf({handler: 'sendEnvelop',
        from: publicKeySig,
        fromPublicKeyPem: conn.publicKeyPem,
        to,
        toPublicKeyPem: clients[to].residue.publicKeyPem,
        message: {}
      });
    }
  }

  const sendInviteToRandomPeer = () => {
    // generate invite at host
    conn.addLeaf({handler: 'invite1', msg: `hey its ${conn.name}`});

    if (true) return;
    // get the invite params from client summary
    const friends = conn.summary;

    // trigger invite2 from the guest
    const clients = remote.summary;
    if (Object.keys(clients).length >= 2 ) {
      const guestSig = getRandomKey(clients, publicKeySig);
      const guest = clients[guestSig];

      conn.addLeaf({handler: 'sendEnvelop',
        from: publicKeySig,
        fromPublicKeyPem: conn.publicKeyPem,
        to,
        toPublicKeyPem: clients[to].residue.publicKeyPem,
        message: {}
      });
    }
  }


  // change state first in case any triggered code depends on new state
  if (currState) conn.addLeaf({state: currState});
  if (currState2) conn.addLeaf({state2: currState2});

  if (prevState2 !== VERIFIED && currState2 === VERIFIED){
    sendInviteToRandomPeer();
  }

  return [];
}

const extractFieldsFromUrl = (url) => {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const publicKeyPem = urlParams.get('publicKeySig');
  const msg = urlParams.get('msg');
  return { publicKeySig, msg };
}

// Executed by the host client. Add a friend branch with a private message
// Note: invite message is cleartext!
const invite1 =({conn, publicKeySig}, {msg}) => {
  const link = `${window.location.href}?publicKeySig=${publicKeySig}&msg=${msg}`;
  // create a new row for this invite
  conn.parent.add({handler: 'state', state4: 'INVITED'})
    .add({msg, link});
  return [];
}

// used by the guest. Add a friend branch and request host public key
// msg and publicKeySig are embedded in a URL and shared with guest out-of-band
const invite2 =({conn}, {}) => {
  const {msg, publicKeySig} = extractFieldsFromUrl(window.location);
  conn.parent.addLeaf({handler: 'state', state4: 'REQUEST_PUBLIC_KEY'})
    .add({msg, publicKeySig})
    .add({handler: 'send', msg: {handler: 'invite3', publicKeySig}});
  return [];
}

// used by server to dereference the public key signature to a public key
const invite3 =({conn}, {publicKeySig}) => {
  const hostConn = conn.summary[publicKeySig];
  const publicKeyPem = hostConn.publicKeyPem;
  return [{handler: 'send', msg: {handler: 'invite4', publicKeySig, publicKeyPem}}];
}

// used by the guest to respond to send an encrypted response to the invite
const invite4 =({conn, privateKey, publicKeySig: from, publicKeyPem, msg},{publicKeyPem: to}) => {
    // unusually, this envelop includes the full public key of sender, because the recipient won't have it yet.
  return [{handler: 'sendEnvelop', from, to, fromPublicKeyPem: publicKeyPem, box: {handler: 'invite5', msg}}];
}

// used by host to verify the invite and send the response
const invite5 =({conn, msg: expected}, {msg: actual}) => {
  const valid = (expected === actual);
  // can add other checks here, like timeout.
  return [{handler: 'sendEnvelop', from, to, box: {handler: 'invite6', state4: 'VERIFIED'}}]
}

const invite6 =({}, {state4}) => {
  return [{handler: 'state', state4}];
}


const sharedHandlers = [h(connect), h(send)];
const serverHandlers = [...sharedHandlers, h(state), h(register1),  h(register3), h(deliverEnvelop), h(invite3) ];
const clientHandlers =  [...sharedHandlers, h(clientState, 'state'), h(register2),  h(register4), h(sendEnvelop), h(acceptEnvelop),
  h(invite1), h(invite2), h(invite4), h(invite5), h(invite6)]

// Make a server
const serverKeyPair = await generateKeyPair();
const serverTree = new stree({}, (a,b) => combineRules(a,b,null,true), summarizeServer);
const server = serverTree.addAll(serverHandlers);
server.add({cap: 'server handlers'});

const names = ['alice', 'bob', 'charlie'];
// make a server connection and a client stree with a client connection. return the client stree.
const makeConnectionPair = async (name, websocketURL = 'wss://example.com', delay=50) => {
  // add the server connection
  const connServer = server.add({server: true, ...serverKeyPair});

  // generate a client stree and connection
  const clientKeyPair = await generateKeyPair();
  const clientStree = new stree({name}, (a,b) => combineRules(a,b,null,true), summarizeClient);
  const client = clientStree.addAll(clientHandlers);
  clientStree.add({cap: 'client handlers'});
  const connClient = client.add({server: false, ...clientKeyPair});

  // trigger connect on both the client and server
  connServer.add({handler: 'connect', websocketURL, conn: connServer, remote: connClient, delay});
  connClient.add({handler: 'connect', websocketURL, conn: connClient, remote: connServer, delay});
  return clientStree;
}

const makeConnectionPairs = async (numClients = 2) => {
  const result = [];
  let i = numClients
  for (let i = 0; i < numClients; i++ )
    result.push(await makeConnectionPair(names[i]));
  return result;
}

const clientStrees = await makeConnectionPairs(3);

// todo render clients renderClientTreesParent



// Send and recieve similar messages to both connections
[
  // ()=>conn1.addLeaf({handler: 'send', msg: {value: 'hey from conn 1!', a:1, b:1}}),
  // ()=>conn2.addLeaf({handler: 'send', msg: {value: 'wassup from conn 2!', a:2, b:2}}),
  // ()=>conn1.addLeaf({handler: 'send', msg: {handler: 'invite1'}}),
  // ()=>conn2.getLeaf().residue.ws.receive(JSON.stringify({b:1})),

  ()=>renderStree(serverTree, renderServerTreeParent),
  ()=>renderStrees(clientStrees, renderClientTreesParent),
  ()=>log('client trees', clientStrees),
  ()=>log('server tree summary', serverTree.summary),
].forEach((fn, i)=>setTimeout(fn, 50*(i+5)));

```
## Thoughts
It would be cool to branch connections for testing, showing off all the error modes.
However we'd need to take care of the `ws` member which shouldn't be shared.
There's a general issue with keeping references to outside objects in residue that may be resolved with a naming convention like "prepend with _ to ignore".

Would be useful to adjust the simulation to support scrubbing and insertion. This points to a stateless render, for which I'd probably use d3.

Next things: incorporate the invitation protocol,
We can do this ephemerally, in the same stree as the connection state, which *may* be good for btd speed.
Accessing window.location in the handler may impact testing.
In prod, there is one server stree summarized over connected clients, and each client has an stree summarized over friends in various states.
In simulation this means our summary function must serve both purposes, which complicates the function, and complicates accessing the summary.
The alternative is to split the strees even in simulation.
Splitting into 1+N strees has the added benefit of (somewhat) ensuring there is no leakage between client and server (although they would both still have full access to the other).
Afterword: the split did not go as cleanly as I'd have liked. Only the last client stree is responsive to clicks - a bug in stree-viz. The sendEnvelop sequence is not triggering. So I'm committing on a branch and hope that it works out. I may need to pinpoint the moment the flow breaks, and break up the changes into smaller steps. It may even be necessary to start with just two client connections, alice and bob, and make sure that works before generalizing to N clients. I'd also like to add assertions to make it easier to detect regressions- which also means making the test flow deterministic (currently it's not because we pick a peer at random to send a message to.) Even the verification flow is flaky - particularly the first client.

```js
///
const combinedSummarySketch = {
  server:  {'publicKeySig': connectionNode, ...etc},
  clients: {'publicKeySig': {friends}},
};
// server calls like deliverEnvelop and invite3 use the server prop
// client calls like invite use the clients prop looking up their own sig.
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
    node.addLeaf({state: 'COMPLETE', result: keyPairPem, dt})
  });
  return [{state: 'COMPUTING', t1: Date.now()}];
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


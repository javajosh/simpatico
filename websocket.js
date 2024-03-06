import { equals, encodeBase64URL, log} from '/simpatico.js';
import * as wcb from './node_modules/webcryptobox/index.js';

/**
Example usage:
 const ws = new MockWebSocket('ws://example.com');

 ws.onopen = () => {
  console.log('Connection opened');
};

 ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

 ws.onclose = () => {
  console.log('Connection closed');
};

 ws.send('Hello, server!');
*/
export class MockWebSocket {

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
      console.log(`connection ${this.id} send data.length ${data.length}`);
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




const {CONNECTING, OPEN, CLOSING, CLOSED} = MockWebSocket;
const stateNamesByIndex = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
const state2 = ['UNREGISTERED', 'CHALLENGED', 'RESPONDED', 'VERIFIED', 'UNVERIFIED', 'ERROR', 'COMPUTING'];
const [UNREGISTERED, CHALLENGED, RESPONDED, VERIFIED, UNVERIFIED, ERROR, COMPUTING] = state2;
const state3 = ['SENDING', 'SENT', 'RECEIVING', 'RECEIVED', 'ERROR'];
const [SENDING, SENT, RECEIVING, RECEIVED] = state3; // ERROR elided to avoid name conflict
const delay = 10;

export const connect = (_ , {websocketURL, conn, remote, delay}) => {
  const ws = new MockWebSocket(websocketURL, delay);
  ws.onopen =    (e) => conn.addLeaf({handler: 'state', conn, state: OPEN});
  ws.onclose =   (e) => conn.addLeaf({handler: 'state', conn, state: CLOSED});
  ws.onmessage = (e) => conn.addLeaf(JSON.parse(e.data)); //eventually call receive handler
  ws.onerror =   (e) => conn.addLeaf({error: e});
  return [{ws, state: CONNECTING, conn, remote}];
}

export const send = ({ws, remote}, {msg}) => {
  const msgString = JSON.stringify(msg);
  ws.send(msgString);
  // setTimeout prevents reentrance into stree.add(); note this line is only executed in a test environemnt
  if (remote) setTimeout(()=>remote.getLeaf().residue.ws.receive(msgString));
  return [];
};


// Put rest of the state-machine here
export const state = ({ws, conn, remote, server, publicKeySig, state:prevState, state2:prevState2}, {state:currState, state2:currState2}) => {
  const getRandomKey = (obj, omitKey) => {
    const keys = Object.keys(obj);
    if (keys.length === 0) throw 'empty object'
    let found;
    // while (found !== omitKey)
    found = keys[ keys.length * Math.random() << 0];
    return found;
  }
  const result = [];

  // kick off the protocol from the server connection
  if (prevState !== OPEN && currState === OPEN && server){
    result.push({handler: 'register1'})
  }
  // testing only: send a message to another random client on verification
  // note that the first connection cannot send because its the only one in summary
  // summary is updated AFTER the state handler, so summary never includes the current connection
  if (prevState2 !== VERIFIED && currState2 === VERIFIED && !server){
    const clients = conn.summary;
    if (Object.keys(clients).length >= 2 ) {
      const to = getRandomKey(clients, publicKeySig);
      log('sending', {handler: 'sendEnvelop', from: publicKeySig, to, message: {}});
      result.push({handler: 'sendEnvelop', from: publicKeySig, to, message: {}});
    }
  }

  if (currState) result.push({state: currState});
  if (currState2) result.push({state2: currState2});
  return result;
}

// Executed by the server onopen - send server public key
export const register1 = ({publicKeyPem}) => {
  const t1 = Date.now();
  return [{handler: 'state', state2: CHALLENGED}, {t1}, {handler: 'send', msg: {handler: 'register2', publicKeyPem, t1}}];
}

// Executed by the client - use server public key and client private key to encrypt a message back
// In this case we just encrypt two timestamps and their difference
export const register2 = ({publicKey: clientPublicKey, publicKeyPem: clientPublicKeyPem, privateKey, publicKeySig, conn}, {publicKeyPem: serverPublicKeyPem, t1}) => {
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
export const register3 = ({privateKey, conn, t1}, {clearText, cypherText, publicKey: clientPublicKey, publicKeySig}) => {
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
export const register4 = ({},{state2}) => {
  return [{handler: 'state', state2}];
}

// Executed by the client. From and to are public key signatures; the message is an object
export const sendEnvelop = ({privateKey, friends, conn, state3}, {from, to, message}) => {
  const publicKey = conn.summary[to].residue.publicKeyPem; // eventually pick out of friendsfor now just pick something at random
  const messageText = JSON.stringify(message);
  const messageArray = wcb.decodeText(messageText);
  wcb.importPublicKeyPem(publicKey)
    .then(publicKey => wcb.encryptTo({message: messageArray, privateKey, publicKey}))
    .then(box => wcb.encodeHex(box))
    .then(box => {
      conn.addLeaf({handler: 'state', state3: SENT });
      conn.addLeaf({handler: 'send', msg: {handler: 'deliverEnvelop', from, to, box}});
    })
    .catch(error => {
      log(error);
      conn.addLeaf({handler: 'state', state3: ERROR, error});
    });

  return [{handler: 'state', state3: SENDING}];
}

// Executed by the client TODO something is going wrong, not sure what yet
export const acceptEnvelop = ({privateKey, friends, conn, state3}, {from, to, box}) => {
  //TODO consider caching binary public keys for self and friends
  const publicKey = conn.summary[from].residue.publicKeyPem;
  Promise.all([
    wcb.importPublicKeyPem(publicKey),
    wcb.decodeHex(box),
  ])
    .then(([publicKey, box]) => {
      return wcb.decryptFrom({box, privateKey, publicKey});
    })
    .then(unencrypted => {
      const jsonString = wcb.encodeText(unencrypted);
      const obj = JSON.parse(jsonString);
      conn.addLeaf({handler: 'state', state3: RECEIVED });
      // conn.addLeaf({received: obj});
      conn.addLeaf(obj);
    })
    .catch(error => {
      log(error);
      conn.addLeaf({handler: 'state', state3: ERROR, error});
    });

  return [{handler: 'state', state3: RECEIVING}];
}

// executed by the server
export const deliverEnvelop = ({conn}, {from, to, box}) => {
  const conns = conn.summary;
  const conn1 = conns[from];
  const conn2 = conns[to];
  if (!conn1) throw 'from not found in registry';
  if (!conn2) throw 'to not found in registry';
  // in simulation, only the client connections are indexed by public key, so get the corresponding server connection.
  // In production, the server connections would be indexed by remote publicKeySig
  const conn2Server = conn2.residue.remote;
  if (!conn2Server) {
    log ('problem finding remote for ', to, conns[to], conns[to].residue.publicKeySig);
    return [];
  }
  // if (conn1.residue.publicKeySig !== from) throw 'connections can only send with your own public key';
  conn2Server.addLeaf({handler: 'send', msg: {handler: 'acceptEnvelop', from, to, box}});

  // todo we may want to tell conn1 that the envelope was delivered.
  return []

}

// Store a map of client nodes indexed by their public key sig.
// Only index them if they are verified
export const summarize = (summary, node) => {
  // node = node.getLeaf();
  if (node.id === 0) return {};
  // Don't keep server sockets in the summary; use the client node .remote to access them
  if (node.residue.server) return summary;
  const parent = node.parent;
  const residue = node.residue;
  if (parent.residue.state2 !== VERIFIED && residue.state2 === VERIFIED) {
    log('summarize', node.residue.server, node.residue.publicKeySig);
    summary[node.residue.publicKeySig] = node;
  }
  if (parent.residue.state2 === VERIFIED && residue.state2 !== VERIFIED) {
    delete summary[node.residue.publicKeySig];
  }
  return summary;
}

export const generateKeyPair = async () => {
  const keyPair = await wcb.generateKeyPair();
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyPem:  await wcb.exportPublicKeyPem(keyPair.publicKey),
    privateKeyPem: await wcb.exportPrivateKeyPem(keyPair.privateKey),
    publicKeySig: encodeBase64URL(await wcb.sha256Fingerprint(keyPair.publicKey)),
  };
}

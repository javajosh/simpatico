# Websocket
2023

See:
[home](/),
[chat](/chat.md),
[reflector](/reflector.md)

# Introduction
Model a websocket with combine, then allow branching (and multiple websockets) in stree.
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
Ordinary usage is like this:

```js
// import {MockWebSocket} from "./chat.js";
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
;

```
Our goal is to cleanly wrap the websocket in an stree to support interactions like this:
```js
/*
    - {process} {local} {connect, disconnect, invite, keepalive}{connected}{disconnected}{connected}
  1 - {process} {remote} {invited, accepted, send, recieve}
  2 - {invited} {accepted} {to:msg} {from:msg}
  2 - {invited} {accepted} {to:msg} {offline}
  3 - {invite}
*/
```
To do that, lets start with a visualization:
```html
<div id="connection-render"></div>
```
```js
import {stree, renderStree, svg, h} from './simpatico.js';
import {MockWebSocket} from "./chat.js";

const renderParent = svg.elt('connection-render');

const delay = 100;
const websocketURL = window.location.toString().replace(/^http/, 'ws').split('#')[0];
const {CONNECTING, OPEN, CLOSING, CLOSED} = WebSocket;
const stateNamesByIndex = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// events target the same stree row as the connection lives. for now target root with a special number, +infinity (0 is reserved for root node)
// note that calling s.add inside this handler does not constitute a side-effect, and so is allowed
const connect = (ctx, {row}) => {
  const ws = new MockWebSocket(ctx.websocketURL, delay);
  if (row === 0 ) row = Number.POSITIVE_INFINITY;
  ws.onclose = (e) => s.add({open: false, state: CLOSING, ws: null}, row);
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

const receive = (ctx, {msg}) => [{in: msg}];
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

renderStree(s, renderParent);
```


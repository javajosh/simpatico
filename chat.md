<!--<!DOCTYPE html>
<head>
  <title>Simpaticode: chat</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='white' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">
  <link class="hljs" rel="stylesheet" href="/kata/highlight.github.css">
  <meta id="refresh" http-equiv="refresh" content="-1">
  <script class="testable" src="testable.js" type="module"></script>
  <script class="hljs" type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    const d=document, elts = a => d.querySelectorAll(a);
    hljs.registerLanguage('javascript', javascript);
    d.addEventListener('DOMContentLoaded', () =>
      elts('pre code').forEach(block =>
        hljs.highlightElement(block)));
  </script>
</head>-->

# Simpaticode: chat
2023

See:
[home](/),
[litmd](/lit.md),
[audience](/audience.md),
[reflector](/reflector.md)

This is a very tiny chat system.
It demonstrates "low-level" web-sockets programming with modern javascript.
It also demonstrates the use of [crypto](/crypto.md).
Messages are broadcast to all connected clients.

Note about UI: I've not yet implemented a UI for this. [hugging face](https://github.com/huggingface/chat-ui) released theirs recently, and it looks good. It's [svelte](https://svelte.dev/) (which I like) over [Mongo](https://www.mongodb.com/) (which I don't particularly like).
We'll see.

## Client

```html

<ol id="display-chat">
  <li><button id="reset-button">Reset keypair</button></li>
  <li><label><input type="text" placeholder="say something then hit enter"></label></li>
</ol>
```

```js
  import * as wcb from './webcryptobox.js';

  const DEBUG = false;
  const DP_LOCAL_STORAGE_KEY = 'durable-process';
  const body = document.body;
  const displayChat = document.getElementById('display-chat');
  const resetButton = document.getElementById('reset-button');
  const websocketURL = window.location.toString().replace(/^http/, 'ws');


  // Initialize either by restoring a keypair or generating a new one.
  const {keyPair, keyPairPem} = await initializeDurableProcess(DP_LOCAL_STORAGE_KEY);

  // Start the connection, register a listener/msg handler
  // TODO: connection may be lost and recreated.
  // TODO: client keep-alive messages
  let connection = connect(websocketURL, keyPair, keyPairPem, e => receiveMessage(e.data));

  // Turn body change events (emitted by form fields) into msg sends.
  body.addEventListener('change', e =>  {
    sendMessage(e.target.value);
    e.target.value = "";
  });

  // A click deletes the old keys, make new ones, and refreshes the page.
  resetButton.addEventListener('click', () => {
    initializeDurableProcess(DP_LOCAL_STORAGE_KEY, true);
    window.location.reload();
    return false;
  });

  // ==============================================================
  // Begin support functions:
  async function initializeDurableProcess(key=DP_LOCAL_STORAGE_KEY, resetKeys = false) {
    const ls = window.localStorage;
    let keyPair, keyPairPem;
    if (resetKeys) ls.removeItem(key);
    if (!ls.hasOwnProperty(key)) {
      // Generate a new keypair
      keyPair = await wcb.generateKeyPair();
      keyPairPem = {
        publicKeyPem:  await wcb.exportPublicKeyPem(keyPair.publicKey),
        privateKeyPem: await wcb.exportPrivateKeyPem(keyPair.privateKey)
      };
      ls.setItem(key, JSON.stringify(keyPairPem));
      if (DEBUG) console.log('created durable-process keypair in localStorage', keyPairPem, keyPair);
    } else {
      try{
        const keyPairString = ls.getItem(key);
        keyPairPem = JSON.parse(keyPairString);
        keyPair = {
          publicKey: await wcb.importPublicKeyPem(keyPairPem.publicKeyPem),
          privateKey: await wcb.importPrivateKeyPem(keyPairPem.privateKeyPem)
        };
        if (DEBUG) console.log('recovered durable-process keypair from localStorage', keyPairPem, keyPair);
      } catch (e) {
        console.error('invalid keys, deleting and start again');
        ls.removeItem(key);
        throw e;
      }
    }
    return {keyPair, keyPairPem};
  }

  // Read: Open the socket and) become capable of sending and recieving messages
  function connect (url, keyPair, keyPairPem, handler) {
    const conn = new WebSocket(url);
    conn.onopen = () => {
      sendMessage(keyPairPem.publicKeyPem, conn);
    }
    conn.onmessage = handler;
    return conn;
  }

  // Display a string as a new list element
  function addListItem (itemHtml, parent = displayChat) {
    const li = document.createElement("li");
    li.innerHTML = itemHtml;
    parent.appendChild(li);
    if (DEBUG) console.debug(`itemHtml received and appended as li [${itemHtml}]`);
  }

  function isConnReady (conn = connection) {
    return (conn !== undefined) && (conn.readyState === conn.OPEN);
  }

  // Send a message over the websocket, reconnecting if necessary.
  function sendMessage(msg, conn = connection) {
    if (!isConnReady(conn)) throw 'connection is not ready';
    try {
      conn.send(msg);
      if (DEBUG) console.debug(`msg sent ${msg}`);
      return conn;
    } catch (ex) {
      console.error('problem sending message');
      throw ex;
    }
  }
  function receiveMessage(msg) {
    addListItem(msg);
  }
```
## Incrementalism
Rather than design something from scratch, and try to keep it all in my head, I'd like to take an incremental approach and implement features one-by-one.

  1. Make it work, hide nothing: The simplest chat (we are here)
     Everyone can read all data and metadata.
  2. Client encryption: The next level is to implement msg encryption (client only)
     Everyone can still read all metadata.
     Fan-out cost is astronomical!
  3. The next level is to modify the server (server only)
     Only the server can read metadata.
     This cannot be avoided, but can be mitigated by various minimalist techniques.
     Fan-out costs are considerably reduced.

There are a handful of other features to keep in the back of the mind:
   1. Connection keep alive (client and server)
   1. Connection reestablishment
   1. Multi-key support.

To get to phase two has been complicated by [jwt](https://jwt.io/) [jwt2](https://auth0.com/resources/ebooks/jwt-handbook/thankyou) and related technologies. But after reading the RFCs and the libraries, it looks like something I could use eventually, but for now it's overkill and a huge source of complexity. In this case I control both ends of the protocol, so I can keep it simple. To wit, incrementalism! Web sockets support moving strings over the wire. Then, we impose structure, we say the strings must be json strings. Then we impose temporal structure, and say the first string should be the public key of the connection with a {pubkey} structure, and subsequent strings a structured message with a `{from, to, body, sig}` structure, where `from` and `to` are pubkeys, `body` is encrypted, and `sig` is something that anyone can use to verify that the message actually came from that key (aka a message authentication code, or MAC).

### Adding encryption
Before adding encryption we need to add targeting to the chat. So our steps may be reversed. We need something like an address book, and the ability to select a "to". It means we need a local list of public keys.

```js
// Make an stree for contacts
const contacts = new stree({alias:'', pubkey:''});
contacts.add({alias: 'alice', pubkey: 'alice-pubkey'}, 0);
contacts.add({alias: 'bob', pubkey: 'bob-pubkey'}, 0);
console.log(contacts);
// We will also need connections.


// There are a variety of handlers we may want to define, such as a send handler.
// For now we'll handle it

```

## Design Notes

The first and simplest strategy for dealing with connections and messages is to register the connection and then round-robin transmit to all connected clients.
This is sufficient as a basic exercise, but it's not what we ultimately want.
(Arbitrary people can say anything to anyone currently connected.
This is fine when simpaticorp is in "stealth mode" and no-one knows this resource exists.
The 300 character limit, and lack of images, also helps mitigate the risk of abuse.)

But the goal has always been to provide a *point-to-point, e2e encrypted chat*.
The approach is to generate a keypair on the client and then register the public key with the server.
Subsequent messages will be something like a [jwt](https://github.com/auth0/node-jws): some cleartext (like the "to" and from header) and some cyphertext (the message itself) and some metadata.
(We might be tempted to skip "from" but eventually we'll need to support multiple public keys per connection.)

### Registration Protocol

  1. client: Generate (or retrieve) the keypair.
  2. client: Connect to the server.
  3. server: save connection
  4. client: send the pubkey to the server
  5. server: register pubkey with connection
  6. (steady-state) send messages to other pubkeys.
    optionally verify signature on the server.

Steps 2-5 is a *registration protocol* and we can use [combine](/combine2) to model one, and then an [stree](/stree2) to model variations.

### Public key distribution
Simplicity is key, so to speak, and we use an out-of-band method for initial distribution.
Keys can invite other keys, providing a one-time use URL, conveyed perhaps by text or qr code.
In fact an important use case is one user using one device to invite another, effectively creating a private network of keys (useful for data synchronization, a la syncthing or browser-specific synchronization features, offering varying levels of user security)
For inspiration on constructing the urls we look at the web crypto api, which provides functions to give the user a short form for a public key, which is perfect for this application. We leave it up to to user how to use their keys, but the defaults are secure: limited time one-time use keys.

Note: general you can have a unique public key for each contact, or one key for all contacts, or something in between.

## Use-case: casual chat

There is no registration, no usernames required .
The unit of control is the browser process, which boils down to secure access to an unshared device. This fits 99% of smartphone use of which I am aware.

A primary use case for simpatico chat I have in mind is to enable the formation of new, privacy-preserving relationships with others. A kind of "ante room" or "porch" for your social life - where if you meet someone by chance in real life and have a good experience, you might want more...but you may not be sure to what extent. If you both have smartphones, instead of giving your number (which is quite intimate) or the difficulty of 'picking a channel' and adding their user name - you can bring up simpatico, click an "invite" button that generates a new public key that is displayed as a qr code, which your new friend can photograph and they are also now on Simpatico, generated their own keypair, and they have a relationship key, your public key. From there you can chat indefinitely or "escalate" the relationship to other channels like chat or instagram or signal or whatever. It's a simple, convenient and secure way to form new relationships that is very low risk for both parties.

It also means that you can create transient social networks and then discard them.
For example, this would be a good platform for (user developed!) party games.

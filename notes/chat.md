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

window.contacts = contacts;
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

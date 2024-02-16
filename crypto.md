# Simpaticode: crypto
2023

See:
[home](/),
[chat](/chat.md)
[reflector](/reflector.md)
[litmd](/lit.md),

# Goals
   1. Generate keypair
   2. Encrypt a text message (usually a JSON string in our case).
   3. Decrypt the message
   4. Store keypair for later use (usually in localstorage, often via stree)

## Exporting a derived symmetric key
 [webcryptobox](https://github.com/jo/webcryptobox), written in an eerily similar style as simpatico (minimal, zero-deps, no build, etc)
It is small, build-less, written with modern ES6 and quite legible.

```js
import * as wcb from './node_modules/webcryptobox/index.js';

const alice = await wcb.generateKeyPair()
const bob = await wcb.generateKeyPair()
const text = 'Test message'
const message = wcb.decodeText(text)
const box = await wcb.encryptTo({ message, privateKey: alice.privateKey, publicKey: bob.publicKey })
const decryptedBox = await wcb.decryptFrom({ box, privateKey: bob.privateKey, publicKey: alice.publicKey })
const decryptedText = wcb.encodeText(decryptedBox)

// Now do key export and import with alice's keys
const alicePubExported = await wcb.exportPublicKeyPem(alice.publicKey);
const alicePrivExported = await wcb.exportPrivateKeyPem(alice.privateKey);
log({ alicePubExported, alicePrivExported });

const alicePubImported = await wcb.importPublicKeyPem(alicePubExported);
const alicePrivImported = await wcb.importPrivateKeyPem(alicePrivExported);

const alice2 = {publicKey: alicePubImported, privateKey: alicePrivImported};
const box2 = await wcb.encryptTo({message, privateKey: alice2.privateKey, publicKey: bob.publicKey});
const decryptedBox2 = await wcb.decryptFrom({box: box2, privateKey: bob.privateKey, publicKey: alice2.publicKey});
const decryptedText2 = wcb.encodeText(decryptedBox2);

// Get a printable sha256 hash of the key
const alicePubKeyFingerprint = await wcb.sha256Fingerprint(alice.publicKey);
log('alicePubKeyFingerprint',wcb.encodeBase64(alicePubKeyFingerprint));

assertEquals(decryptedText, decryptedText2);
```

# Discussion
Why crypto?
Because you should encrypt all data in transit and at rest because of [exploits](https://www.bleepingcomputer.com/news/security/google-finds-more-android-ios-zero-days-used-to-install-spyware/) and because of [privacy](https://www.wired.com/story/ditch-all-those-other-messaging-apps-heres-why-you-should-use-signal/).



# References

1. [MDN's generateKey() docs](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey)
1. [MDN's exportKey() docs](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
1. [MDN's importKey() docs](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey)
1. [See the w3c web crypto spec](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-generateKey)
1. [Crypto 101 is a good intro text to the field.](https://www.crypto101.io/)


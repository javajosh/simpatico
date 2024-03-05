# Crypto.js
2024

Exploring the modern browser's native cryptography libraries for doing public/private key encryption.

See:
[home](/),
[chat](/chat.md),
[reflector](/reflector.md),
[litmd](/lit.md),
[crypto](/notes/crypto.md),

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
const hexBox = wcb.encodeHex(box);
const decryptedBox = await wcb.decryptFrom({ box: wcb.decodeHex(hexBox), privateKey: bob.privateKey, publicKey: alice.publicKey })
const decryptedText = wcb.encodeText(decryptedBox)
assertEquals(decryptedText, text);
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

## RSA from scratch
Adapted from [Implementing RSA from Scratch](https://coderoasis.com/implementing-rsa-from-scratch-in-javascript/) via [hn](https://news.ycombinator.com/item?id=39548300).

```js
// the browser doesn't need this but node does
// const BigInt = require('big-integer');

const gcd = (a, b) => extendedEuclidean(a,b)[0];
const lcm = (x, y) => (x * y) / gcd(x, y);

function extendedEuclidean(a, b) {
  if (a === 0n) {
    return [b, 0n, 1n];
  }

  let [gcd, x1, y1] = extendedEuclidean(b % a, a);

  let x = y1 - (b / a) * x1;
  let y = x1;

  return [gcd, x, y];
}

function modularInverse(a, m) {
  let [gcd, x, y] = extendedEuclidean(a, m);
  if (gcd !== 1n) {
    return null;
  } else {
    x = (x % m + m) % m;
    return x;
  }
}

function modularExponentiation(base, exponent, modulus) {
  if (modulus === 1n) return 0n;

  let result = 1n;
  base = base % modulus;

  while (exponent > 0) {
    if (exponent % 2n === 1) {
      result = (result * base) % modulus;
    }

    exponent = exponent / 2n;
    base = (base * base) % modulus;
  }

  return result;
}

function generateRSAKeys(p, q) {
  let n = p * q;
  let lambdaN = lcm(p - 1n, q - 1n);
  let e = 65537n;
  let d = extendedEuclidean(e, lambdaN)[0];
  if (d < 0) d = d + lambdaN;
  return { publicKey: { e, n }, privateKey: { d, n } };
}

function encrypt(message, publicKey) {
  return modularExponentiation(message, publicKey.e, publicKey.n);
}

function decrypt(ciphertext, privateKey) {
  return modularExponentiation(ciphertext, privateKey.d, privateKey.n);
}

// Testing
let keys = generateRSAKeys(31337n, 31357n);
let publicKey = keys.publicKey;
let privateKey = keys.privateKey;
let message = 80087n;
let encrypted = encrypt(message, publicKey);
let decrypted = decrypt(encrypted, privateKey);

console.log(decrypted)


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


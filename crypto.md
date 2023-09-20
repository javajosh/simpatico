# Simpaticode: crypto
2023

See:
[home](/),
[litmd](/lit.md),
[audience](/audience.md),
[reflector](/reflector.md)
[chat](/chat.md)

<!-- div class="makeItStop"></div-->

## Encrypt/Decrypt

Exercise cryptographic primitives.
In this case use the crypto library to generate a key, encrypt a thing, then decrypt.
Note that, at this point, we cannot save the generated keys for later use.
This is enough to save ciphertext and later decrypt it.
References:

  1. [MDN's generateKey() docs](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey)
  1. [MDN's exportKey() docs](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
  1. [MDN's importKey() docs](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey)
  1. [See the w3c web crypto spec](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-generateKey)
  1. [Crypto 101 is a good intro text to the field.](https://www.crypto101.io/)



```js
  import {generateSymmetricKey, encrypt, pack, decrypt, unpack, equalBuffers} from './crypto.js';

  // encrypt message
  const msg = 'Hey crypto cats!!';
  log('initializing', msg);
  const key = await generateSymmetricKey();
  log('generated key', key);
  const { cipherText, iv } = await encrypt(msg, key);
  log('encrypted message', {cipherText, iv});

  // await fetch('/secure-api', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     cipher: pack(cipher),
  //     iv: pack(iv),
  //   }),
  // })
  // const response = await fetch('/secure-api').then(res => res.json())

  const fakeResponse = {
    cipherText: pack(cipherText),
    iv: pack(iv),
  };

  const unpacked = {
    cipherText: unpack(fakeResponse.cipherText),
    iv: unpack(fakeResponse.iv),
  }
  log('fakeResponse', fakeResponse, 'unpacked', unpacked);
  assertEquals(unpacked.cipherText, cipherText);
  assert(equalBuffers(unpacked.iv, iv));

  // unpack and decrypt message
  const final = await decrypt(
    {cipherText, iv},
    key,
  );
  log('decrypted message', final);
  assertEquals(final, msg);
```

## Export Keys
Export by picking a format and calling exportKey
Format support depends on the type of underlying key.
I believe that 'raw' is universally supported, however.


```js
  import {generateSymmetricKey, importSymmetricKey, pack, encrypt, decrypt} from './crypto.js';

  //Make a key and encrypt something with it
  const key = await generateSymmetricKey();
  const { cipherText, iv } = await encrypt("hello!", key);

  // Export the key in raw; check what is supported with checkSupportedKeyExportFormats()
  let exportedKey = await window.crypto.subtle.exportKey('raw', key);
  const exportedKeyPacked = pack(exportedKey);
  log(exportedKey, exportedKeyPacked);

  const key2 = await importSymmetricKey(exportedKey, iv);

  // Now we can use the key again!
  const final = await decrypt(
    {cipherText, iv},
    key2,
  );
  log(final);
````

## Asymmetric keys
Now lets make asymmetric keys and use them to sign things, and also to wrap things.

```js
  import {encode} from './crypto.js';

  const msg = 'hello world';

  // Add an "A" and then figure out the arguments.
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
  // https://developer.mozilla.org/en-US/docs/Web/API/EcKeyGenParams
  // name = ECDSA or ECDH
  // namedCurve = P-256, P-384, P-521
  const generateAsymmetricKey = () => {
    return window.crypto.subtle.generateKey({
      name: 'ECDSA',
      namedCurve: 'P-384',
    }, true, ['sign', 'verify'])
  }
  const keyPair = await generateAsymmetricKey();

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
  // https://developer.mozilla.org/en-US/docs/Web/API/EcdsaParams
  const signature = await window.crypto.subtle.sign({
      name: 'ECDSA',
      hash: 'SHA-384'
    }, keyPair.privateKey,
    encode(msg)
  );
  log('keypair', keyPair, 'msg', msg, 'signature', signature);

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify
  // bool = verify(algorithm, key, signature, data)
  const verified = await window.crypto.subtle.verify({
      name: 'ECDSA',
      hash: 'SHA-384'
    }, keyPair.publicKey,
    signature,
    encode(msg),
  );
  log('verified', verified);
```

## Exporting a derived symmetric key
It turns out what we needed was the <a href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey">deriveKey</a> method.
However, I found a really good library, <a href="https://github.com/jo/webcryptobox">webcryptobox</a>, written in an eerily similar style as the rest of simpatico.
It is small, build-less, written with modern ES6 and quite legible.

```js
  // The excellent https://github.com/jo/webcryptobox
import * as wcb from './webcryptobox.js';

const alice = await wcb.generateKeyPair();
const bob = await wcb.generateKeyPair();
const text = 'Nobody else can offer me something, something heart felt like you did it.';
const message = wcb.textToBuffer(text);
const box = await wcb.encryptTo({message, privateKey: alice.privateKey, publicKey: bob.publicKey});
const decryptedBox = await wcb.decryptFrom({box, privateKey: bob.privateKey, publicKey: alice.publicKey});
const decryptedText = wcb.bufferToText(decryptedBox);

// Now lets see if we can export and import the keys and have it work the same way
const alicePub = await wcb.exportPublicKeyPem(alice.publicKey);
const alicePriv = await wcb.exportPrivateKeyPem(alice.privateKey);
log('asymm', alicePub, alicePriv);
const alicePubImported = await wcb.importPublicKeyPem(alicePub);
const alicePrivImported = await wcb.importPrivateKeyPem(alicePriv);
log('asymm', alicePubImported, alicePrivImported);
const alice2 = {publicKey: alicePubImported, privateKey: alicePrivImported};
const box2 = await wcb.encryptTo({message, privateKey: alice2.privateKey, publicKey: bob.publicKey});
log('asymm', alice2, box2);
const decryptedBox2 = await wcb.decryptFrom({box: box2, privateKey: bob.privateKey, publicKey: alice2.publicKey});
const decryptedText2 = wcb.bufferToText(decryptedBox2);

// Get a printable sha256 hash of the key
const alicePubKeyFingerprint = await wcb.sha256Fingerprint(alice.publicKey);
log(wcb.encodeBase64(alicePubKeyFingerprint));

assertEquals(decryptedText, decryptedText2);
```
# Discussion
Why crypto?
Because you should encrypt all data at rest because of [exploits](https://www.bleepingcomputer.com/news/security/google-finds-more-android-ios-zero-days-used-to-install-spyware/).
And because you should encrypt all data in transit because you shouldn't trust the service provider, either.

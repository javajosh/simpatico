// Symmetrical encryption - this is like generatng a very strong password.
// Adapted from https://voracious.dev/blog/a-practical-guide-to-the-web-cryptography-api
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
const generateSymmetricKey = async () => {
  return window.crypto.subtle.generateKey({
    name: 'AES-GCM',
    length: 256,
  }, true, ['encrypt', 'decrypt'])
}

// Make a new key from a raw uintarray if present, or from a new random array if not
const importSymmetricKey = (rawKey) => {
  rawKey = rawKey ? rawKey : window.crypto.getRandomValues(new Uint8Array(16));
  return window.crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );

}

// A kind of salt that you need to keep with the key. See:
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
// https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
const generateIv = () => window.crypto.getRandomValues(new Uint8Array(12));

// TextEncoder/TextDecoder look like a relatively recent, useful browser addition.
// https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
// https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
const encode = (data) => new TextEncoder().encode(data);
const decode = (byteStream) => new TextDecoder().decode(byteStream);

// Encrypt cleartext with secret; returns the cipherText and the one-time iv.
// For classic naive operation the "message" would send both parts.
// That is, an attacker would get both parameters - but they still don't have the secret.
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
const encrypt = async (clearText, secret) => {
  const encoded = encode(clearText);
  const iv = generateIv();
  const cipherText = await window.crypto.subtle.encrypt({name: 'AES-GCM', iv,
  }, secret, encoded);

  return {
    cipherText,
    iv,
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt
const decrypt = async (cipher, key, iv) => {
  const encoded = await window.crypto.subtle.decrypt(
    {name: 'AES-GCM', iv },
    key,
    cipher
  )

  return decode(encoded)
}

// https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
const pack = (buffer) => window.btoa(
    String.fromCharCode.apply(null, new Uint8Array(buffer))
  );

// https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
const unpack = (packed) => {
  const string = window.atob(packed)
  const buffer = new ArrayBuffer(string.length)
  const bufferView = new Uint8Array(buffer)

  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i)
  }
  return buffer
}

export {generateSymmetricKey, importSymmetricKey, encode, decode, generateIv, encrypt, decrypt, pack, unpack}

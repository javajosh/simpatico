// Make a new key using generateKey()
// See https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
const generateSymmetricKey = async () => {
  return window.crypto.subtle.generateKey({
    name: 'AES-GCM',
    length: 256,
  }, true, ['encrypt', 'decrypt'])
}

// Make a new key from a raw uintarray if present, or from a new random array if not
// See https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
const importSymmetricKey = (rawKey) => {
  rawKey = rawKey || window.crypto.getRandomValues(new Uint8Array(16));
  return window.crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
}

// Iv is a kind of salt that you need to keep with the key. See:
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
// https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
const generateIv = () => window.crypto.getRandomValues(new Uint8Array(12));

// TextEncoder/TextDecoder look like a relatively recent, useful browser addition.
// https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
// https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
const encode = (data) => new TextEncoder().encode(data);
const decode = (byteStream) => new TextDecoder().decode(byteStream);

// Encrypt cleartext with secret; returns an object with cipherText and the one-time iv.
// For classic naive operation the "message" would send both parts.
// That is, an attacker would get both parameters - but they still don't have the secret.
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
const encrypt = async (clearText, secret) => {
  const encoded = encode(clearText);
  const iv = generateIv();
  const cipherText = await window.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv,
  }, secret, encoded);

  return {
    cipherText,
    iv,
  }
}

// Decrypt ciphertext with secret
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt
const decrypt = async (cipherStuff, secret) => {
  const {cipherText, iv} = cipherStuff;
  const encoded = await window.crypto.subtle.decrypt(
    {name: 'AES-GCM', iv },
    secret,
    cipherText
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

// Which formats does the key support?
const checkSupportedKeyExportFormats = (key) => {
  const formats = {
    'raw':'raw',
    'jwk':'jwk',
    'pkcs8':'pkcs8',
    'spki':'spki',
  };
  const supported = {};
  mapObject(formats, async ([_, format]) => {
    try {
      await window.crypto.subtle.exportKey(format, key);
      supported[format] = format;
    } catch (ignored) {} //exception is something like "DOMException: Operation is not supported"
  });
  return supported;
}

// ArrayBuffers do not want to be compared, except in the brute force way
const equalBuffers = (buf1, buf2) => {
  if (buf1.byteLength !== buf2.byteLength) return false;
  const dv1 = new Int8Array(buf1);
  const dv2 = new Int8Array(buf2);
  for (let i = 0 ; i !== buf1.byteLength ; i++)
  {
    if (dv1[i] !== dv2[i]) return false;
  }
  return true;
}

export {
  generateSymmetricKey, importSymmetricKey,
  encode, decode, generateIv,
  encrypt, decrypt,
  pack, unpack,
  checkSupportedKeyExportFormats,
  equalBuffers,
}

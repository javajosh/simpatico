const now = () => Date.now() // e.g. 1678023832587
const date = () => new Date().toISOString() // e.g. 2023-01-29T03:40:21.319Z
// Add the filename to the log output. Downside is it obscures the browser's ability to tell where it was natively called.
const log = (...args) => {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    console.log(...args);
  } else {
    console.log(window.location.pathname, ...args);
  }
}

const debug = (...args) => {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    console.debug(...args);
  } else {
    console.debug(window.location.pathname, ...args);
  }
}
const info = (...args) => {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    console.info(...args);
  } else {
    console.info(window.location.pathname, ...args);
  }
}

const error = msg => {throw new Error(msg)}
const assert = (truthy, msg) => !!truthy ? true : error(msg)
const assertThrows = async fn => {
  assert(typeof fn === 'function',
    `assertThrows must take a function argument instead got ${getType(fn)}`);
  let throws = false;
  let result;
  try {
    result = await fn(); // in case fn is an async function
  } catch (e) {
    throws = true;
  }
  assert(throws, `Expected fn to throw, but it didn't and returned [${tryToStringify(result)}]`);
};

const tryToStringify = obj => {
  const seen = new WeakSet();
  const detectCircular = (key, value) => {
    if (is.sym(value)) return value.toString();
    if (value !== null && typeof value === 'object') {
      if (seen.has(value)) return '<Circular>';
      seen.add(value);
    }
    return value;
  }
  return JSON.stringify(obj, detectCircular, 2);
};

const hasProp = (obj, prop) => is.exists(obj) && obj.hasOwnProperty(prop)
const getProp = (obj, prop, defaultValue = null) => hasProp(obj, prop) ? obj[prop] : defaultValue;
const propType = (obj, prop) => getType(obj[prop])
// noinspection JSCheckFunctionSignatures
const mapObject = (a,fn) => Object.fromEntries(Object.entries(a).map(fn)) //fn([k,v]) => [k2,v2]


// Equality is broken up into scalar and vector types. Only equals is exported.
// every() works well with sparse arrays, skipping blanks and allowing exit by returning false (unlike foreach)
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#sparse_arrays
const scalarEquals = (a, b) => a === b;
const arrEquals = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((ai, i) => equals(ai, b[i]));
}
const objEquals = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(key => equals(a[key], b[key]));
}
const equals = (a, b) => {
  if (a === b) return true;
  const aType = getType(a);
  const bType = getType(b);
  if (aType !== bType) return false;

  if (aType === 'array' ) return arrEquals(a, b); else
  if (aType === 'object') return objEquals(a, b); else
  if (aType === 'function') return (a.toString() === b.toString()); else
  return scalarEquals(a, b);
}
const exists = (a) => a !== undefined && a !== null;
// This alone requires node 17+
const clone = structuredClone;
const copy = structuredClone;

const assertEquals = (expected, actual, msg='') =>
  assert(equals(expected, actual), `expected is \n${tryToStringify(expected)} but actual is \n${tryToStringify(actual)}. ${msg}`)

// Can probably eliminate these, I rarely use them.
const and = (a, b) => !!a && !!b
const or = (a, b) => !!a || !!b
const sub = (a, b) => b - a
const add = (a, b) => b + a
const identity = a => a

// It is tempting to add peek like this, but it's in bad taste. So use the functional version:
// Array.prototype.peek = function(){return this.length > 0 ? this[this.length-1] : null};
const peek = (arr, defaultValue=null, depth=1) => (arr.length - depth >= 0) ? arr[arr.length - depth] : defaultValue
const push = (arr, a) => {arr.push(a); return arr} //mutating


// Types
const TYPES = {
  // These are the 7 basic JS types, excluding void and symbol (which I haven't had a use for)
  UNDEF: "undefined",
  NUL: "null",
  STR: "string",
  NUM: "number",
  BOOL: "boolean",
  FUN: "function",
  OBJ: "object",
  SYM: "symbol",

  // Useful but synthetic built in types
  ARR: "array",
  ANY: "any",
  ELT: "element", //useful in browsers

  //Simpatico types
  HANDLER: "handle", //a handler has a handle function
  MSG: "handler", //a message has a handler attr
};

const getType = (a) => {
  const {UNDEF,NUL,STR,FUN,OBJ,ARR,ELT,HANDLER,MSG} = TYPES;
  let t = typeof a;
  if (t !== OBJ)        return t;

  if (a === null)       return NUL;
  if (a === undefined)  return UNDEF;
  if (Array.isArray(a)) return ARR;

  if (
    typeof window  !== 'undefined' &&
    typeof Element !== 'undefined' &&
    a instanceof Element
  )  return ELT;

  // Simpatico types
  if (propType(a, HANDLER) === FUN) return HANDLER;
  if (propType(a, MSG) === STR)     return MSG;
  // Note: properly typing the CORE type messes up the message cascade

  return OBJ;
}

const inferType = (str) => {
  as.str(str);
  if (!isNaN(str)) {
    return 'number';
  } else if (str === 'true' || str === 'false') {
    return 'boolean';
  } else {
    return 'string';
  }
}

const size = (a) => {
  const t = getType(a);
  const {UNDEF,NUL,NUM,STR,FUN,OBJ,ARR,ELT,HANDLER,MSG,SYM} = TYPES;
  switch (t){
    case NUM:
      return a;
    case STR: // todo: deal with unusual encodings
      return a.length;
    case FUN: // fun.length returns argument cardinality
    case ARR:
      return a.length;
    case HANDLER:
    case MSG:
    case OBJ:
      return Object.keys(a).length;
    case UNDEF:
    case NUL:
    case ELT:
    case SYM:
      return 0;
  }
};

// Cast a string into another type - only string, number and boolean supported, currently.
// Mainly supports the case when JS returns NaN when parsing a string
const cast = (str, type=inferType(str)) => {
  const {STR,NUM,BOOL} = TYPES;
  assert(getType(str) === 'string', `string cast value required; called with [${getType(str)}]`);

  switch (type) {
    case STR:
      return str;
    case NUM:
      const result = 1 * str;
      if (isNaN(result)) throw new Error(`Cannot convert ${str} into a number`);
      return result;
    case BOOL:
      return (str === 'true');
    default:
      throw `casting to type ${type} not supported`
  }
};


// "is" are predicates like {NUL: a => getType(a) === NUL, STR: a => getType(a) === STR ...}
// "as" wraps "is" with an assertion  {NUL: (a, msg) => assert(getType(a) === NUL, msg), STR: (a,msg) => assert(getType(a) === STR, msg) ...}
const is = mapObject(TYPES, ([k, v]) =>
  [k.toLowerCase(), a => getType(a) === v]
)
is.fun = (a) => (a instanceof Function) || (typeof a == 'function')
is.int = (a) => is.num(a) && (Math.floor(a) === a);
is.scalar = (a) => !is.arr(a) && !is.obj(a);
is.exists = exists;
// between checks a range inclusively, that is, [lo, hi] not [lo, hi) which may be more typical
is.between = (lo, hi, a) =>
  size(lo) <= size(hi) &&
  size(lo) <= size(a) &&
  size(hi) >= size(a);
is.t = () => true
is.f = () => false
// Arrays
is.all = arr => as.arr(arr) && arr.reduce(and, true)
is.any = arr => as.arr(arr) && arr.reduce(or, false)
is.hasProp = hasProp
is.contains = (arr, a) => as.arr(arr) && arr.includes(a);
is.includes = is.contains;
is.same = (arr) => as.arr(arr) && arr.every(a => equals(a, arr[0]));
is.excludes = (arr, a) => !is.contains(arr, a);
is.arrEquals = arrEquals;
is.equals = equals;
is.notEquals = (a,b) => !equals(a,b);


const as = mapObject(is,([key, predFn]) => [key, (...args) => {
  if (args.length === predFn.length + 1){
    assert(predFn(args.slice(0, -1)), peek(args))
  } else {
    assert(predFn(...args))
  }
  return true;
}]);

// Override some assertions for better messages.
as.equals = (a,b) => {
  if (is.equals(a,b)) return true;
  else throw `expected ${a} but got ${b}`;
}


// ====================================
// Math stuff
// ===================================

const arrMin = arr => Math.min( ...arr );
const arrMax = arr => Math.max( ...arr );

// A simple PRNG inside the browser.
function RNG(seed) {
  // A simple seedable RNG based on GCC's constants
  // https://en.wikipedia.org/wiki/Linear_congruential_generator
  this.m = 0x80000000; // 2**31;
  this.a = 1103515245;
  this.c = 12345;
  this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
}
RNG.prototype.nextInt = function () {
  this.state = (this.a * this.state + this.c) % this.m;
  return this.state;
}
RNG.prototype.nextFloat = function () {
  // returns in range [0,1]
  return this.nextInt() / (this.m - 1);
}
RNG.prototype.nextRange = function (start, end) {
  // returns in range [start, end): including start, excluding end
  // can't modulo nextInt because of weak randomness in lower bits
  const rangeSize = end - start;
  const randomUnder1 = this.nextInt() / this.m;
  return start + Math.floor(randomUnder1 * rangeSize);
}
RNG.prototype.choice = function (arr) {
  return arr[this.nextRange(0, arr.length)];
}
// In-place Fisher-Yates shuffle using ES6 swap
const shuffle = arr => {
  if (arr.length < 2) return arr;
  let right, left, {floor, random} = Math;
  for (right = arr.length - 1; right > 0; right--) {
    left = floor(random() * (right + 1));
    [arr[left], arr[right]] = [arr[right], arr[left]];
  }
  return arr;
}

/*
 * Treat input as JSON without proper quotes, which is more convenient to author in many places, particular in a terminal.
 * Write "{http:80, https:443}" instead of having to quote (and escape those quotes).
 * Limitations: all values are treated as strings; spaces not allowed around the colon; no leading spaces supported.
 *
 * See https://regexr.com/77sar to improve this, and issue a PR at https://github.com/javajosh/simpatico
 */
const parseObjectLiteralString = arg => {
  as.str(arg);
  // Quote anything that isn't quoted
  // Please note that this implementation assumes that there are no colons, commas, or curly braces within the unquoted values.
  const quoted = arg.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:(['"])?([a-zA-Z0-9\\.\/]+)(['"])?/g, '"$2":"$5"');
  const untyped = JSON.parse(quoted);
  return mapObject(untyped, ([k,v])=>([k, cast(v)]));
}

const regex ={
  email: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/, //regexr.com/2rhq7
  password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, //regexr.com/3bfsi
  matchNonAscii: /[^\x00-\x7F]+ *(?:[^\x00-\x7F]| )*/, //regexr.com/3acrs
  ipAddress: /\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/, // regexr.com/38odc
  svgOptimize: /(\d*\.\d{3})\d*/, // regexr.com/2ri1h really like the simplicity
  url: /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/, //regexr.com/2rj36 too permisive but its okay
  functions: /^(\s*(async\s+)?function\s+\w*\s*\([\w\s,]*\)\s*{)|(\s*async\s*\([\w\s,]*\)\s*=>)/,
}

// For limits, see: https://stackoverflow.com/questions/2989284/what-is-the-max-size-of-localstorage-values
// Gives ways to measure, suggests 5MB total, 5242878, 5.2M characters
const safeSetItem = (key, value, ls=window.localStorage) => {
  // If the key isn't already in there, write it and return true, otherwise leave it alone return false.
  // Refrain from returning the value because it makes calling this function and interpreting the result too confusing.
  if (!ls.hasOwnProperty(key)) {
    ls.setItem(key, value);
    return true;
  }
  return false;
}

function stringifyWithFunctions(obj) {
  return JSON.stringify(obj, function (key, value) {
    let fnBody;
    if (is.fun(value)) {
      fnBody = value.toString();
      if (fnBody.length < 8 || fnBody.substring(0, 8) !== 'function') { //this is ES6 Arrow Function
        return '_ArrowF_' + fnBody;
      }
      return fnBody;
    }
    if (is.sym(value)){
      return '_Symbol_' + Symbol.keyFor(value);
    }
    return value;
  });
}

function parseWithFunctions(str) {
  return JSON.parse(str, function (key, value) {
    if (typeof value != 'string') {
      return value;
    }
    if (value.length < 8) {
      return value;
    }
    let prefix = value.substring(0, 8);
    if (prefix === 'function') {
      return eval('(' + value + ')');
    }
    if (prefix === '_ArrowF_') {
      return eval(value.slice(8));
    }
    if (prefix === '_Symbol_') {
      return Symbol.for(value.slice(8));
    }
    return value;
  });
}

/**
 * Return N bytes (default 20) of random base64 encoded in a URL-safe string.
 * Inspired by: https://neilmadden.blog/2018/08/30/moving-away-from-uuids/
 * Note: this is browser only.
 * @example
 *  console.log("deepId()", deepId());
 * @returns 20 bytes of random data, base64 encoded.
 */
function deepId(depthInBytes=20) {
  const data = new Uint8Array(depthInBytes);
  self.crypto.getRandomValues(data);
  return base64EncodeBuffer(data);
}

// Note: this is browser only.
function base64EncodeBuffer(buffer, debug=false){
  // NB: you can't use map() here because of array typing.
  const chars = [];
  const bytes = new Uint8Array(buffer);
  for(let i = 0; i < bytes.byteLength; i++){
    chars.push(String.fromCharCode(bytes[i]));
  }
  if (debug) log(
    'buffer', buffer,
    'chars', chars,
    "chars.join('')", chars.join(''),
    "btoa(chars.join(''))", btoa(chars.join('')),
  );

  return btoa(chars.join(''));
}


const encodeBase64URL = data => {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=+$/, "");
}
// A base64 encoding that's URL safe
const decodeBase64URL = base64URL => {
  let base64 = base64URL
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }

  const d = atob(base64.trim()), b = new Uint8Array(d.length)
  for (let i = 0; i < d.length; i++) b[i] = d.charCodeAt(i)
  return b
}



export {
  is, as, getType, size, cast, TYPES,
  now, log, debug, info, error, date,
  assert, assertEquals, assertThrows,
  hasProp, getProp, propType, mapObject,
  equals, clone, exists,
  arrMin, arrMax, peek, push, copy,
  and, or, sub, add, identity,
  RNG, shuffle,
  tryToStringify, parseObjectLiteralString, regex,
  safeSetItem, parseWithFunctions, stringifyWithFunctions,
  deepId, base64EncodeBuffer, encodeBase64URL, decodeBase64URL,
}

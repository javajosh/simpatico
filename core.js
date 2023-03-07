const now = () => Date.now() // e.g. 1678023832587
const date = () => new Date().toISOString() // e.g. 2023-01-29T03:40:21.319Z
const log = console.log.bind(console)
const debug = console.debug.bind(console)
const info = console.info.bind(console)

const error = msg => {throw new Error(msg)}
const assert = (truthy, msg) => !!truthy ? true : error(msg)
const assertThrows = fn => {
  assert(typeof fn === 'function', `assertThrows must take a function argument instead got ${getType(fn)}`);
  let throws = false, result;
  try { result = fn() } catch (e) { throws = true }
  assert(throws, `Expected fn to throw, but it didn't and returned [${tryToStringify(result)}]`);
};

const tryToStringify = a => {
  if (typeof a !== 'object') return a;
  let result = '<Circular>';
  try{ result = JSON.stringify(a); } catch (ignored) {}
  return result;
}

const hasProp = (obj, prop) => obj.hasOwnProperty(prop)
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
  return scalarEquals(a, b);
}

const assertEquals = (expected, actual, msg='') =>
  assert(equals(expected, actual), `expected is ${tryToStringify(expected)} but actual is ${tryToStringify(actual)}. ${msg}`)

// Can probably eliminate these, I rarely use them.
const and = (a, b) => !!a && !!b
const or = (a, b) => !!a || !!b
const sub = (a, b) => b - a
const add = (a, b) => b + a
const identity = a => a
const curryLeft = (f, a) => b => f(a,b) //left to right
const curryRight = (f, a) => b => f(b,a) //right to left
const curry = curryLeft
const compose = (f, g) => a => g(f(a))

// It is tempting to add peek like this, but it's in bad taste. So use the functional version:
// Array.prototype.peek = function(){return this.length > 0 ? this[this.length-1] : null};
const peek = (arr, defaultValue=null, depth=1) => (arr.length - depth >= 0) ? arr[arr.length - depth] : defaultValue
const push = (arr, a) => {arr.push(a); return arr} //mutating

// Copies good for arrays
const copy1 = a => [...a]
const copy2 = a => a.slice()
// Copies good for objects
const copy3 = a => JSON.parse(JSON.stringify(a)) //sadly unstable key order
const copy4 = a => mapObject(a, identity); //shallow copy, but might be extensible.
const copy = copy3; //TODO: find or make a better copy.


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

  // Useful but synthetic built in types
  ARR: "array",
  ANY: "any",
  ELT: "element", //useful in browsers

  //Simpatico types
  HANDLER: "handle", //a handler has a handle function
  MSG: "msg", //a message has a msg attr
};

const getType = (a) => {
  const {UNDEF,NUL,STR,FUN,OBJ,ARR,ELT,CORE,HANDLER,MSG} = TYPES;
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

const size = (a) => {
  const t = getType(a);
  const {UNDEF,NUL,NUM,STR,FUN,OBJ,ARR,ELT,HANDLER,MSG} = TYPES;
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
      return 0;
  }
};

// Cast a string into another type - only string, number and boolean supported, currently.
// Mainly supports the case when JS returns NaN when parsing a string
const cast = (type, str) => {
  const {STR,NUM,BOOL} = TYPES;
  assert(getType(str) === 'string', `string cast value required; called with [${getType(str)}]`);

  switch (type) {
    case STR:
      return str;
    case NUM:
      const result = 1 * str;
      if (Number.isNaN(result)) throw new Error(`Cannot convert ${str} into a number`);
      return result;
    case BOOL:
      return (str === 'true');
    default:
      throw `casting to type ${type} not supported`
  }
};


// is looks something like {NUL: a => getType(a) === NUL, STR: a => getType(a) === STR ...}
// ASSERT wraps with an assertion  {NUL: (a, msg) => assert(getType(a) === NUL, msg), STR: (a,msg) => assert(getType(a) === STR, msg)}
const is = mapObject(TYPES, ([k, v]) =>
  [k.toLowerCase(), a => getType(a) === v]
)
is.int = (a) => is.num(a) && (a % 1 === 0)
is.exists = a => (typeof a !== 'undefined') && (a !== null)
is.between = (lo, hi, a) =>
  size(lo) <= size(hi) &&
  size(lo) <= size(a) &&
  size(hi) >= size(a);

is.t = () => true
is.f = () => false
// Arrays
is.all = arr => as.arr(arr) && arr.reduce(and, true)
is.any = arr => as.arr(arr) && arr.reduce(or, false)



// It would be nice if this was expressible as arr.reduce(equals, true), but I couldn't get it to work.
// Also, this code is probably a lot more performant.
is.same = (arr) => {
  as.arr(arr);
  let prev = arr[0], curr;
  for(let i = 1; i < arr.length; i++){
    curr = arr[i];
    if (!equals(curr, prev)){
      return false;
    }
  }
  return true;
}
is.contains = (arr, a) => as.arr(arr) && arr.includes(a);
is.includes = is.contains;
is.excludes = (arr, a) => !is.contains(arr, a);
is.arrEquals = arrEquals;
is.equals = equals;

// This is awkward because we have to guess the cardinality of the predicate.
// Another reason why the more straight-forward form is probably better.
const as = mapObject(is,([k,v]) =>
  [k, (a, b, c, d) => assert(v(a,b,c), d)]
);

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
  // Currently no space is allowed between quotes - !
  const quoted = arg.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:(['"])?([a-zA-Z0-9\\.\/]+)(['"])?/g, '"$2":"$5"');
  return JSON.parse(quoted);
}

const regex ={
  email: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/, //regexr.com/2rhq7
  password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, //regexr.com/3bfsi
  matchNonAscii: /[^\x00-\x7F]+\ *(?:[^\x00-\x7F]| )*/, //regexr.com/3acrs
  ipAddress: /\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/, // regexr.com/38odc
  svgOptimize: /(\d*\.\d{3})\d*/, // regexr.com/2ri1h really like the simplicity
  url: /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/, //regexr.com/2rj36 too permisive but its okay
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


export {
  is, as, getType, size, cast, TYPES,
  now, log, debug, info, error,
  assert, assertEquals, assertThrows,
  hasProp, getProp, propType, mapObject,
  equals,
  arrMin, arrMax, peek, push, copy,
  and, or, sub, add, identity, curryLeft, curryRight, curry, compose,
  RNG, shuffle,
  tryToStringify, parseObjectLiteralString, regex,
}

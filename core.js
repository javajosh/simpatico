// The most basic useful functions
export const now = a => a ? Date.now() - a : Date.now()
export const log = console.log.bind(console)
export const debug = console.debug.bind(console)
export const info = console.info.bind(console)

export const error = msg => {throw new Error(msg)}
export const assert = (truthy, msg) => truthy ? true : error(msg)
export const assertThrows = fn => {
  assert(typeof fn === 'function', `assertThrows must take a function argument instead got ${getType(fn)}`); let throws = false; let result;
  try { result = fn() } catch (e) { throws = true }
  assert(throws, `Expected fn to throw, but it didn't and returned [${tryToStringify(result)}]`);
};

export const tryToStringify = a => {
  if (typeof a !== 'object') return a;
  let result = '<Circular>';
  try{ result = JSON.stringify(a); } catch (ignored) {}
  return result;
}

export const hasProp = (obj, prop) => obj.hasOwnProperty(prop)
export const getProp = (obj, prop, defaultValue=null) => hasProp(obj, prop) ? obj[prop] : defaultValue;
export const propType = (obj, prop) => getType(obj[prop])
// noinspection JSCheckFunctionSignatures
export const mapObject = (a,fn) => Object.fromEntries(Object.entries(a).map(fn))
export const equals = (a,b) => typeof a === 'object' ? tryToStringify(a) === tryToStringify(b) : a === b;
export const arrEquals = (a,b) => ASSERT.arr(a) && ASSERT.arr(b) && a.length === b.length &&
  a.map((v,i) => v === b[i]).reduce(and, true)

export const assertEquals = (actual, expected, msg='') =>
  assert(equals(actual, expected), `actual is ${tryToStringify(actual)} but expected ${tryToStringify(expected)}. ${msg}`)

// Functional logic
export const and = (a,b) => !!a && !!b
export const or = (a,b) => !!a || !!b

// Higher order functions
export const identity = a => a
export const curryLeft = (f, a) => b => f(a,b) //left to right
const curryRight = (f, a) => b => f(b,a) //right to left
export const curry = curryLeft
export const compose = (f, g) => a => g(f(a))

// It is tempting to add peek like this, but it's in bad taste. So use the functional version
// Array.prototype.peek = function(){return this.length > 0 ? this[this.length-1] : null};
export const peek = (arr, defaultValue=null) => arr.length ? arr[arr.length - 1] : defaultValue
export const push = (arr, a) => {arr.push(a); return arr} //mutating

// Copies good for arrays
const copy1 = a => [...a]
const copy2 = a => a.slice()
// Copies good for objects
const copy3 = a => JSON.parse(JSON.stringify(a)) //sadly unstable key order
const copy4 = a => mapObject(a,identity); //shallow copy, but might be extensible.
const copy = copy3; //TODO: find or make a better copy.



// Types
export const TYPES = {
  // These are the 7 basic JS types, excluding void (which I haven't had a use for)
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

export const getType = (a) => {
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

export const size = (a) => {
  const t = getType(a);
  const {UNDEF,NUL,NUM,STR,FUN,OBJ,ARR,ELT,HANDLER,MSG} = TYPES;
  switch (t){
    case NUM:
      return a;
    case STR:
      return a.length;
    case ARR:
      return a.length;
    case HANDLER:
    case MSG:
    case OBJ:
      return Object.keys(a).length;
    case UNDEF:
    case NUL:
    case FUN:
    case ELT:
      return 0;
  }
};

// Cast a string into another type - only string, number and boolean supported, currently.
// Mainly supports the case when JS returns NaN when parsing a string
export const cast = (type, str) => {
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




// PREDS looks something like {NUL: a => getType(a) === NUL, STR: a => getType(a) === STR ...}
// ASSERT wraps with an assertion  {NUL: (a, msg) => assert(getType(a) === NUL, msg), STR: (a,msg) => assert(getType(a) === STR, msg)}
export const is = mapObject(TYPES,([k,v])=>[k.toLowerCase(), a => getType(a) === v])
is.int = (a, msg) => is.NUM(a,msg) && (a % 1 === 0)
is.exists = a => (typeof a !== 'undefined') && (a !== null)
is.between = (lo, hi, a) =>
  size(lo) <= size(hi) &&
  size(lo) <= size(a) &&
  size(hi) >= size(a);

is.t = a => true
is.f = a => false
// Arrays
is.all = arr => ASSERT.arr(arr) && arr.reduce(and, true)
is.any = arr => ASSERT.arr(arr) && arr.reduce(or, false)

// It would be nice if this was expressable as arr.reduce(equals, true), but I couldn't get it to work.
// Also, this code is probably a lot more performant.
is.same = arr => {
  ASSERT.arr(arr);
  let prev = arr[0], curr;
  for(let i = 1; i < arr.length; i++){
    curr = arr[i];
    if (!equals(curr, prev)){
      return false;
    }
  }
  return true;
}
is.contains = (arr, a) => ASSERT.arr(arr) && arr.includes(a);
is.excludes = (arr, a) => !is.contains(arr, a);
is.arrEquals = arrEquals;

export const ASSERT = mapObject(is,([k,v]) => [k, (a, b, c, d) => assert(is[k](a,b,c), d)]);

// A simple PRNG inside the browser.
// Note that every call increments state exactly once.
// Q: convert this into a generator function?
export function RNG(seed) {
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
// Fisher-Yates shuffle using ES6 swap
export const shuffle = arr => {
  ASSERT.arr(arr);
  assert(arr.length > 1);
  let right, left, {floor, random} = Math;
  for (right = arr.length - 1; right > 0; right--) {
    left = floor(random() * (right + 1));
    [arr[left], arr[right]] = [arr[right], arr[left]];
  }
}

export default {
  now, log, debug, info, error, assert, assertThrows, tryToStringify,
  hasProp, getProp, propType, mapObject,
  equals, arrEquals, assertEquals,
  and, or, identity, curryLeft, curryRight, curry, compose,
  peek, push, copy,
  TYPES, getType, size, cast, is, ASSERT,
  RNG, shuffle
}

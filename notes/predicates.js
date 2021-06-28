'use strict';

// I actually really like how this looks.
// However, core.js has a better implementation.
// Will keep for historical reasons.
const assertTrue = (a, msg) => {if (!a) throw msg};

const pred = {
  string: a => typeof a === 'string',
  number: a => typeof a === 'number',
  boolean: a => typeof a === 'boolean',
  fun: a => typeof a === 'function',
  object: a => typeof a === 'object' && !Array.isArray(a),
  array: a => Array.isArray(a),
  equals: (a,b) => a === b,
  email: a => pred.string(a) && a.match(/@/),
  hasKey: (a,b) => pred.object(a) && pred.string(b) && a.hasOwnProperty(b),
  contains: (a,b) => pred.array(a) && a.indexOf(b) !== -1,
}

const assert = {
  string: a => assertTrue(pred.string(a), `[${a}] is not a string`),
  number: a => assertTrue(pred.number(a), `[${a}] is not a number`),
  boolean: a => assertTrue(pred.boolean(a), `[${a}] is not a boolean`),
  fun: a => assertTrue(pred.fun(a), `[${a}] is not a function`),
  object: a => assertTrue(pred.object(a), `[${a}] is not a object`),
  array: a => assertTrue(pred.array(a), `[${a}] is not a array`),
  equals: (a, b) => assertTrue(pred.equals(a,b), `[${a}] is not equal to [${b}]`),
  email: a => assertTrue(pred.email(a), `[${a}] doesn't look like an email (needs an @ symbol)`),
  hasKey:(a,b) => assertTrue(pred.hasKey(a,b), `[${a}] doesn't have key [${b}]`),
  contains: (a, b) => assertTrue(pred.contains(a,b), `\`[${a}] doesn't contain value [${b}]\``)
}

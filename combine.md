# combine()
2024

A generalization of `Object.assign` that supports reduction, adding/removing properties and invoking functions.

See:
[home](/),
[stree](/stree.md),
[litmd](/lit.md),
[audience](/audience.md)


`combine(a, b)` combines two object arguments `b` with `a` and returns the result. Example usage:

```html
<script type="module">
  import {assertEquals} from '/core.js';
  import {combine} from '/combine.js';

  assertEquals(3, combine(1, 2));
</script>
```

To use the library in node, omit the script tags and set `{"type": "module"}` in `package.json`.
Note: I'd like to support npm `require()` as well, however that requires a UMD wrapping tool like Webpack, which I'm unwilling to add at this point.

Simpatico is not yet published to npm, but for now a simple `wget` will work:
```bash
  $ curl -O https://raw.githubusercontent.com/javajosh/simpatico/master/combine2.js
```
Within [litmd](/lit.md) code snippets served by the [reflector](/reflector.md) you can omit this particular import statement.
(If you don't include your own imports, default imports will apply):

```js
  import {combine} from '/combine.js';

assertEquals(3, combine(1, 2));
```
This code has executed in your browser context.
It executed after your page finished loading.
There may be output in the console (accessed via the dev tools, which in most browsers is `F12`).
In fact, every code snippet on this page executed already!

_________________________________________________________
# Combining data objects together
Combine's action varies according to the types of its arguments.
Numbers add. Most other scalars "replace":

```js
  import {combine} from "/combine.js";

assertEquals('bar', combine('foo', 'bar'), 'strings replace');
assertEquals(false, combine(true, false), 'booleans replace');
let a = () => {
}, b = () => {
};
assertEquals(b, combine(a, b), 'functions replace');
```
For objects, combine mostly behaves just like `Object.assign`.
They both merge keys:

```js
  import {combine} from "/combine.js";

assertEquals({a: 1, b: 2}, combine({a: 1}, {b: 2}), 'combine merges keys');
assertEquals({a: 1, b: 2}, Object.assign({}, {a: 1}, {b: 2}), 'Object.assign merges keys');
```
 `Object.assign` is shallow, `combine()` is deep:

```js
  import {combine, DELETE} from "/combine.js";

assertEquals({a: {b: 2}}, combine({a: {b: 1}}, {a: {b: 1}}), 'combine is deep');
assertEquals({a: {b: 1}}, Object.assign({}, {a: {b: 1}}, {a: {b: 1}}), 'Object.assign is shallow');
```
## Deleting
Ideally we could use a type like 'undefined' to delete object properties.
However javascript cannot differentiate between missing and undefined properties.
Null indicates zero.
A `Symbol` would work, but cannot be easily de/serialized. (We might do `Symbol(DELETE)`, however)
So we pick a special string and export it from `combine`.

```js
  import {combine, DELETE} from "/combine.js";

  assertEquals({}, combine({a:1}, {a: DELETE}), 'special delete token deletes');
```
_________________________________________________________
# Combining with Handlers

`combine()` supports *handlers*. A handler looks like this:

```js
  // This handler ignores its arguments and returns an array of 2 objects:
  const inc = {handle: (core, msg) => [ {a:1}, {b:2} ] };
  assertEquals([ {a:1}, {b:2} ], inc.handle());
```

Handlers are how you program cores in Simpatico.
Handlers are objects with a `handle` property, which should be a function that takes two arguments, `core` and `msg`.
The core is the target, or destination, of the message.
The result is an array of objects that describe how the core should change.
_________________________________________________________
## handle : (core, msg) => [ ]
Handlers take two arguments, the target and the message, in the first and second position respectively.
Also, we add a 'msg' entry that describes a typical message for this handler:

```js
  import {combine} from "/combine.js";
// This handler returns an array of 2 objects:
const inc = {handle: (core, msg) => [{a: 1}, {b: 2}]};
assertEquals([{a: 1}, {b: 2}], inc.handle());

// the core is a handlers object, plus some state, called residue
// in this case the residue is initialized to {a:10, b:20}
const core = {handlers: {inc}, a: 10, b: 20};

// call the handler with a message
const msg = {handler: 'inc'};

// check the effect on residue
assertEquals({handlers: {inc}, a: 11, b: 22}, combine(core, msg), 'shows a side-effect on residue.');
assertEquals({handlers: {inc}, a: 10, b: 20}, core, 'core is untouched');
assertEquals({handlers: {inc}, a: 11, b: 22}, combine(core, msg));
assertEquals({handlers: {inc}, a: 12, b: 24}, combine(core, msg, msg), 'increments compound');
assertEquals({handlers: {inc}, a: 13, b: 26}, combine(core, msg, msg, msg));
```

The handler above takes no arguments and gives a constant result.
We leave the `(core, msg)` named arguments for consistency, even though we're not using them.
It's a dual counter, where `a` is incremented by 1, and `b` by 2.
We initialize both `a` and `b` to show there is interaction between the result of `inc` and current core state.

### Similarity to apply()
The handler signature is similar to `Function.prototype.apply()`.
The first argument, the "`thisArg`" is the core, the context, the second argument, the args, is the message itself.
See: [JavaScript Function specification](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function.prototype.apply)

### Aside: Use explicit residue?
Some prototypes used this structure to keep residue separate from handlers.
I've avoided doing it this way, but I'm not sure why.
It *is* annoying to separate them!
```js
    const core = {handlers: {}, residue:{a:1, b:2}};
```
_________________________________________________________
## Assertion handler
Before moving on its useful to define an "<span title="This was successful and was extracted into handlers.js">assertion handler</span>":

```js
  import {combine} from "/combine.js";

const assertHandlerDemo = {
  name: 'assert',
  install: function () {
    return {handlers: {assert: this}}
  },
  call: a => ({handler: 'assert', ...a}),
  handle: (core, msg) => {
    Object.entries(msg).forEach(([key, msgValue]) => {
      if (key === 'handler' || key === 'parent') return; // skip the handler name itself
      if (core.hasOwnProperty(key)) assertEquals(msgValue, core[key]);
      else throw 'core is missing asserted property ' + key;
    });
    return [{}];
  },
};
const has = assertHandlerDemo.call;

//1. The long-winded way to use the assert handler:
assertThrows(() => {
  combine(
    {a: 1, handlers: {assert: assertHandlerDemo}},
    {a: 2, handler: 'assert'},
  );
});
combine(
  {a: 1, handlers: {assert: assertHandlerDemo}},
  {a: 1, handler: 'assert'},
);

// 2. the less brittle, shorter way to call the assert handler:
assertThrows(() => combine(assertHandlerDemo.install(), {a: 1}, has({a: 2})));
combine(assertHandlerDemo.install(), {a: 1}, has({a: 1}));

// 3. A nice call and response pattern using the shorter form:
combine(assertHandlerDemo.install(),
  {a: 1}, has({a: 1}),
  {c: 'foo'}, has({c: 'foo'}),
);
```
The object structure is primary - the rest of it is just window dressing.
(It might also be nice to experiment defining handlers not as plain objects that contain a function,
but as a function object that can both be invoked and have properties added to it.)

Here is a somewhat redundant example that I may remove in the future (although it does demonstrate using core values in the handler result):

```js
  import {combine} from "/combine.js";
import {assertHandler} from "/handlers.js";

const has = assertHandler.call;
const dbl = {
  call: () => ({handler: 'dbl'}),
  install: function () {
    return {handlers: {dbl: this}, a: 0, b: 0}
  },
  handle: (core, msg) => [{a: core.a}, {b: core.b}],
}

const ops = [
  assertHandler.install(), dbl.install(),
  {a: 10, b: 20}, has({a: 10, b: 20}),
  dbl.call(), has({a: 20, b: 40}),
  dbl.call(), has({a: 40, b: 80}),
  ...etc
];
combine(ops);
```
_________________________________________________________
## Log Handler
<span title="Also successful, extracted into handlers.js">This is a handler that logs</span>

```js
import {hasProp} from "/core.js";
import {combine} from "/combine.js";
import {assertHandler, logHandler} from "/handlers.js";

const logHandlerDemo = {
  name: 'log',
  install: function (outputFunction = log) {
    this.outputFunction = outputFunction;
    return {
      handlers: {log: this},
      debug: true, // residue can turn off logging
      lastOutput: '', // the last thing logged
    }
  },
  call: a => {
    if (typeof a === 'string') a = {msg: a};
    return {handler: 'log', ...a};
  },
  handle: function (core, msg) {
    if (core.debug) {
      this.outputFunction('logHandler', msg, core);
      if (hasProp(msg, 'msg'))
        return [{lastOutput: msg.msg}];
    }
    return [];
  }
};


const has = assertHandler.call;
const loggy = logHandlerDemo.call;
const ops = [
  assertHandler.install(),
  logHandlerDemo.install(),
  has({debug: true, lastOutput: ''}),
  {a: 10, b: 20}, loggy('prints the core'), has({lastOutput: 'prints the core'}),
  {debug: false}, loggy('does not print'), has({lastOutput: 'prints the core'}),
  {debug: true}, loggy('prints again'), has({lastOutput: 'prints again'}),
  ...etc
];
combine(ops);

```
_________________________________________________________
## Handlers replace each other
Handlers replace, so we can overwrite the old handler and call it with the same message:

```js
  import {combine} from "/combine.js";
import {assertHandler} from "/handlers.js";

const has = assertHandler.call;
const inc1 = {handle: () => [{a: 1}, {b: 2}]};
const inc2 = {handle: () => [{a: -1}, {b: -2}]}
const msg = {handler: 'inc'}

const ops = [
  assertHandler.install(), {handlers: {inc: inc1}},
  {a: 10, b: 20}, has({a: 10, b: 20}),
  msg, has({a: 11, b: 22}), // The message increased residue
  {handlers: {inc: inc2}},             // Replace inc1 with inc2 answering to the 'inc' msg
  msg, has({a: 10, b: 20}), // The message decreased residue
  msg, has({a: 9, b: 18}),
  ...etc
];
combine(ops);
```
The handler overwriting feature is key to enabling *type versioning* in the [stree](/kata/stree.md).

Also, I pity the linter that attempts to [lint](/kata/lint.md) this code.
_________________________________________________________
## Handlers call each other

Functions replace, so we can overwrite the old handler and call it with the same message:

```js
  import {combine} from "/combine.js";
import {assertHandler} from "/handlers.js";

const has = assertHandler.call;
const h1 = {
  handle: () => [{handler: 'h2'}, {a: 1}],
  call: () => ({handler: 'h1'}),
};
const h2 = {
  handle: () => [{b: 1}],
  call: () => ({handler: 'h2'}),
};

const ops = [
  {handlers: {h1, h2, assert: assertHandler}},
  {a: 0, b: 0}, has({a: 0, b: 0}),
  h1.call(), has({a: 1, b: 1}), // The only way that b increments is if h2 is called; hence h2 been called indirectly.
  h1.call(), has({a: 2, b: 2}),
  ...etc
];
combine(ops);
```
# Handlers that return non-array results are treated as an error
A non-array return value is treated as a recoverable error.
Because `combine` is a pure function, no modification of the core occurs.


```js
import { combine } from '/combine.js';

const alwaysErrorHandler = {handlers: {err: {name: 'err', handle: () => ({a:1, b:2})}}};
let result;
try{
  result = combine([alwaysErrorHandler, {handler: 'err'} ]);
} catch(e) {
  assertEquals({a:1, b:2}, e.customData);
  assertEquals(undefined, result);
}
```
# Combine and friendly functions
This convention supports the use of [friendly functions](friendly.md) to do validation on handler arguments.
(This will be a regular pattern in most handlers, so we will eventually move the boilerplate into combine.)
```js
import { combine } from '/combine.js';
import { validate } from '/friendly.js';

const user = {
  name: 'user',
  pattern: {
      name: ['str', 'between', 1,10],
      age: [ 'num', 'between', 1, 100],
  },
  example: {
      name: 'alice',
      age: 25,
  },
  handle: function (core, msg) {
      // check that the msg is valid
      const errors = validate(this.pattern, msg);
      if (errors) return errors;
      // if valid, remove the handler property to avoid blowing the stack and return in an array
      const {handler, ...user} = msg;
      return [user];
  }
}
let result;

// no user data at all
try {
  result = combine([{handlers: {user}}, {handler: 'user'}]);
  assertTrue(false);
}catch (e){
  assertEquals({name: ['str', 'between', 1,10], age: [ 'num', 'between', 1, 100]}, e.customData);
  assertEquals(undefined, result);
}
// only the name, missing age
try {
  result = combine([{handlers: {user}}, {handler: 'user', name: 'alice'}]);
  assertTrue(false);
}catch (e){
  assertEquals({age: [ 'num', 'between', 1, 100]}, e.customData);
  assertEquals(undefined, result);
}
// both name and age are present
result = combine([{handlers: {user}}, {handler: 'user', name: 'alice', age: 25}]);
assertEquals('alice', result.name);
assertEquals(25, result.age);

```

# Custom rules
You can override the default ruleset in combine.
```js
import {combineRules} from '/combine.js';

assertEquals(6, combineRules(2,3, (a,b) => a * b));
// custom embedded rules are scalar so they work in objects.
// to do general custom rules would require type-checking
assertEquals({a: 6}, combineRules({a:2},{a:3}, (a,b) => a * b));

//To make it a reducer you need to do a manaul partial application.
const mulCombine = (a,b) => combineRules(a,b,(a,b) => a * b);
assertEquals(16, [2,2,2,2].reduce(mulCombine, 1));
```
Note that in a [previous version](/notes/combine.md) combine rules were specified as a ruleset, and so easily replaced without function composition.

# Message Cascade with msgs
It is sometimes useful to expose the message cascade to calling code.
This only applies when a handler calls another handler.
In this case, `combine` will add a `msgs` property to the residue, and include a simple, linear representation of the message cascade.

TODO add a code example



_________________________________________________________
# Next: stree

Modeling program state as a monotonically increasing list of input, all of which are objects, gives us a great benefit:
We can imagine branching our program state in a very natural way.
This method of branching turns out to be both simpler and more expressive than either inheritance relationships or instantiation.
This will be dealt with in the `stree` section.

Continue with [stree3](./stree3.md).

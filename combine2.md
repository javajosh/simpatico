\<!DOCTYPE html>
\<head>
  <title>Simpatico: combine()</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='white' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">
  <link class="hljs" rel="stylesheet" href="/kata/highlight.github.css">
  <script class="testable" src="testable.js" type="module"></script>
  <script class="hljs" type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    const d=document, elts = a => d.querySelectorAll(a);
    hljs.registerLanguage('javascript', javascript);
    d.addEventListener('DOMContentLoaded', () =>
      elts('pre code').forEach(block =>
        hljs.highlightElement(block)));
  </script>
</head>`
_________________________________________________________
# Simpatico: combine()
2023

See:
[home](/),
[combine](./combine2.html),
[stree](./stree2.md),
[markdown](/kata/markdown.md),
[audience](/audience.md)

<!--div class="makeItStop">I find the auto-refresh to be too annoying to leave on by default.</div-->

`combine(a, b)` combines two object arguments `b` with `a` and returns the result.
You use it in a webpage like this:
```html
<script type="module">
  import {assertEquals} from '/core.js';
  import {combine} from '/combine2.js';
  assertEquals(3, combine(1, 2));
</script>
```
Note: this code doesn't execute in the page context because it is HTML and not JavaScript

To use the library in node, omit the script tags and set `{"type": "module"}` in `package.json`.
Simpatico is not yet published to npm, but for now a simple `wget` will work:
```bash
  $ curl -O https://raw.githubusercontent.com/javajosh/simpatico/master/core.js
  $ curl -O https://raw.githubusercontent.com/javajosh/simpatico/master/combine2.js
```
Within [markdown](/kata/markdown.md) code snippets served by the [reflector](/reflector.md) you can omit this particular import statement.
(If you don't include your own imports, default imports will apply):
```js
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
  assertEquals('bar', combine('foo', 'bar'), 'strings replace');
  assertEquals(false, combine(true, false), 'booleans replace');
  let a = () => {}, b = () => {};
  assertEquals(b, combine(a, b), 'functions replace');
```
For objects, combine mostly behaves just like `Object.assign`.
They both merge keys:

```js
  assertEquals({a:1, b:2}, combine({a:1},{b:2}), 'combine merges keys');
  assertEquals({a:1, b:2}, Object.assign({},{a:1},{b:2}), 'Object.assign merges keys');
```
 `Object.assign` is shallow, `combine()` is deep:
```js
  assertEquals({a: {b : 2}},          combine({a: {b : 1}}, {a: {b : 1}}), 'combine is deep');
  assertEquals({a: {b : 1}}, Object.assign({},{a: {b : 1}}, {a: {b : 1}}), 'Object.assign is shallow');
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
Handlers are objects with a handle property, which should be a function that takes two arguments, core and msg.
The core is the target, or destination, of the message.
The result is an array of objects that describe how the core should change.
_________________________________________________________
## handle : (core, msg) => [ ]
Handlers take two arguments, the target and the message, in the first and second position respectively.
Also, we add a 'msg' entry that describes a typical message for this handler:

```js
  // This handler returns an array of 2 objects:
  const inc = {handle: (core, msg) => [ {a:1}, {b:2} ] };
  assertEquals([ {a:1}, {b:2} ], inc.handle());

  // the core is a handlers object, plus some state, called residue
  // in this case the residue is initialized to {a:10, b:20}
  const core= {handlers: {inc}, a:10, b:20};

  // call the handler with a message
  const msg = {handler: 'inc'};

  // check the effect on residue
  assertEquals({handlers: {inc}, a:11, b:22}, combine(core, msg), 'shows a side-effect on residue.');
  assertEquals({handlers: {inc}, a:10, b:20}, core, 'core is untouched');
  assertEquals({handlers: {inc}, a:11, b:22}, combine(core, msg));
  assertEquals({handlers: {inc}, a:12, b:24}, combine(core, msg, msg), 'increments compound');
  assertEquals({handlers: {inc}, a:13, b:26}, combine(core, msg, msg, msg));
```

The handler above takes no arguments and gives a constant result.
We leave the `(core, msg)` named arguments for consistency, even though we're not using them.
It's a dual counter, where `a` is incremented by 1, and `b` by 2.
We initialize both `a` and `b` to show there is interaction between the result of `inc` and current core state.

### Use explicit residue?
Some prototypes used this structure to keep residue separate from handlers.
I've avoided doing it this way, but I'm not sure why.
It *is* annoying to separate them!
```js
    const core = {handlers: {}, residue:{a:1, b:2}};
```
_________________________________________________________
## Assertion handler
Before moving on its useful to define an "assertion handler":
```js
  import {assertEquals, assertThrows} from "/core.js";
  import {combine, stree, logHandler} from "/combine2.js";

  const assertHandler = {
    name: 'assert',
    install: function(){return {handlers: {assert: this}}},
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
  const as = assertHandler.call;

  //1. The long-winded way to use the assert handler:
  assertThrows(() => {
    combine(
      {a:1, handlers: {assert: assertHandler}},
      {a:2, handler: 'assert'},
    );
  });
  combine(
    {a:1, handlers: {assert: assertHandler}},
    {a:1, handler: 'assert'},
  );

  // 2. the less brittle, shorter way to call the assert handler:
  assertThrows(() => combine(assertHandler.install(), {a:1}, as({a:2})));
  combine(assertHandler.install(), {a:1}, as({a:1}));

  // 3. A nice call and response pattern using the shorter form:
  combine(assertHandler.install(),
    {a:1},     as({a:1}),
    {c:'foo'}, as({c:'foo'}),
  );
```
The object structure is primary - the rest of it is just window dressing.
(It might also be nice to experiment defining handlers not as plain objects that contain a function,
but as a function object that can both be invoked and have properties added to it.)

Here is a somewhat redundant example that I may remove in the future (although it does demonstrate using core values in the handler result):
```js
  const as = assertHandler.call;
  const dbl = {
    call: () => ({handler: 'dbl'}),
    install: function(){ return {handlers: {dbl: this}, a: 0, b:0 } },
    handle: (core, msg) => [{a: core.a}, {b: core.b}],
  }

  const ops = [
    assertHandler.install(), dbl.install(),
    {a:10, b:20}, as({a:10, b:20}),
    dbl.call(), as({a:20,b:40}),
    dbl.call(), as({a:40,b:80}),
    ...etc
  ];
  combine(ops);
```
_________________________________________________________
## Handlers replace each other
Handlers replace, so we can overwrite the old handler and call it with the same message:
```js
  const as = assertHandler.call;
  const inc1 = {handle: ()=>[{a:1},{b:2}] };
  const inc2 = {handle: ()=>[{a:-1},{b:-2}] }
  const msg = {handler: 'inc'}

  const ops = [
    assertHandler.install(), {handlers: {inc: inc1}},
    {a:10, b:20}, as({a:10, b:20}),
    msg,          as({a:11, b:22}), // The message increased residue
    {handlers: {inc: inc2}},             // Replace inc1 with inc2 answering to the 'inc' msg
    msg,          as({a:10, b:20}), // The message decreased residue
    msg,          as({a:9, b:18}),
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
  const as = assertHandler.call;
  const h1 = {
    handle: ()=> [{handler: 'h2'},{a:1}],
    call:   ()=> ({handler: 'h1'}),
  };
  const h2 = {
    handle: ()=> [{b:1}],
    call:   ()=> ({handler: 'h2'}),
  };

  const ops = [
    {handlers: {h1, h2, assert: assertHandler}},
    {a:0, b:0}, as({a:0, b:0}),
    h1.call(),  as({a:1, b:1}), // The only way that b increments is if h2 is called; hence h2 been called indirectly.
    h1.call(),  as({a:2, b:2}),
    ...etc
  ];
  combine(ops);
```
I anticipate that modify a handler during the core's lifetime is quite rare, and in fact we design carefully around such a case.
In particular, make cores lifetime shorter, so we don't have to worry about it.
Some cores must have a long life though, like that which defines our relationships.
It makes sense to make that more freeform.

However, I think it will be very common that users will have different versions of a core, meaning different versions of the same handler.
And they will have active instances of these versions active simultaneously.
This effect is very difficult to achieve with class OOP techniques, but comes naturally here.


_________________________________________________________
# Definition of "Core"
A core is an object with a property named 'handlers', of type object, with each key a short descriptive name and each value a handler.
A handler is an object with a property named 'handle' of type function, that takes two args, computes the modifications required, and returns those modifications, without applying them, as an array of objects.
The returned objects are `combine`d recursively, forming a *message cascade*
The intuition is of something like splashing in the water, with the water itself splashing up, and splashing again, until it the water is still again.

## What we have
At this point we have a data structure that
   1. can reach an arbitrary JavaScript object shape
   1. We can select how we get there, going either one value at a time or several, grouped in objects.
   1. We can mutate by adding regular objects.
   1. We can compute which data objects to add by reifying function invocation with handlers.

These features of `combine()`, along with reusable handlers like assert and log, plus authoring guidelines,  make it a very potent data modeling tool.

## *What we need*.
   1. We need a way not just to zero but to remove items in combine.
   1. Perhaps a special object, or some other convention.
   1. Perhaps adapt the method of combine1 (although we lose our zeroes)
   1. I also don't like the array merge (should be concat).
   1. I also don't like number sum by default. It should be configurable.

Some good examples of cores:
   1. Reify objects, one value/key per row/core, with assign combine.
   1. Tic tac toe game.
   1. Chess game core to handle things like [png chess notation](http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8.2)

_________________________________________________________
# Next: stree

Modeling program state as a monotonically increasing list of input, all of which are objects, gives us a great benefit:
We can imagine branching our program state in a very natural way.
This method of branching turns out to be both simpler and more expressive than either inheritance relationships or instantiation.
This will be dealt with in the `stree` section.

Continue with [stree2](./stree2.md).

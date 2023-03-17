<!DOCTYPE html>
<title>Welcome to Markdown!</title>
<link rel="stylesheet" href="/style.css">
<link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
<rect width='1' height='1' fill='DodgerBlue' />
</svg>"/>
<link rel="stylesheet" href="/kata/highlight.github-dark.css">

<script type="module">
import hljs from '/kata/highlight.min.js';
import javascript from '/kata/highlight.javascript.min.js';
hljs.registerLanguage('javascript', javascript);
document.addEventListener('DOMContentLoaded', (event) => {
  document.querySelectorAll('pre code').forEach((elt) => {
    hljs.highlightElement(elt);
  });
});
</script>

See [test harness](./combine2.html)

# Combine Basics

`combine(a, b)` combines two object arguments `b` with `a` and returns the result.
You use it in a webpage like this:
```html
<script type="module">
  import {assertEquals, combine} from '/simpatico.js';
  assertEquals(3, combine(1, 2));
</script>
```
To use it in node, you'd just omit the script tags (and set 'type=module' in `package.json`).
You can also omit the import statement (it's set in reflector).
```js
  assertEquals(3, combine(1, 2));
```
Note that this code is *live* in the sense that the markdown processor generates a script tag in addition to pre/code tags.
This script is executed on page load, and in this case you'd see an error in the console if the assert fails.
Code that starts with a "less than" (<) symbol is *not* executed.

Combine's action varies according to the types of its arguments.
Here there is an object type, and combine behaves just like `Object.assign`. In this case, they both merge keys:

```js
assertEquals({a:1, b:2}, combine({a:1},{b:2}));
assertEquals({a:1, b:2}, Object.assign({},{a:1},{b:2}));
```

 `Object.assign` is shallow, `combine()` is deep:
```js
assertEquals({a: {b : 2}},          combine({a: {b : 1}}, {a: {b : 1}}));
assertEquals({a: {b : 1}}, Object.assign({},{a: {b : 1}}, {a: {b : 1}}));
```

## Handlers

`combine()` supports *handlers*, which provides structured function invocation:

```js
// the handle function is just an ordinary pure function
const inc = {handle: ()=>[{a:1},{b:2}] };
assertEquals([{a:1},{b:2}], inc.handle());

// the core is the handlers plus some state, called residue
// in this case the residue is initialized to {a:10, b:20}
const core= {handlers: {inc}, a:10, b:20};

// call the handler with a message
const msg = {handler: 'inc'};

// check the effect on residue
assertEquals({handlers: {inc}, a:11, b:22}, combine(core, msg));
```

The handler above is very simple: it takes no arguments and gives a constant result.
It's a dual counter, where `a` is incremented by 1, and `b` by 2.
We initialize both `a` and `b` to show there is interaction between the result of `inc` and current core state.

Handlers take two arguments, the target and the message, in the first and second position respectively:
```js
const inc = {
  handle: (res, msg) => [{a: res.a},{b: res.b}],
  msg: {handler: 'inc'}
};
let core = {handlers: {inc}, a:10, b:20};
assertEquals({handlers: {inc}, a:20, b:40}, combine(core, inc.msg));
```
`res` stands for "residue".
Also note that we've tucked in the example call into the handler definition.
The handler object is a great place to store static resources your function needs and that a caller may need to access.

### Assertion handler
Before moving on its useful to define an "assertion handler":
```js
const assertionHandler = {
  handle: (core, msg) => {
    Object.entries(msg).forEach(([key, msgValue]) => {
      if (key === 'handler' || key === 'parent') return; // skip the handler name itself
      if (core.hasOwnProperty(key)) assertEquals(msgValue, core[key]);
      else throw 'core is missing asserted property ' + key;
    });
    return [{}];
  },
  as: a => ({handle: 'assert', ...a})
};

// Throws when the assertion is wrong.
let throws = false;
try{combine(
  {a:1, handlers: {assert: assertHandler}},
  {a:2, handler: 'assert'},
);} catch (e) {throws = true;}
assertEquals(true, throws);

//Does not throw when the assertion is right
combine(
  {a:1, handlers: {assert: assertHandler}},
  {a:1, handler: 'assert'},
);
```

With this handler we can add assert messages into the core, and the add will fail if the assert fails.
In this implementation, we can assert the state of the residue:

```js
const as = assertHandler.as;

const inc = {handle: (res, msg) => [{a: res.a}, {b: res.b}]};
const msg = {handler: 'inc'}
let core = {handlers: {inc, assert: assertHandler}, a: 10, b: 20};
core = combine(core, {handle: 'assert', a: 10, b: 20});
core = combine(core, msg)
core = combine(core, {handle: 'assert', a: 20, b: 40})
```
We can simplify this code like this:
```js
const inc = {handle: (res, msg) => [{a: res.a},{b: res.b}], msg: {handler: 'inc'}};
const as = a => ({handle: 'assert', ...a});

const ops = [
  {handlers: {inc}},
  {handlers: {assert: assertHandler}},
  {a:10, b:20},
  as({a:10, b:20}),
  inc.msg,
  as({a:20,b:40}),
];
let core = {};
ops.every(op => core = combine(core, op));
// If we reach here without throwing, everything is good!
```



### Handlers replace each other

Handlers replace, so we can overwrite the old handler and call it with the same message:
```js
const as = assertHandler.as;
const inc1 = {handle: ()=>[{a:1},{b:2}] };
const inc2 = {handle: ()=>[{a:-1},{b:-2}] }
const msg = {handler: 'inc'}

let core = {handlers: {inc: inc1}, a:10, b:20};
const ops = [
  as({a:10, b:20}),
  msg,
  as({a:11, b:22}),
  {handlers: {inc: inc2}},
  as({a:11, b:22}),
  msg,
  as({a:10, b:20}),
];
ops.every(op => core = combine(core, op));
```
This feature is key to enabling *type versioning*.

### Handlers call each other

Functions replace, so we can overwrite the old handler and call it with the same message:
```js
const as = assertHandler.as;
const h1 = {handle: ()=>[{handler:'h2'},{a:1}], msg: {handler: 'h1'} };
const h2 = {handle: ()=>[{b:1}], msg: {handler: 'h2'} };

let core = {handlers:{h1,h2}, a:0, b:0};

const ops = [
  as({a:0, b:0}),
  h1.msg,
  as({a:1, b:2}),
];

ops.every(op => core = combine(core, op));
```
I anticipate that this will be a very unusual use case, to modify a handler during the core's lifetime.
However, I think it will be very common that users will have different versions of a core, meaning different versions of the same handler.
And they will have active instances of these versions active simultaneously.
This effect is very difficult to achieve with class OOP techniques, but comes naturally here.

### Definition of "Core"
A core is an object with a property named 'handlers', of type object, with each key a short descriptive name and each value a handler.
A handler is an object with a property named 'handle' of type function, that takes two args, computes the modifications required, and returns those modifications, without applying them, as an array of objects.
The returned objects are `combine`d recursively, forming a *message cascade*
The intuition is of something like splashing in the water, with the water itself splashing up, and splashing again, until it the water is still again.

## What we have
At this point we have a data structure that
1. can reach an effectively arbitrary JavaScript object shape.
1. We can select how we get there, going either one value at a time or several, grouped in objects.
1. We can add data objects directly by adding regular objects.
1. We can add data objects indirectly with handler invocation by adding handler targeted objects.

These features of `combine()` alone make it a very potent data modeling tool.

Modeling program state as a monotonically increasing list of input, all of which are objects, gives us a great benefit:
We can imagine branching our program state in a very natural way.
This method of branching turns out to be both simpler and more expressive than either inheritance relationships or instantiation.
This will be dealt with in the `stree` section.

## STree
An application is a list of values then connected together in useful ways by paths.
The paths describe, in general, an stree who's various branches have been usefully combined into a cohesive interface.
The degrees of freedom of this core can be said to be all of the arrays above.
The computation that occurs is with the exploration of various paths through those values.
Those paths are recorded independently as branches in an stree.
It is a kind of generalization of the back button, such that you can move in and out of a nested data structure easily and smoothly, over time.

The implementation in ES6 javascript focusing on object literals and pure functions is

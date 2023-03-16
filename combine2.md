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

```js
assertEquals(3, combine(1, 2));
```

Combine's action varies according to the types of its arguments.
Here there is an object type, and combine behaves just like `Object.assign`:

```js
assertEquals({a:1, b:2},          combine({a:1},{b:2}));
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
assertEquals([{a:11},{b:22}], combine(core, msg));
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
assertEquals([{a:20},{b:40}], combine(core, inc.msg));
```
`res` stands for "residue".
Also note that we've tucked in the example call into the handler definition.
The handler object is a great place to store static resources your function needs and that a caller may need to access.

### Assertion handler
Before moving on its useful to define an "assertion handler":
```js
const assertHandler = { handle: (core, msg) => {
    Object.entries(msg).forEach(([key, msgValue]) => {
      if (key === 'handler' || key === 'parent') return; // skip the handler name itself
      if (core.hasOwnProperty(key)) assertEquals(msgValue, core[key]);
      else throw 'core is missing asserted property ' + key;
    });
    return [{}];
  },
  msg: {handler: 'assert', a: 1}
};
```
With this handler we can add assert messages into the core, and the add will fail if the assert fails.
In this implementation, we can assert the state of the residue:

```js
const inc = {handle: (res, msg) => [{a: res.a},{b: res.b}]};
const msg = {handler: 'inc'}
let core = {handlers: {inc, assert: assertHandler}, a:10, b:20};
core = combine(core, {handle: 'assert', a:10, b:20});
core = combine(core, msg)
core = combine(core, {handle: 'assert', a:20, b:40})
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
ops.every(op => core = combine(core, op));
// If we get to this point, everything is good!
```


### Handlers replace each other

Handlers replace, so we can overwrite the old handler and call it with the same message:
```js
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
This feature is key to enabling *type versioning* later.




A core is an object with a property named 'handlers', of type object, with each key a short descriptive name and each value a handler.
A handler is an object with a property named 'handle' of type function, that takes two args, computes the modifications required, and returns those modifications, without applying them, as an array of objects.
The returned objects are `combine`d recursively, forming a *message cascade*
The intuition is of something like splashing in the water, with the water itself splashing up, and splashing again, until it the water is still again.


## STree
An application is a list of values then connected together in useful ways by paths.
The paths describe, in general, an stree who's various branches have been usefully combined into a cohesive interface.
The degrees of freedom of this core can be said to be all of the arrays above.
The computation that occurs is with the exploration of various paths through those values.
Those paths are recorded independently as branches in an stree.
It is a kind of generalization of the back button, such that you can move in and out of a nested data structure easily and smoothly, over time.

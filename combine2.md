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
document.addEventListener('DOMContentLoaded', e => {
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

## *What we need*.
   1. We need a way not just to zero but to remove items in combine.
   1. Perhaps a special object, or some other convention.
   1. Perhaps adapt the method of combine1 (although we lose our zeroes)
   1. I also don't like the array merge (should be concat).
   1. I also don't like number sum by default. It should be configurable.

## STree
The `stree` (s is for "summary" or "simpatico") is an n-arry tree that associates a reduction with every node.
The reduction is over the list of nodes in order from root, which you can find easily from any node by walking up the parent.
The major interface is a (growing) list of branches, represented simply by the nodes with no children.

And I do have an implementation written precisely in that way, but I'll be using another implementation.
This one anticipates long runs of input targeted at a single row, so instead of wrapping each input in a new object, simply puts the input in the array.
It also corresponds to the visualization.

Interestingly, the basics of this data-structure has little to do with combine.
I feel that combine's utility (which I think is high) is multiplied by the stree.
In part that's because it harnesses one of the computers great superpowers, the ability to perfectly copy complex structure effortlessly.
If you have a simple, general, usefully constrained way to represent program state, it makes sense to apply an stree to that in particular.

```js
function testTreeInternals() {
  // Lets experiment with adding integers to the operations list, forming a trie
  const o = {};
  const a1={a:1},a2={a:2},a3={a:3},a4={a:4},a5={a:5},a6={a:6};
  const ops2 = [
    o, a1, a2,
    0, a3, a4,
    2, a5,
    -1, a6
  ];
  let s = stree(ops2);
  // Let's pull out some stuff and look at it - none of this has to do with combine()
  const {nodes, rows, branches, branchTips} = s;
  assertEquals([o, a1, a2, a3, a4, a5, a6], nodes);
  assertEquals([
    [o, a1, a2],
    [0, a3, a4, a6],
    [2, a5]
  ], rows);
  assertEquals([
    [o, a1, a2],
    [o, a3, a4, a6],
    [o, a1, a2, a5]
  ], branches());

}
testTreeInternals()
```
Test assertions in the tree.
```js
function testTreeAssertions() {
  let DEBUG = true;
  const log = {
    handle: (...args) => {
      if (DEBUG) console.log(args);
      return [{}];
    }
  };
  const inc = {handle: ()            => [{a: 1}, {b: 2}]};
  const sum = {handle: (_, {a, b})   => [{a: a + b}]};
  const mul = {handle: ({a}, {a: b}) => [{a: null}, {a: a * b}]};

  // 3: Same as ops but with more interspersed integers
  const ops3 = [
    {handler: 'log'},
    {handler: 'inc'},
    {handler: 'assert', a: 1, b: 2},
    {handler: 'inc'},
    {handler: 'assert', a: 2, b: 4},
    2,
    {a: null},
    {handler: 'assert', a: 0},
    {handler: 'sum', a: 1, b: 2},
    {handler: 'assert', a: 3},
    {a: null},
    {a: 3},
    {a: 2},
    {handler: 'assert', a: 5},
    {handler: 'mul', a: 10},
    {handler: 'assert', a: 50},
    {handler: 'log'},
  ];
  const {branches: branches3, allBranchesReachable, residues, summary} = stree(ops3);
  allBranchesReachable({handlers: {log, inc, sum, mul, assert: assertHandler}});
  if (DEBUG) console.log('branches3()', branches3(), 'residues', residues, 'summary', summary);
}
testTreeAssertions();
```

## Simpatico OOP
Building out an example of classic OOP types and instantiation with Simpatico.
Rows are simply designated a type with a label.
We introduce some conventions that constrain the structure of the tree.
The first rows are types, consisting only of handlers.
The latter rows are instances, consisting only of messages.

```js
function testTreeHandlers() {
  const h1 = {handle: (b, a) => [{a: null}, {a: a * 1}], msg: {handler: 'h1', a: 2}};
  const h2 = {handle: (b, a) => [{a: null}, {a: a * 2}], msg: {handler: 'h2', a: 2}};
  const h3 = {handle: (b, a) => [{a: null}, {a: a * 3}], msg: {handler: 'h3', a: 2}};
  const h4 = {handle: (b, a) => [{a: null}, {a: a * 4}], msg: {handler: 'h4', a: 2}};

  // helper functions to build the ops (and a few tests to exercise/explain the intended use as authoring tools
  const h = a => [0, h1, h2, h3, h4][a].msg;
  const a = a => ({a});
  const b = b => ({b});
  const as = a => ({handler: 'assert', ...a});
  assertEquals({handler: 'h1', a: 2}, h(1));
  assertEquals({handler: 'h3', a: 2}, h(3));
  assertEquals({handler: 'h4', a: 2}, h(4));
  assertEquals({a: 2}, a(2));
  assertEquals({handler: 'assert', a: 7}, as({a: 7}));

  // In this case we're building up a simple type tree and instantiating some of the types (and asserting things)
  const ops = [
    {handlers: {assert: assertHandler}},
    0, {type: 'foo'}, {handlers: {h1, h2}}, // 2
    0, {type: 'bar'}, {handlers: {h3}}, {handlers: {h4}}, // 5; note the split handlers
    0, {type: 'baz'}, {handlers: {h3, h4}}, // 7
    2, a(1), as({a: 1}), a(2), as({type: 'foo', a: 3}), a(5), as({a: 8}),
    5, a(3), as({type: 'bar', a: 3}), // h(3).msg, as({a:9}),
    7, a(4), as({type: 'baz', a: 4}),
  ];
  const {add, neu, residues, summary, nodes, allBranchesReachable} = stree(ops);
  allBranchesReachable({});
  console.log('residues', residues, 'nodes', nodes, 'summary', summary);
}
testTreeHandlers();
```

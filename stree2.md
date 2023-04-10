<!-- <!DOCTYPE html>
<head>
  <title>Simpatico: stree2()</title>
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
</head>-->
_________________________________________________________
# Simpatico: stree2()
jbr 2023

See:
[home](/),
[combine2](./combine2.md),
[stree](./stree),
[litmd](/lit.md),
[audience](/audience.md)

# Simpatico: stree()
The `stree` (s is for "summary" or "simpatico") allows you to express
many related sequences with ease.
If we associate each branch with a row then all we need is a way to make new rows.
And once we have our rows, we need a way to select old ones.
The convention I have selected is to reserve number typed input to do both tasks.

  1. Negative integers select rows. Subsequent input is added here.
  1. Positive integers select nodes. A new row is formed, parented to the node.

```js
// import {assertEquals} from "/core.js";
// import {stree} from '/stree2.js';

const ops = [
    'he',
  0, 'y',
  0, 're',
  2, 'tic',
  0, 'rmit',
];

const concat = (a, b) => a + b;
const push = (arr, elt) => [...arr, elt];

let s = stree(ops, concat, '' , push, []);
const expected = ['he', 'hey', 'here', 'heretic', 'hermit'];
assertEquals(expected, s.residues);

// compute the same answer a different way
const strings = s.branches().map(arr => arr.slice(0).reduce(concat,''));
assertEquals(expected, strings);

```

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
  // we only care about structure, not reductions, so set a noop
  function noop (){};
  const {nodes, rows, branches}  = stree(ops2, noop, '', noop, '');

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
testTreeInternals();
```

__________________________________________________
## STree and Combine

Let's  make sure that combine works within the stree, using some simple, synthetic handlers.

```js
const incHandler = {handle: () => [{a: 1}], call:()=>({handler: 'inc'})};
const decHandler = {handle: () => [{a: -1}], call:()=>({handler: 'dec'})};
const mulHandler = {handle: (core, msg) => [{a : null},{a: msg.factor * core.a}], call: a => ({handler: 'mul', factor: a})};

// These are convenience methods for authoring; we're still just adding objects together.
const as = assertHandler.call, log = logHandler.call;
const inc = incHandler.call, dec = decHandler.call, mul = mulHandler.call;
const ops = [
  assertHandler.install(),
  logHandler.install(), as({debug: true, lastOutput: ''}),
  {handlers:{inc: incHandler, dec: decHandler, mul: mulHandler}},
  {a: 10},as({a: 10}),
  inc(),  as({a: 11}),
  dec(),  as({a: 10}),
  dec(),  as({a: 9}),
  mul(5), as({a: 45}),
  log('okay, lets backtack and start from an earlier node.'),
  5,      as({a: 10}),
  mul(2), as({a: 20}),
  inc(),  as({a: 21}),
  log('now lets backtrack to node 10 and '),
  10,     as({a: 9}),
  mul(20),as({a: 180}),
]
window.s = stree(ops);
```

## Canonical ops

At the end of the day all the elements in this array are either objects or integers.
This example is equivalent to the previous one, but now we show the JSON representation of the ops.
```js
import {stringifyFunctions} from '/core.js';
const ops = [...etc];
const ops2 = stringifyFunctions(ops, "[long function string]");
```
ops2 looks like this:
```json
[
    {
        "handlers": {
            "assert": {
                "name": "assert",
                "install": "function(){return {handlers: {assert: this}}}",
                "call": "a => ({handler: 'assert', ...a})",
                "handle": "[long function string]"
            }
        }
    },
    {
        "handlers": {
            "log": {
                "name": "log",
                "install": "[long function string]",
                "call": "[long function string]",
                "handle": "[long function string]"
            }
        },
        "debug": true,
        "lastOutput": ""
    },
    {
        "handler": "assert",
        "debug": true,
        "lastOutput": ""
    },
    {
        "handlers": {
            "inc": {
                "handle": "() => [{a: 1}]",
                "call": "()=>({handler: 'inc'})"
            },
            "dec": {
                "handle": "() => [{a: -1}]",
                "call": "()=>({handler: 'dec'})"
            },
            "mul": {
                "handle": "(core, msg) => [{a : null},{a: msg.factor * core.a}]",
                "call": "a => ({handler: 'mul', factor: a})"
            }
        }
    },
    {
        "a": 10
    },
    {
        "handler": "assert",
        "a": 10
    },
    {
        "handler": "inc"
    },
    {
        "handler": "assert",
        "a": 11
    },
    {
        "handler": "dec"
    },
    {
        "handler": "assert",
        "a": 10
    },
    {
        "handler": "dec"
    },
    {
        "handler": "assert",
        "a": 9
    },
    {
        "handler": "mul",
        "factor": 5
    },
    {
        "handler": "assert",
        "a": 45
    },
    {
        "handler": "log",
        "msg": "okay, lets backtack and start from an earlier node."
    },
    5,
    {
        "handler": "assert",
        "a": 10
    },
    {
        "handler": "mul",
        "factor": 2
    },
    {
        "handler": "assert",
        "a": 20
    },
    {
        "handler": "inc"
    },
    {
        "handler": "assert",
        "a": 21
    },
    {
        "handler": "log",
        "msg": "now lets backtrack to node 10 and "
    },
    10,
    {
        "handler": "assert",
        "a": 9
    },
    {
        "handler": "mul",
        "factor": 20
    },
    {
        "handler": "assert",
        "a": 180
    }
]
```

# Simpatico OOP
Building out an example of classic OOP types and instantiation with Simpatico.
Rows are simply designated a type with a label.
We introduce some conventions that constrain the structure of the tree.
The first rows are types, consisting only of handlers.
The latter rows are instances, consisting only of messages.

```js
/// Do not execute this code yet
function testTreeHandlers() {
  const h1 = {handle: ({a}, {a: b}) => [ {a: b * b}], msg: {handler: 'h1', a: 2}};
  // const h2 = {handle: (b, a) => [{a: null}, {a: a * 2}], msg: {handler: 'h2', a: 2}};
  // const h3 = {handle: (b, a) => [{a: null}, {a: a * 3}], msg: {handler: 'h3', a: 2}};
  // const h4 = {handle: (b, a) => [{a: null}, {a: a * 4}], msg: {handler: 'h4', a: 2}};

  // helper functions to build the ops (and a few tests to exercise/explain the intended use as authoring tools
  // const h = a => [0, h1, h2, h3, h4][a].msg;
  const c = c => ({c});
  // const b = b => ({b});
  const as = a => ({handler: 'assert', ...a});
  // assertEquals({handler: 'h1', a: 2}, h(1));
  // assertEquals({handler: 'h3', a: 2}, h(3));
  // assertEquals({handler: 'h4', a: 2}, h(4));
  // assertEquals({a: 2}, a(2));
  // assertEquals({handler: 'assert', a: 7}, as({a: 7}));

  // In this case we're building up a simple type tree and instantiating some of the types (and asserting things)
  // const ops = [
  //   {handlers: {assert: assertHandler}},
  //   0, {type: 'foo'}, {handlers: {h1, h2}}, // 2
  //   0, {type: 'bar'}, {handlers: {h3}}, {handlers: {h4}}, // 5; note the split handlers
  //   0, {type: 'baz'}, {handlers: {h3, h4}}, // 7
  //   2, a(1), as({a: 1}), a(2), as({type: 'foo', a: 3}), a(5), as({a: 8}),
  //   5, a(3), as({type: 'bar', a: 3}), // h(3).msg, as({a:9}),
  //   7, a(4), as({type: 'baz', a: 4}),
  // ];

  const ops = [
    {handlers: h1}, h1.msg,
  ];
  const {add, neu, residues, summary, nodes, allBranchesReachable} = stree(ops);
  allBranchesReachable({});
  console.log('residues', residues, 'nodes', nodes, 'summary', summary);
}
testTreeHandlers();
```

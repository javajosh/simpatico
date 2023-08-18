<!-- <!DOCTYPE html>
<head>
  <title>Simpaticode: stree()</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='white' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">
  <link class="hljs" rel="stylesheet" href="/kata/highlight.github-dark.css">
  <script class="testable" src="testable.js" type="module"></script>
  <script class="hljs" type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    const d=document;
    hljs.registerLanguage('javascript', javascript);
    d.addEventListener('DOMContentLoaded', () =>
      d.querySelectorAll('pre code').forEach(block =>
        hljs.highlightElement(block)));
      // open all the details, too.
      d.querySelectorAll('details').forEach(d => d.open = true);
  </script>
</head>-->
_________________________________________________________
# Simpaticode: stree()
jbr 2023

See:
[home](/),
[combine2](./combine2.md),
[litmd](/lit.md),
[audience](/audience.md)

The `stree` (s is for "summary" or "simpatico") allows you to express
many related sequences with ease.
If we associate each branch with a row then all we need is a way to make new rows.
And once we have our rows, we need a way to select old ones.
The convention I have selected is to reserve number typed input to do both tasks.

  1. Negative integers select rows. Subsequent input is added here.
  1. Positive integers select nodes. A new row is formed, parented to the numbered node.

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

While I do have an implementation written precisely in that way, but I'll be using another implementation.
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
const has = assertHandler.call, log = logHandler.call;
const inc = incHandler.call, dec = decHandler.call, mul = mulHandler.call;
const ops = [
  assertHandler.install(),
  logHandler.install(), has({debug: true, lastOutput: ''}),
  {handlers:{inc: incHandler, dec: decHandler, mul: mulHandler}},
  {a: 10},has({a: 10}),
  inc(),  has({a: 11}),
  dec(),  has({a: 10}),
  dec(),  has({a: 9}),
  mul(5), has({a: 45}),
  log('okay, lets backtack and start from an earlier node.'),
  5,      has({a: 10}),
  mul(2), has({a: 20}),
  inc(),  has({a: 21}),
  log('now lets backtrack to node 10 and '),
  10,     has({a: 9}),
  mul(20),has({a: 180}),
]
window.s = stree(ops);
```

## Canonical ops

At the end of the day all the elements in this array are either objects or integers.
This example is equivalent to the previous one, but now we show the JSON representation of the ops.
```js
import {stringifyWithFunctions} from '/core.js';
const ops = [...etc];
const ops2 = stringifyWithFunctions(ops, "[long function string]");
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

__________________________________________________
# Simpatico OOP
Building out an example of classic OOP types and instantiation with Simpatico.
Rows are simply designated a type with a label.
We introduce some conventions that constrain the structure of the tree.
The first rows are types, consisting only of handlers.
The latter rows are instances, consisting only of messages.

```js
const DEBUG = false;

const h1 = {handle: (core, msg) => [{a:1}], call: {handler: 'h1'}};
const h2 = {handle: (core, msg) => [{a:2}], call: {handler: 'h2'}};
const [a, b] = [h1.call, h2.call];

const has = assertHandler.call, log = logHandler.call;
const ops = [
  assertHandler.install(),
  logHandler.install(),
  {handlers: {h1, h2}, debug: DEBUG},
  {a:0}, log('this is node 4'), has({a:0}), a, b,                  has({a:3}),
  3 , log('row 1 parent 3'),    has({a:0}), b, b,                  has({a:4}),
  3 , log('row 2 parent 3'),    has({a:0}), b, b, a, b, b, a, a,   has({a:11}),
  11, log('row 3 parent 11'),   has({a:2}), a, a,                  has({a:4}),
];
const s = stree(ops);

// We can keep adding to the stree
const moreOps = [{debug: true}, a, a, b, b, log('hello from moreOps, still row 3')];
s.addAll(moreOps);
s.add({a: null});
s.add(has({a:0}));
assertEquals(3, s.currRowIndex);

window.s = s;

```

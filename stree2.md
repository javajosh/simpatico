<!-- <!DOCTYPE html>
<head>
  <title>Simpatico: stree()</title>
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
# Simpatico: stree()
2023

See:
[home](/),
[combine2](./combine2.md),
[stree](./stree),
[markdown](/kata/literate-markdown.md),
[audience](/audience.md)

  - See [home](/index.html)
  - See [combine2](./combine2.md)

# Simpatico: stree()
The `stree` (s is for "summary" or "simpatico") allows you to express
many related sequences with ease.
If we associate each branch with a row then all we need is a way to make new rows.
And once we have our rows, we need a way to select old ones.
The convention I have selected is to reserve number typed input to do both tasks.

  1. Negative integers select rows. Subsequent input is added here.
  1. Positive integers select nodes. A new row is formed, parented to the node.

```js
const ops = [
    'he',
  0, 'y',
  0, 're',
  2, 'tic',
  0, 'rmit',
];
const noop = ()=>{};
const concat = (a, b) => a + b;
const push = (arr, elt) => {arr.push(elt); return arr};

let s = stree(ops, concat, '' , push, []);
// const strings = s.branches().map(arr => arr.slice(0).reduce(concat,'')); //this already works
console.log(s.residues, s.branches())
assertEquals(['he', 'hey', 'here', 'heretic', 'hermit'], s.summary);

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
// Do not execute this code yet
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
  const {nodes, rows, branches} = s;
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
Note: the following code has been intentionally disabled for now.
Test assertions in the tree.
```js
// Do not execute this code yet
function testTreeAssertions() {
  let DEBUG = true;
  const log = logHandler;
  const inc = {handle: ()            => [{a: 1}, {b: 2}]};
  const sum = {handle: (_, {a, b})   => [{a: a + b}]};
  const mul = {handle: ({a}, {a: b}) => [{a: null}, {a: a * b}]};

  // 3: Same as ops but with more interspersed integers
  const ops3 = [
    // {handlers: {log, inc, sum, mul, assert: assertHandler}},
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

# Simpatico OOP
Building out an example of classic OOP types and instantiation with Simpatico.
Rows are simply designated a type with a label.
We introduce some conventions that constrain the structure of the tree.
The first rows are types, consisting only of handlers.
The latter rows are instances, consisting only of messages.

```js
// Do not execute this code yet
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

<!--<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="Simpatico, stree, es6">
  <meta name="author" content="Josh Rehman">
  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='white' />
  </svg>"/>
  <script src="/testable.js" type="module"></script>
  <title>Simpatico - stree3</title>
  <link rel="stylesheet" type="text/css" href="style.css">
  <link rel="stylesheet" href="/kata/highlight.github-dark.css">
  <script type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    hljs.registerLanguage('javascript', javascript);
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
      });
    });
  </script>
</head>-->

_____________________________________
# Simpatico/Summary Tree: STree3
*javajosh 2023*

See [home](/), [combine](/combine),  [stree](/stree.md), [stree2](/stree2.md)

# Step 1: An N-arry tree with reduce
Start with a simple n-arry tree.
Primary OPERATION is `add(value, parent)`.
Then define OPERATION `residue(node, reducer)`.
Hardcoded attributes are 'value' and 'parent'.
Root is defined by the node that does not have parent defined.
For the tests, we use explicit "static" variables to refer to nodes, use integer values, and an explicit reducer that is "sum":

```js
// simply wrap the values in a new object
function add(value, parent){
    return {value, parent};
}

// walk up to parent, reverse, map and reduce over values.
function residue(node, reduce){
  let nodes = [node];
  while (node.hasOwnProperty('parent')) {
    nodes.push(node.parent);
    node = node.parent;
  }
  return nodes.map(node => node.value).reduceRight(reduce);
}

//tests over integers
const sum = (a,b)=>a+b;
const root = {value: 0};
const node1 = add(1, root);
const node2 = add(2, node1);
const node3 = add(3, node2);
assertEquals(6, residue(node3, sum));

// define a sibling to node2 above
const node2a = add(4, node1);
assertEquals(5, residue(node2a, sum));
```
# Step 2: Add branches

Now lets add support for OPERATION `branches()`.
This operation is stateful and cannot be done functionally without adding `children`.
However, we can modify `add()` to be stateful and maintain `branches`.
In `add()` if `branches` contains `parent`, then we replace `parent` with `node`.
Otherwise we add `node` to `branches`.
To keep this state local, we wrap the operations in another function, called `stree3`:

```js
function stree3(root, reducer) {
  // initialize branches array containing only root
  const branches = [root];
  let lastNode = root;

  function add(value, parent=lastNode) {
    const node = {value, parent};
    // update branches array
    const parentIndex = branches.indexOf(parent);
    if (parentIndex === -1){
        branches.push(node);
    } else {
        branches[parentIndex] = node;
    }
    lastNode = node;
    return node;
  }

  // unchanged from above definition
  function residue(node=lastNode, reduce=reducer) {
    let nodes = [node];
    while (node.hasOwnProperty('parent')) {
      nodes.push(node.parent);
      node = node.parent;
    }
    return nodes.map(node => node.value).reduceRight(reduce);
  }
  // needed to expose operations
  return {add, residue, branches};
}

// tests with branches
// define our test reducer
const sum = (a,b)=>a+b;
// define our test root
const root = {value: 0};
// create a new stree
const tree = stree3(root, sum);
// keep a reference to only this node to use as a parent later
const node1 = tree.add(1);
tree.add(2);
tree.add(3);
assertEquals(6, tree.residue());
assertEquals(1, tree.branches.length);

// create a second child to node1
tree.add(4, node1);
assertEquals(5, tree.residue());
assertEquals(2, tree.branches.length);

// reduce over branches
assertEquals(7, tree.branches.map(node=>node.value).reduce(sum));
```

# Step 3: make it work with combineReducer
At this point we have something we can use with `combineReducer()` as the reducer.
(Concern exposing `branches` directly and forcing the user to reduce manually.)
(Concern that we need `combineReducer()` rather than just `combine()`)
```js
function stree3(value, reducer = combineReducer) {
  const root = {value};
  const branches = [root];
  let lastNode = root;

  function add(value, parent=lastNode) {
    const node = {value, parent};
    // if parent in branches, replace it. otherwise add the node as a new branch
    const parentIndex = branches.indexOf(parent);
    if (parentIndex === -1){
        branches.push(node);
    } else {
        branches[parentIndex] = node;
    }
    // update lastNode and return it.
    lastNode = node;
    return node;
  }

  // Return a node path from root to the specified node
  function nodes(node=lastNode) {
    let nodes = [node];
    while (node.hasOwnProperty('parent')) {
      nodes.push(node.parent);
      node = node.parent;
    }
    return nodes.reverse();
  }
  // Return the reduction of all nodes from root to specified node
  function residue(node = lastNode){
      return nodes(node).map(n => n.value).reduce(reducer, value);
  }

  // needed to expose operations
  return {add, nodes, residue, branches, root};
}

// create a new stree
const tree = stree3({a:0});
assertEquals({value:{a:0}},tree.root);

// keep a reference to this node to use as a parent later
const node1 = tree.add({a:1});
tree.add({a:2});
tree.add({a:3});
// assert 1 + 2 + 3 = 6 and only 1 branch
assertEquals({a:6}, tree.residue());
assertEquals(1, tree.branches.length);

// create a second child to node1
tree.add({a:4}, node1);
// assert 1 + 4 = 5 and 2 branches
assertEquals({a:5}, tree.residue());
assertEquals(2, tree.branches.length);

// assert that the prior residue is still reachable
assertEquals({a:6}, tree.residue(tree.branches[0]));

// reduce over branches
assertEquals({a:7}, tree.branches.map(node=>node.value).reduce(combineReducer));
```

# Step 4: Serialization
Make stree a reducer over an array of ordered pairs, `(value, parent)`.
We add OPERATION `toArray()` and private OPERATION `fromArray()` and modify the constructor to accept arrays.
This requires that the values be serializable and concrete.
In practical terms, only `functions` need support.
This contract prohibits the `value`s themselves from being arrays.
It also prevents them from being strings.

(Concern: parsing functions means evaling code. Must be careful especially with code from elsewhere.)
(Concern: preventing arrays is fine, but strings would all for a nice trie data structure.)

```js
import {stringifyWithFunctions, parseWithFunctions, peek} from "./core.js";

function stree3(value, reducer = combineReducer) {
  if (Array.isArray(value)) {
    return fromArray(value, reducer);
  }
  if (typeof value === 'string'){
      return fromString(value, reducer);
  }

  const root = {value, parent: null};
  const branches = [root];
  const nodes = [root];
  let lastNode = root;

  function add(value, parent = lastNode) {
    const node = {value, parent};
    // if parent in branches, replace it. otherwise add the node as a new branch
    const parentIndex = branches.indexOf(parent);
    if (parentIndex === -1) {
      branches.push(node);
    } else {
      branches[parentIndex] = node;
    }
    // update lastNode and return it.
    lastNode = node;
    nodes.push(node);
    return node;
  }

  // Return a node path from root to the specified node
  function nodePath(node = lastNode) {
    let nodePath = [node];
    // We now define a parent on root, but the value is -1
    while (node.parent) {
      nodePath.push(node.parent);
      node = node.parent;
    }
    return nodePath.reverse();
  }

  // Return the reduction of all nodePath from root to specified node
  function residue(node = lastNode) {
    return nodePath(node).map(n => n.value).reduce(reducer, value);
  }


  function toArray() {
    return nodes.map(n => [n.value, n.parent === null ? -1 : nodes.indexOf(n.parent)]);
  }

  function fromArray(arr, reducer) {
    const result = stree3(arr[0][0], reducer);
    for (var i = 1; i < arr.length; i++) {
      const [value, parentIndex] = arr[i];
      const parent = result.nodes[parentIndex];
      result.add(value, parent);
    }
    return result;
  }

  function toString() {
      return stringifyWithFunctions(toArray());
  }
  function fromString(str, reducer){
      return fromArray(parseWithFunctions(str), reducer);
  }


  // needed to expose operations
  return {add, nodePath, residue, toArray, toString, branches, nodes, root};
}

// as before
const tree = stree3({a: 0});
assertEquals({value: {a: 0}, parent: null}, tree.root);
const node1 = tree.add({a: 1});
tree.add({a: 2});
tree.add({a: 3});
assertEquals({a: 6}, tree.residue());
assertEquals(1, tree.branches.length);
tree.add({a: 4}, node1);
assertEquals({a: 5}, tree.residue());
assertEquals(2, tree.branches.length);
assertEquals({a: 6}, tree.residue(tree.branches[0]));
assertEquals({a: 7}, tree.branches.map(node => node.value).reduce(combineReducer));

// check that the tree is serializing correctly
const expectedArray = [[{a: 0}, -1], [{a: 1}, 0], [{a: 2}, 1], [{a: 3}, 2], [{a: 4}, 1]];
const actualArray = tree.toArray();
assertEquals(expectedArray, actualArray);

// check that we can reconstitute the tree correctly
const tree2 = stree3(actualArray);
assertEquals({a: 5}, tree2.residue());
assertEquals(2, tree2.branches.length);
assertEquals({a: 6}, tree2.residue(tree2.branches[0]));
assertEquals({a: 7}, tree2.branches.map(node => node.value).reduce(combineReducer));

// Test deep function de/serialization
tree2.add({foo: {bar: a=>10}});
assertEquals(10, peek(tree2.nodes).value.foo.bar());
const str = tree2.toString();
assertEquals(true, typeof str === 'string');
const tree3 = stree3(str);
assertEquals(10, peek(tree3.nodes).value.foo.bar());

```
## Step 5: Validation
We want a residue that describes the next valid input for that row.
This is a pattern, that undergoes collapse by the caller.
An input is compared to the pattern and is invalid, in general.
The result should NOT be an addition to the stree, but rather an updated residue describing the problem.

### General data-structure
Build up a general data-structure as above.
This is useful for configuration, visualization, or a wide variety of uses.

### Types and instances (hybrid OOP)
A type is a residue with handlers that hasn't been instantiated with data.
A type can have handlers added or modified, or it can be instanced. It cannot have handlers invoked.
An instance cannot have handlers added or modified, but it can have handlers invoked.
An instance is created as a branch of a type.
A type can also branch from a type.
Types can also have versions such that some instances are rooted at a specific node in a branch, and other instances are rooted at another node in the branch. In general, older instances are rooted in older type versions.

### Naming things
Branches are also called rows.
Rows can be referenced by number (an index in the branches array).
One can also build a way to reference by name, but that's an exercise for the reader.

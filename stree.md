# STree
2024

An n-arry tree that associates a reduction-from-root (called 'residue') with each node. Allows visualizable multiverse programming.

See [combine](/combine.md)

# Intro
With stree I'm taking a page from [Introduction to Algorithms](https://en.wikipedia.org/wiki/Introduction_to_Algorithms) and using a more formal, terse specification.
This is useful when the number of operations and constraints grow and need to all be revisited on each design iteration

Note: this page is written in [Literate Markdown](./lit.md) and executed the code when you loaded the page.
The code is quite small, so you may not notice.
If the tests fail, the page will appear very different, more colorful, and there will be errors in the console.
That shouldn't happen, but if it does please [file a bug ](https://github.com/javajosh/simpatico/issues) and include the console output.

# Animating stree
This svg animation consumes stree messages
Each message type is a different stable color (in this demo there is only one msg type).
One fun thing to do is hover over the console output which will select the element in the scene.
Unlike [d3](/notes/d3-rectangles.html) we don't store the node value in a data attribute.



```html
<div id="arithmetic-render"></div>
```
```js
import {arithmeticOps} from "./stree-examples.js";
import {stree, renderStree, svg} from './simpatico.js';

const arithParent = svg.elt('arithmetic-render');
const s = stree(arithmeticOps);
renderStree(s, arithParent);
```

# Step 1: An N-ary tree with residue-per-node
Start with a basic n-ary tree.
Primary OPERATION is `add(value, parent)`. "Add value to parent" wraps the value in a node, and connects the node to parent.
private OPERATION `nodePath(node)`. Returns all objects from root to node.
OPERATION `residue(node, reducer)`.
Hardcoded attributes are 'value' and 'parent'.
Root is defined by a falsey `parent` - by convention, root parent is `null`.

```js
const root = {value : 0};
/**
 * Add a value to an n-ary tree. Return the node that wraps these parameters.
 *
 * @param value The value associated with the node.
 * @param parent The node considered as a parent. For the root node, can be null or even missing
 * @returns {{parent, value}}
 */
function add(value, parent){
    return {value, parent};
}

/**
 * The array of all nodes from the specified node up to root.
 *
 * @param node The node to start with
 * @returns {*[]} An array of nodes between `node` and root, inclusive
 */
function nodePath(node){
  const path = [node];
  while (node.parent) {
    path.push(node.parent);
    node = node.parent;
  }
  return path.reverse();
}

/**
 * Compute the residue associated with the node.
 *
 * @param node
 * @param reduce
 * @returns {*}
 */
function residue(node, reduce){
  // reduceRight effectively reverses the nodePath to start at root and end at the node
  return nodePath(node).map(node => node.value).reduce(reduce, root.value);
}

//test over some integers
const sum = (a,b) => a+b;

const node1 = add(1, root);
const node2 = add(2, node1);
const node3 = add(3, node2);
assertEquals(6, residue(node3, sum));

// define a sibling to node2 above
const node2a = add(4, node1);
assertEquals(5, residue(node2a, sum));
```

# Step 2: Add branches

OPERATION `branches()`.
Modify `add()` to be stateful and maintain `branches`.
In `add()` if `branches` contains `parent`, then we replace `parent` with `node`.
(In future revisions, we can check if residue is present to see if the parent is a branch)
Otherwise we add `node` to `branches`.
To keep this state local, we wrap the operations in another function, called `stree3`:

```js
import {combineReducer} from '/combine.js';

function stree3(rootValue, reducer = combineReducer) {
  const root = {value: rootValue};
  // initialize branches array containing only root
  const branches = [root];
  // keep track of the last node added.
  let lastNode = root;

  /**
   * Add a value to an n-ary tree.
   * Return the node that wraps these parameters.
   * Updates both branches[] and lastNode
   *
   * @param value The value associated with the node. Set to lastNode for future calls.
   * @param parent The node considered as a parent. Can be null for root.
   * @returns {{parent, value}}
   */
  function add(value, parent = lastNode) {
    const node = {value, parent};
    // update branches array
    const parentIndex = branches.indexOf(parent);
    if (parentIndex === -1){
        branches.push(node);
    } else {
        branches[parentIndex] = node;
    }
    // update other state
    lastNode = node;

    return node;
  }

  // add `lastNode` as the default parameter value.
  function nodePath(node = lastNode){
    const path = [node];
    while (node !== root) {
      path.push(node.parent);
      node = node.parent;
    }
    return path;
  }
  // add `lastNode` as the default parameter value.
  function residue(node = lastNode, reduce = reducer){
    return nodePath(node).map(node => node.value).reduceRight(reduce);
  }

  return {add, residue, root, branches};
}

// =============================================================================
// tests branches with sum
// define our test reducer
const sum = (a,b) => a+b;
const tree = stree3(0, sum);
assertEquals({value:0}, tree.root);
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

// =============================================================================
// test branches with combine
const tree2 = stree3({a:0});
assertEquals({value:{a:0}}, tree2.root);
// keep a reference to this node to use as a parent later
// use n1 instead of node1 to avoid name collision with above test
const n1 = tree2.add({a:1});
tree2.add({a:2});
tree2.add({a:3});
// assert 1 + 2 + 3 = 6 and only 1 branch
assertEquals({a:6}, tree2.residue());
assertEquals(1, tree2.branches.length);
// create a second child to node1
tree2.add({a:4}, n1);
// assert 1 + 4 = 5 and 2 branches
assertEquals({a:5}, tree2.residue());
assertEquals(2, tree2.branches.length);
// assert that the prior residue is still reachable
assertEquals({a:6}, tree2.residue(tree2.branches[0]));
// reduce over branches
assertEquals({a:7}, tree2.branches.map(node=>node.value).reduce(combineReducer));
```

# Step 3: Serialization
Make stree a reducer over an array of ordered pairs, `[[value, parent]]` where parent is replaced by its node index.
  * We add OPERATION `toArray()` and private OPERATION `fromArray()` and modify the constructor to accept an array.
  * We add OPERATION `toString()` and private OPERATION `fromString()` and modify the constructor to accept a string.

This requires that the values be serializable and concrete.
In practical terms, only `functions` need special serialization support, from [core](core).
This contract prohibits the `value`s themselves from being arrays or strings.

  * Concern: parsing functions means evaling code. Must be careful especially with code from elsewhere.
  * Concern: preventing arrays is fine, but strings would all for a nice `trie` data structure.
  * Concern: it's convenient to serialize root `parent` as `null`. But I don't like nulls.
  * Concern: the `reducer` param on `fromArray()` etc may be vestigial at this point. It would be nice to add this to the string representation somehow, if possible. But `combineReducer()` is a very long function, with dependencies, and difficult to serialize.
  * Concern: we can serialize functions, but not their dependencies. this puts a hard limit on what you can do in handler functions

```js
import {stringifyWithFunctions, parseWithFunctions, peek} from "./core.js";
import {combineReducer} from '/combine.js';

/**
 * A serializable n-ary tree with a well defined reduction defined on all nodes.
 *
 * @param value if an array or string, reconstitute stree from contents. if other, use as root.
 * @param reducer reducer used to compute the residue of a node. default is combine
 * @returns {[]|string|*}
 */
function stree3(value, reducer = combineReducer) {
  // Check for intitial value of array or string as a special case
  if (Array.isArray(value)) {
    return fromArray(value, reducer);
  }
  if (typeof value === 'string'){
    return fromString(value, reducer);
  }

  // Intitial value is not an array or string, so proceed normally
  const root = {value, parent: null};
  const branches = [root];
  const nodes = [root];
  let lastNode = root;

  function add(value, parent = lastNode) {
    const node = {value, parent};
    const parentIndex = branches.indexOf(parent);
    if (parentIndex === -1) {
      branches.push(node);
    } else {
      branches[parentIndex] = node;
    }
    lastNode = node;
    nodes.push(node);
    return node;
  }

  function nodePath(node = lastNode) {
    let nodePath = [node];
    while (node.parent) {
      nodePath.push(node.parent);
      node = node.parent;
    }
    return nodePath.reverse();
  }

  function residue(node = lastNode) {
    return nodePath(node).map(n => n.value).reduce(reducer, value);
  }

  /**
   * Return a representation of the n-ary tree as [value, parentIndex].
   * The inverse of fromArray()
   * Example: [[{a: 0}, null], [{a: 1}, 0], [{a: 2}, 1], [{a: 3}, 2], [{a: 4}, 1]];
   *
   * @returns {[{}, (null|number)][]}
   */
  function toArray() {
    return nodes.map(n => [n.value, n.parent === null ? null : nodes.indexOf(n.parent)]);
  }

  /**
   * Produce an stree from the given array.
   * The inverse of toArray().
   * private
   *
   * @param arr
   * @param reducer
   * @returns a new stree
   */
  function fromArray(arr, reducer) {
    const result = stree3(arr[0][0], reducer);
    for (var i = 1; i < arr.length; i++) {
      const [value, parentIndex] = arr[i];
      const parent = result.nodes[parentIndex];
      result.add(value, parent);
    }
    return result;
  }

  /**
   * inverse is fromString().
   *
   * @returns {string} a string representation of the stree, including functions.
   */
  function toString() {
      return stringifyWithFunctions(toArray());
  }

  /**
   * Reconstitute the stree from a string representation.
   * inverse is toString().
   * private.
   *
   * @param str
   * @param reducer
   * @returns stree
   */
  function fromString(str, reducer){
      return fromArray(parseWithFunctions(str), reducer);
  }

  // expose toArray and toString
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
const expectedArray = [[{a: 0}, null], [{a: 1}, 0], [{a: 2}, 1], [{a: 3}, 2], [{a: 4}, 1]];
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

# Step 4: Authoring
Make the serialization format more authorable.
Rather than store an array of arrays, we serialize using a flat array of integers interspersed with values.
This method is used in [stree2](./stree2) to good effect.
It is not just easier to author, but also saves space and parsing time.
Despite being a relatively trivial change to `fromArray` and `toArray`, it's important enough to get a discrete step, as a nod to Ken Iverson's excellent 1979 lecture [Notation as a tool of thought](https://www.eecg.toronto.edu/~jzhu/csc326/readings/iverson.pdf)

```js
import {stringifyWithFunctions, parseWithFunctions, peek} from "./core.js";
import {combineReducer} from '/combine.js';

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
    const parentIndex = branches.indexOf(parent);
    if (parentIndex === -1) {
      branches.push(node);
    } else {
      branches[parentIndex] = node;
    }
    lastNode = node;
    nodes.push(node);
    return node;
  }

  function nodePath(node = lastNode) {
    let nodePath = [node];
    while (node.parent) {
      nodePath.push(node.parent);
      node = node.parent;
    }
    return nodePath.reverse();
  }

  function residue(node = lastNode) {
    return nodePath(node).map(n => n.value).reduce(reducer, value);
  }

  /**
   * Return a representation of the n-ary tree as [{}, {}, 0, {}, {}].
   * The objects are values, and the integers parent node indexes.
   *
   * The inverse of fromArray()
   * Example: [{a: 0}, {a: 1}, {a: 2}, {a: 3}, 1, {a: 4}];
   *
   * @returns {[{}|number]}
   */
  function toArray() {
    const arr = [root.value];
    let prevNode = root;
    let currNode = root;
    for (let i = 1; i < nodes.length; i++) {
      currNode = nodes[i];
      if (currNode.parent !== prevNode){
        arr.push(nodes.indexOf(currNode.parent))
      }
      arr.push(currNode.value);
      prevNode = currNode;
    }
    return arr;
  }

  /**
   * Produce an stree from the given array.
   * The inverse of toArray().
   * private
   *
   * @param arr where number types are treated as parent node index.
   * @param reducer
   * @returns a new stree
   */
  function fromArray(arr, reducer) {
    const stree = stree3(arr[0], reducer);
    let value, parent;
    for (var i = 1; i < arr.length; i++) {
      value = arr[i];
      if (typeof value === 'number'){
        parent = stree.nodes[value];
        value = arr[++i]; // note the index skip
        stree.add(value, parent);
      } else {
        stree.add(value);
      }
    }
    return stree;
  }

  function toString() {
      return stringifyWithFunctions(toArray());
  }

  function fromString(str, reducer){
      return fromArray(parseWithFunctions(str), reducer);
  }

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
const expectedArray = [{a: 0}, {a: 1}, {a: 2}, {a: 3}, 1, {a: 4}];
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

# Step 5: Optimizing branch residue()
We can make residue O(1) for branches with caching.
Rather than recomputing the entire reduction from root every time, we cache the last residue and reduce that residue plus the new input.
  * Concern: There may be cases where you don't want this, and the canonical definition of residue doesn't require this. maybe put behind a flag default to true.
  * Concern: residues are NOT serialized, and will all need to be recomputed on deserialization (which happens naturally).
  * Concern: I don't like maintaining parallel arrays like branches and branchResidues. One alternative is to add a special node to every branch of the n-ary tree and store the branchResidue there. That has some conceptual niceness, as that node moves along leaving behind valid input. OTOH you now have inhomogenous nodes in the tree.

```js
import {stringifyWithFunctions, parseWithFunctions, peek} from "./core.js";
import {combineReducer} from '/combine.js';
import {assertHandler, logHandler} from "/handlers.js";

function stree3(value, reducer = combineReducer) {
  if (Array.isArray(value)) {
    return fromArray(value, reducer);
  }
  if (typeof value === 'string') {
    return fromString(value, reducer);
  }
  const root = {value, parent: null, residue: value};
  const branches = [root];
  const nodes = [root];
  let lastNode = root;

  function add(value, parent = lastNode) {
    const node = {value, parent};

    const parentResidue = parent.residue;
    if (parentResidue) {
      node.residue = reducer(parent.residue, node.value);
      branches[branches.indexOf(parent)] = node;
      delete parent.residue;
    } else {
      node.residue = residue(node);
      branches.push(node);
    }
    lastNode = node;
    nodes.push(node);
    return node;
  }

  function nodePath(node = lastNode) {
    let nodePath = [node];
    while (node.parent) {
      nodePath.push(node.parent);
      node = node.parent;
    }
    return nodePath.reverse();
  }

  function residue(node = lastNode) {
      return node.residue ? node.residue : nodePath(node).map(n => n.value).reduce(reducer, value);
  }

  function toArray() {
    const arr = [root.value];
    let prevNode = root;
    let currNode = root;
    for (let i = 1; i < nodes.length; i++) {
      currNode = nodes[i];
      if (currNode.parent !== prevNode) {
        arr.push(nodes.indexOf(currNode.parent))
      }
      arr.push(currNode.value);
      prevNode = currNode;
    }
    return arr;
  }

  function fromArray(arr, reducer) {
    const stree = stree3(arr[0], reducer);
    let value, parent;
    for (var i = 1; i < arr.length; i++) {
      value = arr[i];
      if (typeof value === 'number') {
        parent = stree.nodes[value];
        value = arr[++i]; // note the index skip
        stree.add(value, parent);
      } else {
        stree.add(value);
      }
    }
    return stree;
  }

  function toString() {
    return stringifyWithFunctions(toArray());
  }

  function fromString(str, reducer) {
    return fromArray(parseWithFunctions(str), reducer);
  }

  return {add, nodePath, residue, toArray, toString, branches, nodes, root};
}

// tests as before
const tree = stree3({a: 0});
assertEquals({value: {a: 0}, parent: null, residue: {a: 0}}, tree.root);
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
const expectedArray = [{a: 0}, {a: 1}, {a: 2}, {a: 3}, 1, {a: 4}];
const actualArray = tree.toArray();
assertEquals(expectedArray, actualArray);
const tree2 = stree3(actualArray);
assertEquals({a: 5}, tree2.residue());
assertEquals(2, tree2.branches.length);
assertEquals({a: 6}, tree2.residue(tree2.branches[0]));
assertEquals({a: 7}, tree2.branches.map(node => node.value).reduce(combineReducer));
tree2.add({foo: {bar: a => 10}});
assertEquals(10, peek(tree2.nodes).value.foo.bar());
const str = tree2.toString();
assertEquals(true, typeof str === 'string');
const tree3 = stree3(str);
assertEquals(10, peek(tree3.nodes).value.foo.bar());

// =======================================
// taken from stree2 - this all executes correctly without change!
const incHandler = {handle: () => [{a: 1}], call: () => ({handler: 'inc'})};
const decHandler = {handle: () => [{a: -1}], call: () => ({handler: 'dec'})};
const mulHandler = {
  handle: (core, msg) => [{a: null}, {a: msg.factor * core.a}],
  call: a => ({handler: 'mul', factor: a})
};

// These are convenience methods for authoring; we're still just adding objects together.
// note that assertHandler and logHandler are auto-imported from combine2. however they are small and inlinable.
// 'log' is a default import so call the logHandler function 'loggy'
const has = assertHandler.call, loggy = logHandler.call;
const inc = incHandler.call, dec = decHandler.call, mul = mulHandler.call;
const ops = [
  assertHandler.install(),
  logHandler.install(), has({debug: true, lastOutput: ''}),
  {handlers: {inc: incHandler, dec: decHandler, mul: mulHandler}},
  {a: 10}, has({a: 10}),
  inc(), has({a: 11}),
  dec(), has({a: 10}),
  dec(), has({a: 9}),
  mul(5), has({a: 45}),
  loggy('okay, lets backtack and start from an earlier node.'),
  5, has({a: 10}),
  mul(2), has({a: 20}),
  inc(), has({a: 21}),
  loggy('now lets backtrack to node 10 and '),
  10, has({a: 9}),
  mul(20), has({a: 180}),
];
// executed for side-effects only.
// to interact with it, assign the output to window.stree or simiar.
// Note: this example was exported to 'stree-examples.js' as 'arithmeticOps'
stree3(ops);

```

## Visualizations
```html
<div id="trie-render"></div>
```
```js
import {trieOps} from "./stree-examples.js";
import {stree, renderStree, svg} from './simpatico.js';

const renderParent = svg.elt('trie-render');
const s = stree(trieOps, (a,b)=> ({a: a.a + b.a}));
renderStree(s, renderParent);

```
```html
<div id="obj-render"></div>
```
```js
import {objOps} from "./stree-examples.js";
import {stree, renderStree, svg} from './simpatico.js';

const renderParent = svg.elt('obj-render');
const s = stree(objOps);
renderStree(s, renderParent);

```


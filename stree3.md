<!--<!DOCTYPE html>
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="Simpatico, stree, es6">
  <meta name="author" content="Josh Rehman">
  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='white' />
  </svg>"/>
  <script src="/testable.js" type="module"></script>
  <title>Simpatico: stree3</title>
  <link rel="stylesheet" type="text/css" href="todo_mvc.css">
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

# Intro
This is my third time implementing stree.
Each attempt has had some good and bad.
The first attempt was a simple n-ary tree, but was missing features.
The second attempt was strong on authoring, but was complex and failed in some corner cases.
With stree3 I'm taking a page from [Introduction to Algorithms](https://en.wikipedia.org/wiki/Introduction_to_Algorithms) and using a more formal, terse specification.
This is useful when the number of operations and constraints grow and need to all be revisited on each design iteration.
A thoughtful reader may note that this document itself is iterative and cumulative, like a branch of an stree.

Note: this page is written in [Literate Markdown](./lit.md) and executes the code you see when you load the page.
The code is quite small, so you may not notice.
If the tests fail, the page will appear very different, more colorful, and there will be errors in the console.
That shouldn't happen, but if it does please [file a bug ](https://github.com/javajosh/simpatico/issues) and include the console output.

# Step 1: An N-ary tree with residue-per-node
Start with a simple n-ary tree.
Primary OPERATION is `add(value, parent)`.
private OPERATION `nodePath(node)`.
OPERATION `residue(node, reducer)`.
Hardcoded attributes are 'value' and 'parent'.
Root is defined by a falsey `parent` - either missing (the usual case), `null`, 0 or `false`. (Other options exist, like `parent` missing, or `parent` equal to -1)
For the tests, we use explicit "static" variables to refer to nodes, use integer values, and an explicit reducer that is "sum".
(Concern: perhaps a better way to define root is to check for strict equality with a canonical root reference. Instead of if(node.parent) we do if(node.parent === root))

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
  return path;
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
  return nodePath(node).map(node => node.value).reduceRight(reduce);
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

Now lets add support for OPERATION `branches()`.
This operation is stateful and cannot be done functionally without adding `children`.
However, we can modify `add()` to be stateful and maintain `branches`.
In `add()` if `branches` contains `parent`, then we replace `parent` with `node`.
Otherwise we add `node` to `branches`.
To keep this state local, we wrap the operations in another function, called `stree3`:

```js

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
// test branches with combineReducer
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
  * Concern: the `reducer` param on `fromArray()` etc may be vestigial at this point. It would be nice to add this to the string representation somehow, if possible. But `combine()` is a very long function, with dependencies, and difficult to serialize.
  * Concern: we can serialize functions, but not their dependencies. this puts a hard limit on what you can do in handler functions

```js
import {stringifyWithFunctions, parseWithFunctions, peek} from "./core.js";

/**
 * A serializable n-ary tree with a well defined reduction defined on all nodes.
 *
 * @param value if an array or string, reconstitute stree from contents. if other, use as root.
 * @param reducer reducer used to compute the residue of a node. default is combineReducer
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
  // initialize the branchResidue cache
  const branchResidues = [root.value];

  function add(value, parent = lastNode) {
    const node = {value, parent};
    const parentIndex = branches.indexOf(parent);
    if (parentIndex === -1) {
      // add a new residue first so that residue isn't tricked into using the residue cache
      branchResidues.push(residue(node));
      branches.push(node);
    } else {
      branches[parentIndex] = node;
      // update the old residue - this operation is much cheaper
      branchResidues[parentIndex] = reducer(branchResidues[parentIndex], value);
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
    // check if the node is a branch, and if so return the cached residue rather than recomputing it.
    const residueIndex = branches.indexOf(node);
    if (residueIndex === -1){
      return nodePath(node).map(n => n.value).reduce(reducer, value);
    } else {
        return branchResidues[residueIndex];
    }

  }

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

// tests as before
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
const expectedArray = [{a: 0}, {a: 1}, {a: 2}, {a: 3}, 1, {a: 4}];
const actualArray = tree.toArray();
assertEquals(expectedArray, actualArray);
const tree2 = stree3(actualArray);
assertEquals({a: 5}, tree2.residue());
assertEquals(2, tree2.branches.length);
assertEquals({a: 6}, tree2.residue(tree2.branches[0]));
assertEquals({a: 7}, tree2.branches.map(node => node.value).reduce(combineReducer));
tree2.add({foo: {bar: a=>10}});
assertEquals(10, peek(tree2.nodes).value.foo.bar());
const str = tree2.toString();
assertEquals(true, typeof str === 'string');
const tree3 = stree3(str);
assertEquals(10, peek(tree3.nodes).value.foo.bar());

// =======================================
// taken from stree2 - this all executes correctly without change!
const incHandler = {handle: () => [{a: 1}], call:()=>({handler: 'inc'})};
const decHandler = {handle: () => [{a: -1}], call:()=>({handler: 'dec'})};
const mulHandler = {handle: (core, msg) => [{a : null},{a: msg.factor * core.a}], call: a => ({handler: 'mul', factor: a})};

// These are convenience methods for authoring; we're still just adding objects together.
// note that assertHandler and logHandler are auto-imported from combine2. however they are small and inlinable.
// 'log' is a default import so call the logHandler function 'loggy'
const has = assertHandler.call, loggy = logHandler.call;
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
  loggy('okay, lets backtack and start from an earlier node.'),
  5,      has({a: 10}),
  mul(2), has({a: 20}),
  inc(),  has({a: 21}),
  loggy('now lets backtrack to node 10 and '),
  10,     has({a: 9}),
  mul(20),has({a: 180}),
];
// executed for side-effects only.
// to interact with it, assign the output to window.stree or simiar.
stree3(ops);

```

# Step 6: Simple types
Pull `stree3` into a module to save space, and implement the core data model for [TodoMVC](https://todomvc.com).

```js
import {stree3} from './stree3.js';
import {validate} from "./friendly.js";

const todoPattern = {
  content: ['string', 'between', 1, 30],
  completed: ['boolean'],
  deleted: ['boolean'],
}
const t1 = {
  content: 'do something',
  completed: false,
  deleted: false,
};
const t2 = {
  content: 'do something else',
  completed: false,
  deleted: true,
};

const todoFilters = {
  all: a => !a.deleted,
  active: a => !a.deleted && !a.completed,
  completed: a => !a.deleted && a.completed,
}

// Build a todos stree and add our two todos
const todos = stree3(todoPattern);
window.s = {todos} // inspection
todos.add(t1);
todos.add(t2, 0);

// check that our tree and filters are working before and after modifications.
const visibleTodos = todos.branches.map(b => b.value).filter(todoFilters.active);
assertEquals(1, todos.branches.map(b => b.value).filter(todoFilters.active).length);

todos.add({deleted: false})
assertEquals(2, todos.branches.map(b => b.value).filter(todoFilters.active).length);

todos.add({deleted: true})
assertEquals(1, todos.branches.map(b => b.value).filter(todoFilters.active).length);
```

# Step 7: TodoMVC
TodoMVC has for a while been something of a standard for evaluating javascript libraries and tools
The application is simple, but just complex enough to give a small challenge.

I've pulled the HTML & CSS from a [random todomvc implementation](https://github.com/jonathantneal/todomvc-vanillajs-2022/blob/main/index.html).
Note that Simpatico has relatively little to say about UI binding except that we prefer vanilla JS and want to model all changes as adding objects to an stree.

Apply the [application pattern](/notes/browser-events.html) `combine(state, event); render(state);`.
Our entry point for new data will be fixed at the body root, and we'll check the source element in that handler.
```js
/// DO NOT RUN This is a first sketch of how this may look, and is NOT currently executed in the browser.

// TODO:
// Add more effects to this list as needed (e.g. onchange)
// Remove the browser event code into a library, probably core.
// Explain why I'm so explicit and repetative in the event handling (DRY is sometimes wrong)
// Explain why I'm defining a function and then calling it, rather than just executing the body (because we want to respect 1 + N execution pattern)
// Discuss the distinction between doing textual versus DOM manipulation, pluses and minuses.
// modify the class and ids and event types to match what the html produces

const identity = a => a;

const click = e =>({
  type: e.type,
  x: e.offsetX,
  y: e.offsetY,
  t: e.timeStamp,
  button: e.which,
  target: e.target,
});

const key = e =>({
  type: e.type,
  key: e.key,
  keyCode: e.keyCode,
  location: e.location,
  t: e.timeStamp,
  target: e.target,
});

const move = e => ({
  type: e.type,
  x: e.offsetX,
  y: e.offsetY,
  dx: e.movementX,
  dy: e.movementY,
  t: e.timeStamp,
});

const wheel = e => ({
  type: e.type,
  x: e.offsetX,
  y: e.offsetY,
  dx: e.wheelDeltaX,
  dy: e.wheelDeltaY,
  t: e.timeStamp,
});

const scroll = e => ({
  type: e.type,
  x: window.scrollX,
  y: window.scrollY,
});

const events = {
  "resize": identity, //browser
  "keyup": key, //independent
  "keydown": key, //independent
  "keypress": key, //dependent
  "mousemove": move, //independent
  "mousewheel": wheel, //independent
  "mousedown": click, //independent
  "mouseup": click, //independent
  "click": click, //dependent
  "dblclick": click, //dependent
  "tick": identity, //synthetic
  "scroll": identity, //dependent
  "blur": e =>({type: 'blur'}), //browser
  "focus": e =>({type: 'focus'}), //browser
  "storage": identity, //browser
  // net - xhr and websocket
  // tick - use a requestAnimationFrame pump
  // dice - add a seeded prng
};

function startTodoAppLoop(parent = window){
  // reserve the first branch for global state
  const todoapp = stree3({showActive: true, showAll: false});
  todoapp.add({label: '', completed: false, deleted: false});

  // use the same global handler for all events
  function connectEvents(handleEvents) {
    for (let eventName in events){
      parent['on' + eventName] = handleEvents(events[eventName]);
    }
  }

  // distinguish based on target props.
  function handleEvents(e) {
    // The first set of actions are mutating
    if (e.click && e.target.class && e.target.class==='delete-todo'){
      // assumes an id of the form 'delete-todo1923'.
      // alternatively, use data- attribute
      let branchId = e.target.id.substr('delete-todo'.length) * 1;
      todoapp.add({deleted: true}, branchId)
    }
    if (e.click && e.target.class && e.target.class==='complete-todo'){
      let branchId = e.target.id.substr('delete-todo'.length) * 1;
      todoapp.add({completed: true}, e.target.class)
    }
    if (e.click && e.target.id && e.target.id==='complete-all'){
      todoapp.branches.forEach(
        todoapp.add({completed: true}));
    }
    // This is mutating, but only the UI
    if (e.doubleclick && e.target.id){
      let parentId = e.target.id.substr('edit-todo'.length) * 1;
      todoapp.add({editing: true}, parentId);
    }

    // The second set of actions are filtering, and only mutate row 0
    if (e.click && e.target.class && e.target.class==='show-all'){
      todoapp.add({showAll: true}, todoapp.branches[0]);
    }
    if (e.click && e.target.class && e.target.class==='show-active'){
      todoapp.add({showActive: true}, todoapp.branches[0]);
      todoapp.add({showAll: false}, todoapp.branches[0]);
    }
    if (e.click && e.target.class && e.target.class==='show-completed'){
      todoapp.add({showActive: false}, todoapp.branches[0]);
      todoapp.add({showAll: false}, todoapp.branches[0]);
    }

    render(state);
  }

  function render(state=state) {
    let output = '';
    const activeFilter = state.branches[0].value.activeFilter;
    // header
    output += ``
    // todos
    for (todo in stree.branches.filter(activeFilter)) {
        if (!todo.value.editing) {
          output += `
            <div class="view">
              <input data-todo="toggle" class="toggle" type="checkbox" checked="${todo.completed}">
              <label data-todo="label">${todo.label}</label>
              <button class="destroy" data-todo="destroy"></button>
            </div>`
        } else {
          output += `
            <div class="view">
              <input data-todo="toggle" class="toggle" type="checkbox" checked="${todo.completed}" enabled="false">
              <input data-todo="label">${todo.label}</label>
              <button class="destroy" data-todo="destroy" enabled="false"></button>
            </div>`
        }
    }
    // footer
    // The spec doesn't call for stateful filter UI. If it did, we can access it in stree row 0 as in handleEvents
    return output;
  }
}
startTodoAppLoop(document.querySelector('.todoapp'));

```

```html
<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <input
      placeholder="What needs to be done?"
      autofocus
      class="new-todo"
      data-todo="new"
    />
  </header>
  <!-- This section should be hidden by default and shown when there are todos -->
  <section class="main" data-todo="main">
    <input id="toggle-all" class="toggle-all" type="checkbox" data-todo="toggle-all" />
    <label for="toggle-all">Mark all as complete</label>
    <ul class="todo-list" data-todo="list">
      <div class="view">
        <input data-todo="toggle" class="toggle" type="checkbox" checked>
        <label data-todo="label">Lets do something</label>
        <button class="destroy" data-todo="destroy"></button>
      </div>
      <div class="view">
        <input data-todo="toggle" class="toggle" type="checkbox" checked>
        <label data-todo="label">Lets do something else</label>
        <button class="destroy" data-todo="destroy"></button>
      </div>
      <input class="edit" data-todo="edit">
    </ul>
  </section>
  <!-- This footer should be hidden by default and shown when there are todos -->
  <footer class="footer" data-todo="footer">
    <!-- This should be `0 items left` by default -->
    <span class="todo-count" data-todo="count"><strong>0</strong> items left</span>
    <!-- Remove this if you don't implement routing -->
    <ul class="filters" data-todo="filters">
      <li>
        <a class="selected" href="#/">All</a>
      </li>
      <li>
        <a href="#/active">Active</a>
      </li>
      <li>
        <a href="#/completed">Completed</a>
      </li>
    </ul>
    <!-- Hidden if no completed items are left ↓ -->
    <button class="clear-completed" data-todo="clear-completed">Clear completed</button>
  </footer>
</section>

<footer class="info">
  <p>Double-click to edit a todo</p>
</footer>
```

Note: the majority of heavy-lifting here is done by `combine()`.
The `stree` needs to deal with branching and input that combine finds invalid.

Let us assume that `stree3()` is tightly coupled to `combine()` and the reduction is over objects.
Three kinds of objects are possible: *free-form data objects*, *types*, and *instances*.
Free-form objects are constructed as above using the rules of `combine()` but without handlers.
*Types* are objects that have a `handlers` object with a set of named `handler`-shaped objects within it.
Instances are descendants of types composed entirely of `messages`.
In general, only the ROLE "programmer" authors and adds to `handlers` to form a type.
The programmer may create *instances* to test the type.
An instance is characterized as a residue plus the handlers that mutate it.
Direct mutation of the instance is disallowed.
The ROLE "user" invokes a handler using a `message`.
Handlers may invoke each other in a "message cascade".
One characterization of a handler is as a function that takes an instance and returns a pattern.
A pattern describes the largest possibly valid set of input to the handler.
A user interacts with the pattern to produce a (possibly incomplete) concrete message in a process called 'collapse'.
Incomplete collapse can be repeated until completion.
Messages are not added to the instance until collapse is completed.
   * Concern: if messages are not added until complete collapse, we may lose information about error modes.
   * Concern: the elements of a message cascade are unified and added as one object. This may lose information about individual handler invocations. But it saves a great deal of space.

The motivation is that the instance specifies it's valid input upfront, and becomes a *friendly function*.
Adding `messages` to instances, generating a new pattern, collapsing that pattern for a new message, and occasionally creating new `instances`, is the *Simpatico steady-state application loop*.

```text
Notes

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
```


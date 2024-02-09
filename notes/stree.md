# STree
jbr *2023*

See [combine](/combine)

# Introduction
  1. Start with an n-ary tree wrapping the value
  2. Add a residue to the node, to a reduction from root

The Simpatico Tree, Summary Tree, or STree or STrie is an n-ary tree
with these applications:

1.  Unification of different kinds of specialization, especially
    inheritance vs instantiation.
2.  Similar strategy for integration of disparate families of inputs,
    e.g. network AND hci inputs.
3.  We push for the design of the most important stree: your personal
    graph.
4.  The primary type is \"person\" and each row represents a
    relationship and the messages passed over time.
8.  Guidance on the use of this data-structure and algorithm as a
    fundamental programming primitive.
9.  We demonstrate parts of the operation elsewhere:
    1.  [Browser events](/notes/browser-events.html) demonstrates
        techniques for trapping and integrating HCI events.
    2.  [Chat](/chat) demonstrates integrating network events.
    3.  [Combine](/combine) demonstrates a data-oriented reduction.


## STree as a sequence of reductions


1.  Reduction 1: The basic input is a list of values, interleaved objects and integers.
    Integers are interpreted as a 'selection' or 'focus' over either nodes (the positive integers) or the rows (negative integers plus 0).
    Targeting a node creates a new branch, and targeting a branch adds to that branch.
2.  Reduction 2: Each branch is reduced with `combine()` into a residue.
    1.  For efficiency, only one residue is kept per branch.
3.  Reduction 3: All residues are reduced into a summary.
    1.  The simplest useful summary simply concatenates, as in an array
    2.  The summary allows controlled interaction between rows during
        every measurement integration

The intuition is that you're building long rows of objects, and the
rows relate to each other in a particular way. But this simple
data-structure has some very useful properties for organizing software,
particularly when interpreted as a sequence in time.


# Tests
Basic unit tests for stree.js.
This implementation is the straight-forward n-array tree, with a focus.
By default a residue is computed and kept associated with each node, but this can be optimized.

## Support for non-combine() reductions
One can get a trie by using string concatenation.
One can get a summing tree by using addition as combine.
One can get a sequence of related objects by using `Object.assign()`.

## STree over sum

```js
  import { stree } from './stree.js';

  // Create a new stree under addition
  const s = stree(0, (a, b) => a + b);
  assertEquals(1, s.branches.length);
  assertEquals(0, s.branches[0].residue);
  assertEquals(0, s.getFocus());
  assertEquals(0, s.residue());

  s.add(1);
  assertEquals(1, s.branches.length,  'Branch length should not have changed');
  assertEquals(1, s.branches[0].residue, 'The residue is now 1');
  assertEquals(0, s.getFocus(), 'still focused on row 0');
  assertEquals(1, s.residue(), 'Another way to get residue');

  s.add(3);
  assertEquals(1, s.branches.length, 'Branch length should not have changed');
  assertEquals(4, s.branches[0].residue, 'The residue is now 4, the sum of 1 and 3');
  assertEquals(0, s.getFocus(), 0, 'Still focused on row 0');
  assertEquals(4, s.residue(), 4);

  // Set focus
  s.setFocus(1);
  assertEquals(1, s.branches.length, 1);
  assertEquals(4, s.branches[0].residue, 4);
  assertEquals(1, s.getFocus(), 'focus is now on node 1');
  assertEquals(1, s.residue(), 'residue is of node 1, which is 1');

  // Adding to a node will create a new branch with value 6. Rows are labeled with negative integers.
  s.add(5);
  assertEquals(2, s.branches.length, 'now there are 2 branches');
  assertEquals(4, s.branches[0].residue, 'the first branch is at 4, as before');
  assertEquals(6, s.branches[1].residue, 'the second branch is 1+5');
  assertEquals(-1, s.getFocus(), 'the focus is on the second branch with index -1');
  assertEquals(6, s.residue(), 'the default residue should be 6');

  s.add(5)
  assertEquals(2, s.branches.length);
  assertEquals(4, s.branches[0].residue);
  assertEquals(11, s.branches[1].residue, 'only this residue changed');
  assertEquals(-1, s.getFocus());
  assertEquals(11, s.residue(), 'the default residue is correct');

  // First argument is the value, second is the (node) focus
  // This will create a new row
  s.add(3, 2);
  assertEquals(3, s.branches.length, 'there are now 3 branches');
  assertEquals(4, s.branches[0].residue);
  assertEquals(11, s.branches[1].residue);
  assertEquals(7, s.branches[2].residue, 'the new branch has residue 7');
  assertEquals(-2, s.getFocus());
  assertEquals(7, s.residue());
  ```
## STree over `Object.assign()`
You can create a group of related objects using `Object.assign()`, which is a weaker form of [combine](/combine.md).
```js
   import { stree } from './stree.js';

  const s = stree({}, (a,b) => Object.assign({},a,b))
  assertEquals(1, s.branches.length)
  assertEquals({}, s.branches[0].residue)
  assertEquals(0, s.getFocus())
  assertEquals({}, s.residue())

  s.add({a:1})
  assertEquals(1,       s.branches.length)
  assertEquals({a:1},   s.branches[0].residue)
  assertEquals(0,       s.getFocus())
  assertEquals({a:1},   s.residue())

  s.add({a:2})
  assertEquals(1,       s.branches.length)
  assertEquals({a:2},   s.branches[0].residue)
  assertEquals(0,       s.getFocus())
  assertEquals({a:2},   s.residue())

  s.add({b:3}, 1)
  assertEquals(2,           s.branches.length, 'new branch')
  assertEquals({a:2},       s.branches[0].residue, 'old branch unchanged')
  assertEquals({a:1, b:3},  s.branches[1].residue, 'new branch')
  assertEquals(-1,          s.getFocus())
  assertEquals({a:1, b:3},  s.residue())

```



# Discussion: Data-Modeling with STree

Lots of hierarchical things can be modeled as an STree, but some make
more sense than others

1.  git. Commits form an n-ary tree where the branches are\...branches.
2.  Choose-your-own-adventure style stories.
3.  A sequence of low-level input measurements combine with a pattern to
    produce a value.
4.  A sequence of low-level input measurements combine with a list of
    patterns to produce a structured message, a list of values.
5.  a type system with inheritance. a type is a list of handlers, a
    subtype is a different list of handlers.
6.  instantiation and handling of different sequences of inputs.
7.  Linux distributions and their relationships
8.  A repo full of Dockerfile\'s that get longer the deeper in the
    folders you go.
9.  The state of a cluster of computers, each being a row with
    independent new network input over time.
10. The state of a collection of tabs, each tab being a row with new hci
    input over time
11. Object instantiation and method invocation sequences. Making an
    anologue to this in Simpatico drove the combine/handler design.
12. New accounts, account activity
13. Linnean system of taxonomic classification
14. An interactive screen sensitive to human interaction with mouse and
    keyboard and, eventually, a commitment.
15. A set of forms, as with paperwork.
16. Related sequences of build targets (e.g. gradle)

Although I\'ve written the STree to support any reduction for reduction
2, combine is my favorite.

### Canonical examples

We could write an STree that organizes forms and the data those forms
collect over time. The forms are represented as built up from scalars, a
list of patterns, and the UI a list of ui components. Then these forms
branch on new input. New versions of a form can be made and used
simultaneously with old versions of a form. Our \"test suite\" is always
a characteristic set of form inputs that can be reached. Note that a
\"Core\" and a set of handlers is a bit like a set of forms.



------------------------------------------------------------------------

**1** **2** **3**

------------------------------------------------------------------------

**1** **2** **3** **7** **8**

**4** **5** **10** **11**

**6** **9**

------------------------------------------------------------------------

**1** **2** **3** **7** **8**

**4** **5** **10** **11**

**6** **9**

The Problem of State Management
-------------------------------

The problem of process state management is currently tackled by software
components like Redux.

Note that server side software doesn\'t have state; or rather, it\'s
state is a very tightly coupled to the static source code. That type of
code is dominated by the definition of singletons (and the reuse of
them), to support, ultimately, Controllers that do the work. In general,
a server must be responsible for its own security.

These singletons recapitulate many of the same concerns that arise in
build systems; in fact its the same concern but handled at compile time
by one tool (Maven) and at runtime by another tool (Spring). Or on the
client by one tool at compile-time (npm, ng) and another at runtime
(angular module annotations).

The natural data-structure then would be to model state as a special
dynamic part of the head of a linked list of input. It doesn\'t really
have to be dynamic.

Well, it\'s a kind of tree that is built up in a particular way. It\'s a
constrained kind of n-ary tree, which is optimized for long runs. We
imagine the tree composed of rows, and each row has a parent, rather
than each node. Moreover, we introduce a special coordinate system that
supports rows and nodes as parents, and provide a (stateful) pointer to
the target. The rule is that if you\'re pointing at a node, you create a
new row with that as it\'s parent. Otherwise, you\'re just adding to the
row.

### Some code

A nice sketch of what a top-level stree residue might look like:

(Note: this is a very early sketch!)
```js
///
      S({
        id: 0,
        measurement: 'START',
        timestamp: now(),
        pid: Math.random(),
        global: window,
        runtime: "macos chrome timezone language",
        localStorage: localStorageObject,
        cookies,
        input: {keydown:[], mousemove:[], net:[], console:[], clock:[], dice:[], screen:[], zoom:[]},
        output: {screen: window.document.body, storage: window.localStorage, cookie: window.document.cookie},
        apps: {
          root: {msgs:[{},{},{},2,{},3,{},{}], residue: {}},
          string : {msgs:[{},{},{},2,{},3,{},{}], residue: {}},
        },
        // os windows, applications, files, functions, components
        // request, response, sub-resources, timings embeded in response, etc.
      });
```


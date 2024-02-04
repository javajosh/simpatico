# STree
jbr *2023*

See [home](/), [combine](/combine), TODO merge with [stree2](/stree2.md)

# Introduction
  1. Start with an n-ary tree.
  2. map each node to a reduction from root, called residue.
  3. New nodes are defined as a collapse of residue.
  4. The set of residues associated with branch tips are special, and we define another reduction over those. Defining application state.

The Simpatico Tree, Summary Tree, or STree or STrie is an n-ary tree
with these features:

1.  Unification of different kinds of specialization, especially
    inheritance vs instantiation.
2.  Similar strategy for integration of disparate families of inputs,
    e.g. network AND hci inputs.
3.  We push for the design of the most important stree: your personal
    graph.
4.  The primary type is \"person\" and each row represents a
    relationship and the messages passed over time.
5.  The opposite of egalitarian is utilitarian, genes, family, or value.
6.  Associate a reduction with every node over the values from root to
    that node.
7.  Provide a novel, hopefully useful reduction, the [combine
    function](/combine)
8.  Guidance on the use of this data-structure and algorithm as a
    fundamental programming primitive.
9.  We demonstrate parts of the operation elsewhere:
    1.  [Browser events](/notes/browser-events.html) demonstrates
        techniques for trapping and integrating HCI events.
    2.  [Chat](/chat) demonstrates integrating network events.
    3.  [Combine](/combine) demonstrates message cascade.
10. A \"component\" can interpret arbitrary input.
11. The canonical component is an HTML file (although we will define
    other equivalent configurations)
12. The primary data-structure is always human-centered, the contents of
    the relationship, with various analyses available.
13. Connection takes effort, time, money, and thought.
14. Prioritize those projects, or you will die alone.
15. Discovery takes effort, time, money and thought.
16. Prioritize those projects, or you will die unknown.

## The STree is a data-structure and a set of reductions
The most elegant way to specify this data structure is as a sequence of
reductions which accept as input the output of the previous:

1.  Reduction 1: The basic input is a list of values, which are
    interleaved objects and integers.
    1.  Integers are interpreted as a \'selection\' or \'focus\' over
        either nodes (the positive integers) or the rows (negative
        integers). Targeting a node creates a new branch, and targeting
        a branch adds to that branch.
    2.  Strings are turned into objects, and objects are parented by a
        new node according to current focus. The stateful focus allows
        for long runs of input targeted at the same row. It also better
        represents the essential independence of targeting and messaging
        at this stage. (We will later explore the possibility of
        explicitly auto-classifying input using a specialized row type
        for all input).
2.  Reduction 2: Each branch is reduced with `combine()` into a residue.
    1.  For efficiency, only one residue is kept per branch.
    2.  One useful purpose of this residue is to express a pattern for
        new input!
    3.  A null residue means there can be no new input.
    4.  This reduction implements \"the message cascade\" that lets you
        see why values are what they are.
3.  Reduction 3: All residues are reduced into a summary.
    1.  The simplest useful summary simply concatenates.
    2.  The summary allows controlled interaction between rows during
        every measurement integration

The intuition is that you\'re building long rows of objects, and the
rows relate to each other in a particular way. But this simple
data-structure has some very useful properties for organizing software,
particularly when interpreted as a sequence in time. An STree is a list
of measurements binned according to a pattern, and then combined with
the bin to produce something useful.


# Tests
Basic unit tests for stree.js.
This implementation is the straight-forward n-array tree, with a focus.
By default a residue is computed and kept associated with each node, but this can be optimized.

## Support for non-combine() reductions
This stree can support integer inputs, unlike
This stree is using simple addition as the branch/row reducer.
```js
  // Default imports already define an stree, so we need to rename it.
  import {stree as stree1} from './stree.js';

  // Create a new stree; verify initial state
  const r = stree1(0, (a, b) => a + b);
  assertEquals(r.branches.length, 1);
  assertEquals(r.branches[0].residue, 0);
  assertEquals(r.getFocus(), 0);
  assertEquals(r.residue(), 0);

  // Add 1; verify that the zeroeth row is now 1 and nothing else changed.
  r.add(1);
  assertEquals(1, r.branches.length,  'Branch length should not have changed');
  assertEquals(1, r.branches[0].residue, 'The residue is now 1');
  assertEquals(0, r.getFocus(), 'still focused on row 0');
  assertEquals(1, r.residue(), 'Another way to get residue');

  // Add 3; The zeroeth row is now 4
  r.add(3);
  assertEquals(r.branches.length, 1);
  assertEquals(r.branches[0].residue, 4);
  assertEquals(r.getFocus(), 0);
  assertEquals(r.residue(), 4);

  // Set focus
  r.setFocus(1);
  assertEquals(r.branches.length, 1);
  assertEquals(r.branches[0].residue, 4);
  assertEquals(r.getFocus(), 1);
  assertEquals(r.residue(), 1);

  // Adding to a node will create a new branch with value 6. Rows are labeled with negative integers.
  r.add(5);
  assertEquals(r.branches.length, 2);
  assertEquals(r.branches[0].residue, 4);
  assertEquals(r.branches[1].residue, 6);
  assertEquals(r.getFocus(), -1);
  assertEquals(r.residue(), 6);

  r.add(5)
  assertEquals(r.branches.length, 2);
  assertEquals(r.branches[0].residue, 4);
  assertEquals(r.branches[1].residue, 11);
  assertEquals(r.getFocus(), -1);
  assertEquals(r.residue(), 11);

  // Focusing on second node in first row of value 3 and residue 4.
  // Creates a new row
  r.setFocus(2);
  r.add(3);
  assertEquals(r.branches.length, 3);
  assertEquals(r.branches[0].residue, 4);
  assertEquals(r.branches[1].residue, 11);
  assertEquals(r.branches[2].residue, 7);
  assertEquals(r.getFocus(), -2);
  assertEquals(r.residue(), 7);

  // Now an stree with objects
  const s = stree1()
  assertEquals(s.branches.length, 1)
  assertEquals(s.branches[0].residue, {})
  assertEquals(s.getFocus(), 0)
  assertEquals(s.residue(), {})

  s.add({a:1})
  assertEquals(s.branches.length, 1)
  assertEquals(s.branches[0].residue, {a:1})
  assertEquals(s.getFocus(), 0)
  assertEquals(s.residue(), {a:1})
```

## Latch Demo
Not really sure what this is about, actually.
```js
  import latch from './demos/demo-latch.js'

  log('start', latch.residue().count)
  latch.add({count: -10})
  assertEquals(latch.residue().count, 90)
  latch.add({handler: 'dec'})
  assertEquals(latch.residue().count,89)
  latch.add({handler: 'dec', amount:10})
  assertEquals(latch.residue().count, 79)
  latch.add({handler: 'dec', amount:79})
  assertEquals(latch.residue().count, 0)
  assertThrows( ()=>latch.add({handler: 'dec'}))

  // latch.add({handler: 'dec', amount: 5}, r => assertEquals(r.count, 94));
  // latch.add({handler: 'dec', amount: 50},r => assertEquals(r.err.failures, {amount:['between', 0, 10]}));
```


# Data-Modeling with STree

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

Stop 2s Refresh

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

## Errata

```css
b {
  display: inline-block;
  background: orangered;
  min-width: 50px;
  min-height: 50px;
  line-height: 1.2;
}
```

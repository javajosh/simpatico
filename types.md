# Types
*javajosh 2024*

See [home](/), [combine](/combine.md), [stree](/stree.md)

# Data-Modeling with STree

Lots of hierarchical things can be modeled as an STree, but some make
more sense than others

1.  git. Commits form an n-ary tree where the branches are branches.
2.  Choose-your-own-adventure style stories.
3.  A sequence of low-level input measurements combine with a pattern to produce a value.
4.  A sequence of low-level input measurements combine with a list of patterns to produce a structured message, a list of values.
5.  a type system with inheritance. a type is a list of handlers, a subtype is a different list of handlers.
6.  instantiation and handling of different sequences of inputs.
7.  Linux distributions and their relationships
8.  A repo full of Dockerfile's that get longer the deeper in the folders you go.
9.  The state of a cluster of computers, each being a row with independent new network input over time.
10. The state of a collection of tabs, each tab being a row with new hci input over time
11. Object instantiation and method invocation sequences. Making an anolog to this in Simpatico drove the combine/handler design.
12. New accounts, account activity
13. Linnean system of taxonomic classification
14. An interactive screen sensitive to human interaction with mouse and keyboard and, eventually, a commitment.
15. A set of forms, as with paperwork.
16. Related sequences of build targets (e.g., gradle)


The Problem of State Management
-------------------------------

The problem of process state management is currently tackled by software
components like Redux.

Note that server side software doesn't have state; or rather, it's
state is a very tightly coupled to the static source code. That type of
code is dominated by the definition of singletons (and the reuse of
them), to support, ultimately, Controllers that do the work. In general,
a server must be responsible for its own security.

These singletons recapitulate many of the same concerns that arise in
build systems; in fact it's the same concern but handled at compile time
by one tool (Maven) and at runtime by another tool (Spring). Or on the
client by one tool at compile-time (npm, ng) and another at runtime
(angular module annotations).

The natural data-structure then would be to model state as a special
dynamic part of the head of a linked list of input. It doesn't really
have to be dynamic.

Well, it\'s a kind of tree that is built up in a particular way. It's a
constrained kind of n-ary tree, which is optimized for long runs. We
imagine the tree composed of rows, and each row has a parent, rather
than each node. Moreover, we introduce a special coordinate system that
supports rows and nodes as parents, and provide a (stateful) pointer to
the target. The rule is that if you're pointing at a node, you create a
new row with that as its parent. Otherwise, you're just adding to the
row.

### Some code

A nice sketch of what a top-level stree for a SPA webapp might look like:
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

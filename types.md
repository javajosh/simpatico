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

# The Problem of State Management
The problem of process state management is currently tackled by software components like [Redux](https://redux.js.org/).

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

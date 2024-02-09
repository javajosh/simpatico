# Types
*javajosh 2024*

See [home](./index.html), [combine](/combine.md), [stree](/stree.md), [friendly](/friendly.md)

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

# Example of SPA state

A nice sketch of what a top-level stree for a SPA webapp might look like:
```js
///
      S({
        id: 0,
        measurement: 'START',
        timestamp: now(),
        pid: Math.random(),
        runtime: "macos chrome timezone language",
        input: {keydown:[], mousemove:[], net:[], console:[], clock:[], dice:[], screen:[], zoom:[]},
        output: {screen: window.document.body, storage: window.localStorage, cookie: window.document.cookie},
        apps: {
          root: {msgs:[{},{},{},2,{},3,{},{}], residue: {}},
          string : {msgs:[{},{},{},2,{},3,{},{}], residue: {}},
        },
      });
```

# Simple Record Example
In this example, we define a `person` type and inititalize an stree with it.
It's a single handler that only applies a pattern.
Some of the verbosity is the test harness itself.
The content of the `handle()` function is almost all boilerplate to be extracted into combine.
This also avoids the need to import `validate()`.

```js
import {stree} from '/stree.js';
import { HandlerError} from '/combine.js';
import {validate} from '/friendly.js';

const person = {
  name: 'person',
  example: {
    name: 'alice',
    phone: '1234567890',
  },
  pattern: {
    name: ['str', 'between', 3, 50],
    phone: ['str', 'size', 10],
    notes: ['optional', 'str'],
  },
  handle: function(core, msg){
    const errors = validate(this.pattern, msg);
    if (errors) return errors;
    const {handler, ...data} = msg;
    return [data];
  }
}

const s = stree({handlers: {person}});
let result;

// try an invalid record
try {
  result = s.add({handler: 'person'});
  assert(false);
} catch (e) {
  if (e instanceof HandlerError){
    console.log('HandlerError thrown as expected', e.customData, result)
  } else {
    throw e;
  }
}
// try a valid record, creating a row for "alice"
try {
  result = s.add({handler: 'person', ...person.example});
} catch (e) {
  if (e instanceof HandlerError){
    console.log(e.customData, result);
  }
  throw e;
}

// try to make a new, clean row for "bob"
s.add({handler: 'person', name: 'bob', phone: '0987654321'}, 1);
console.log(s.residue(1), s.residue(2));

// TODO support updating just one tuple of the record.
// This will require combining the msg with the residue and re-running validation on the whole thing.
// Not sure how this will feel, or how necessary it is, since the caller can always pull the prev residue
try{
    s.add({handler: 'person', name: 'charlie'});
} catch (e) {
  if (e instanceof HandlerError){
    console.log(e.customData, result);
  } else {
    throw e;
  }
}
// The (verbose) way to get around a subset update is something like this:
const {handlers, ...current} = s.residue();
const update = Object.assign({}, current, {handler: 'person', name: 'charlie'});
s.add(update);
console.log(s.residue());
```

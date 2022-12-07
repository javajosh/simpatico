# Simpatico

This is a browser hosted JavaScript prototype of Simpatico.
Simpatico has the goal of describing a new, minimal characterization of "software application".
This prototype is distributed as a collection of 4 ideas, one module per idea, one test harness per module.
Here is one way to get started:

  1. Open a terminal.
  1. `$ git clone https://github.com/javajosh/simpatico.git && cd simpatico`
  1. `$ npm start`
  1. [This prints an `http://localhost...` url]
  1. [Open the above url in a browser]
  1. [Open the test harness for each module in its own tab with `ctrl-click`]

Your browser is now running tests over each the 4 modules, such that if you modify any file they will be reloaded and retested.
If there is a problem in any module, the `favicon` for the tab will turn red.
Note: there is nothing special about the server; all custom code is in the html/js.
You could easily run `python -m http.server` or `nginx` or `httpd` instead of the `npm run serve` command.
The `npm run serve` command is for convenience only, and can be ignored.
However, because I'm using browser modules, the pages cannot be served from a `file:\\` url.

Note: I've recently included another server, the reflector

### No front-end build

I'm a big fan of very fast build-test-debug (BTD) loops, and no matter how good front-end builds get, they will never be as fast as no-build.
I also value the days when you could "view source" on a page or resource and learn from the techniques of others (in contrast to just seeing compiler output, so I wrote this in that same spirit.
This choice was further enabled by the (relatively) recent invention of native browser modules, which give you nice tools to organize your code without a build.

*What about tests?* This choice meant I had to write my own simple test harness, but I'm rather pleased with the results.
It's one very small (~30 line) script (`testable.js`) requiring 4 lines in the harness html file to make it work.
Tests are written in imperative, plain javascript with very little ceremony.
Tests run on page load, and fail with an exception, which turns the tab favicon red.
So, there is *kind of* a build, but it's your browser's javascript parser itself.

If you want to run tests non-interactively, you can do so with `chrome` in headless mode. On Ubuntu you'd do something like this to install and run chrome headlessly:
```
$ wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
$ sudo dpkg -i google-chrome-stable_current_amd64.deb
$ sudo apt -f install
$ google-chrome --headless --disable-gpu http://127.0.0.1:8081/core.html
```

Note that if ES6 modules supported `file:\\` urls, or if I concatenated the modules into a single js file, you would ONLY need a browser process to run the tests.

## SimpatiComponents

  1. `core`. Very generic, convenience functions that smooth over the JavaScript runtime.
     Of particular importance is the definition of a comprehensive set of predicates/assertions.
     Nothing in this module is specific to Simpatico, although it is a good example of my preferred style of ES6 programming -> functional and minimal.
  2. `combine`. The function used to produce a new state from a previous state plus an input.
     `combine()` is a generalization of `Object.assign()` and previously published as [combine-keys](https://github.com/javajosh/combine-keys).
     Defines handler invocation and the message cascade.
  3. `rtree`. A data structure that organizes inputs into chains that result in different, related states.
     Unifies previous distinct concepts like instantiation vs inheritance.
     Provides natural "collections" support.
  4. `friendly`. A very simple runtime type system, accessed through `validate()`, that helps functions help their callers call them correctly.

More detail about each module is available in the test harness `html` file, and the module source code itself.

## The Goal

Simpatico is the result of a meditation on what software applications *really are*, independent of their expression in any particular language, framework, protocol, or development methodology.
At the end of the day, an application is a set of communicating screens with sensors attached ('screensensors'), such that the state of any screen remains constant until new input arrives.
In the general case, we assume that inputs are immutable, requiring integration with the program state to occur through mediating data-structures, e.g. the `node` structure of a linked list.
The intuition is that a program is a large blob into which we fling new data in the form of (relatively small) input.

Applications differ wildly in the level of their reactivity to input, from programs that just record input (an etch-a-sketch) to those that do arbitrary and complex things (a 3D game).
Functional programmers have long known that you can characterize the state of any program as a reduction over its inputs.
If you include programming statements themselves as inputs, then from a sufficiently general starting point you can describe any program.
The intuition here is something like a stem cell differentiating based on its inputs to eventually stabilize and perform a specialized function.
Another intuition is how evolutionary biology describes species differentiating over time according to selection pressure to occupy an ecological role.

## Top-level program structure

A general program has two distinct phases, transient invocation and a steady-state message handling.
Traditional `hello world` is just the first phase, a one-off invocation without a steady-state.
In practice the arguments to the transient invocation are called "command line arguments" or "configuration", whereas the arguments to steady state handlers are called "requests", "messages", or "events".
Let us name this ubiquitous pattern "1 + N", where the "1" stands for the unique, singular primordial invocation event, and the N stands for an unknown number of subsequent steady-state event calls.
Inputs come from different *physical sources*, or devices interleaved and arriving at random times.
Somewhat unusually, I consider both clock ticks and random numbers to be event sources, too, which helps make Simpatico programs deterministic by default.
Example: A server process uses the invocation step to prepare to accept subsequent steady-state inputs by binding a handler to a well-known network port.
Example: A GUI loads the UI and becomes sensitive to all subsequent clicks and key-presses.
Example: A console is powered on and becomes sensitive to gamepad input.

Let all side-effects, including the side-effect of rendering program state to a screen, be handled by a single `render()` function on the entire program state executed after event integration is complete.
This naive approach will help simplify our thinking while we deal with issues around the evolution of program state itself.
The entire general program loop looks something like the following JavaScript psuedo-code:

```js
// Listing 1
 1 const combine = (state, input) => {...}
 2 const render = state => {...}
 3 let state = {};
 4 bind(eventSource, event => {
 5   state = combine(state, event);
 6   render(state);
 7 })
```

Lines 1 through 4 show the entire "1" portion of the program, executed once, and lines 5 and 6 imply the "N" portion of the program, executed many times.
We may make manual adjustments directly to initial state on line 3, and/or invoke `combine()` manually between lines 3 and 4, and we call those additions "what the programmer does".
Lines 5 and 6, the steady state, are "what the user does".
`render(state)` may refer to rendering to screen, rendering to disk, writing to the network, or any side-effect.
This code implies that `combine()` is pure, because otherwise the state assignment on line 5 wouldn't be necessary.

An astute reader will notice that this looks something like "a reduction over time", which it is.
One can get to any reachable state through a statement like `const stateN = [event0, event1, event3,..., eventN].reduce(combine,{})`.
(In order for this to be the case, the program must not be time dependent!
That is, behavior *cannot* depend on when events come in, but *must* depend on their relative ordering.)

Aside: this code does not include error-handling, and both lines 5 and 6 can have non-trivial errors, and should be wrapped in exception handlers.
This has been omitted for clarity.
To handle this we'd wrap them both in try/catch blocks, and we'd avoid erasing the old state until line 6 completes without error.
If an error occurs, we'd avoid re-assigning state and put the problematic event and any partially produced error state somewhere for the programmer to examine.

## The combine() function

An obvious thing to want to do is to simply keep track of all input in state, perhaps in an array.
You might do this by defining `combine` on listing 1 line 1 like this:

```js
// Listing 2
 1 const combine = (state, event) => {
 2     if (!is.arr(state.events)) state.events = [];
 3     state.events.push(event);
 4     return state;
 5 }
```
You *can* implement state and `combine()` with *ad hoc* immutability by simply pushing all events into an events array, as above.
However, removing it de-clutters both the application state (no more `events` member) and declutters the `combine()` function itself.
It turns out that tracking events *outside* application state gives you both *time travel*, and *movement between alternate timelines*, which are quite useful.
(See the RTree sections, below)

 `combine` is a generalization of `Object.assign()` that, in addition to what Object.assign does, handles nested objects, combines scalars in useful ways, and permits function invocation.
Combine can invoke functions in two ways.
First, by simply replacing a function with its return value, passing in the corresponding value of the ihput.
Second, a more interesting method that doesn't "consume" the function, which is this is done by defining a "handler".
A handler is a special "object shape" or "pattern" (see the "friendly function" section below)
 `{name: ['str'], handle: ['fun'], pattern: ['optional', 'arr']}` that when combined with another object shape
 `{handler: ['str', 'in', [names]], value: ['obj']}` results in the `handle` function called with `value` as its argument.
The first shape is called a `handler` and the second shape is called a `message`.
The results of that `handle` call are not returned directly, but are themselves combined into program state, recursively.
This allows us to write our handlers as pure functions which take residue and events, and return an array of objects that will be subsequently combined with residue in a process called "message cascade".
Message cascade is a reification of the call-chain, which the considerable benefit of being declarative.
This representation of state change lets you answer the question, "why is this part of my state this value? What made it that way?" even after the fact, without a debugger.
It's also pretty to visualize.

This is just a brief introduction to what `combine` is and what it can do.
Please see the source, test-harness, and notes for more information.


### SimpatiCore, aka core

An object of the form `{residue: {}, handlers: {{a},{b},{c}}}`, and which is ONLY allowed to be combine'd with messages, is a SimpatiCore, or `core`.
The `core` represents the center of the application logic, and it is the lowest entropy representation of the finite state machine that sits at the heart of every application.
I propose that all applications consist of only two kinds of cores: subjects and objects.
I propose that the subjects are users.
I propose that a good general characterization of any object, in this sense, is a game, which is a general state into which players send inputs, advancing the state and affecting the validity of subsequent inputs.
A 'user' object can be understood in many ways, such as a reduction over the messages sent between user and application, representing the current state of the relationship.
However, I propose that the main responsibility of the user is to provide a central organizing principle for their games, past present and future.
Note that a core is "halted" when no handlers can be called on it, and this state is irreversible.

A note about state lifetimes.
User cores are very long-lived, roughly the length of the user's relationship with the software, aka the lifetime of their account.
Game cores are relatively short-lived, at most days or weeks, but usually hours.
Other, shorter-lived cores are sometimes useful, as with user sessions or connections.
However, modeling these more ephemeral states as part of the user core makes the most sense to me currently.
The application lifetime is the union of all user lifetimes (which are the union of all game lifetimes), and I call it a [Durable Process](./notes/durable.html).
(If a business starts and ends multiple applications, then *it* is a durable process with a lifetime determined by the union of those application lifetimes)

**Textual Representation/Notation** Although I often refer to input as "events", the input to combine can be any object, even the same objected added repeatedly.
Let's say we have objects `a`, `b`, and `c`. Unique program states can then be specified as strings like `aabbcc`, `cba`, `ccaabbbaabababababaa` or  `aaaaaaaaaaaaaa`.
These strings should be read from left to right, as with natural english text, such that the left-most object is added first, the right-most object last, with the empty object `{}` assumed to be the starting point, or it can be included explicitly as `0`.
A drawback to this notation is that the index of each object isn't labeled, so you must count (so keep it short!).
Note that since handlers themselves are objects, these strings can also describe unique data types.
Note that although repetition doesn't make sense for handlers - their definition is idempotent - it makes sense to redefine handlers, to create a new *type version*.
Type versioning, within the same running vm, is one of those features you didn't realize you needed, but you do.
If your example requires more than 26 unique objects, it's probably too complex, but feel free to use upper-case letters too.

## RTree

The `combine()` function, along with the `core` handler conventions, is enough to build up any reactive object from any set of other objects (the "1") and then handle steady-state input (the "N") and is the backbone of Simpatico.
However, most programs need a variety of different objects, and multiple instances of those.
In ordinary programming, we do this during "build time", statically defining with source-code all of the classes of objects we'll need at runtime.
In Simpatico, we allow this to happen at runtime, and give that responsibility to a new data-structure, the `rtree`, plus some conventions for working with it in this way.

First, some simple facts about the rtree.
 1. An `rtree` is a trie of object inputs, with the tip of each branch defining a unique `core` state.
 1. Inputs are numbered from 0 to N, branches from 0 to B, where B <= N.
 1. We define the `residue` at any point in the rtree by walking up to root and reducing all inputs up to that point with `combine()`.
 1. The residue of the branches are of particular importance, because, by convention, rows are accepting most new input in the steady state.
 1. The rtree has a preferred visual representation that follows English written convention, with each branch getting a new line, and each event adding to the current line, as a single character.
 1. "Row" and "branch" are interchangeable terms.

### General RTree examples

General RTree examples do NOT take into account the meaning of each object input, but instead focus on the structure of the rtree.
For these examples, we say that objects are added in alphanumeric order, such that we can infer when the input row changed.
These structures are generic; the more useful patterns for Simpatico will be explored in the section Simpatico RTree examples.

A simple 2 row rtree, with row 0 starting with the usual empty object, and then a branch at c.
This rtree describes two strings: `0abc` and `0abcdef` from 6 total objects.
```
0-0abc
1-cdef
```

A slightly more complicated rtree, where after `f` was added input position alternated between the rows, yielding the two strings `0abcgi` and `0abcdefh`
```
0-0abcgi
1-cdefh
```

This rtree describes 3 rows/strings, `0abc`, `0abcdef` and `0abcdefghi`.
```
0-0abc
1-cdef
2-fghi
```

This example also yields 3 strings, but this time the third string branches from c, too, yielding `0abc`, `0abcdef`, and `0abcghi`.
```
0-0abc
1-cdef
2-cghi
```

This example shows you can branch from any part of a previous string, not just the "last" object of the row.
2 branches from b, and 3 branches from d, yielding `0abc`, `0abcdef`, `0abghi`, `0abcdjk`.
```
0-0abc
1-cdef
2-bghi
3-djk
```

Finally, an example showing that you can keep adding objects to previous rows, even after you've branched.
This rtree yields strings `0abclp`, `0abcdefm`, `0abghin`, `0abcdefjko`
```
0-0abclp
1-cdefm
2-bghin
3-fjko
```

### Simpatico RTree examples

A Simpatico a program is an `rtree` that accepts both strings and numbers, such that the number moves a 'cursor', and the string is parsed as an object, and then integrated with the row using combine().
The rtree gives us very powerful collections allowing us to cheaply "branch" any given state, and unifies the traditional OOP concepts of "subclass" and "instantiation".
Both instantiation and inheritance are just specializations of a previous state.

Here are a few conventions (Under Construction!!!) that limit our use of the rtree to make applications more manageable:

  1. The 0 row is reserved for configuration, process statistics, and results from invocation.
  2. The 1 row is used to define the root of all types.
  3. The 2 row branches from 1 and is used to define the subject type (user).
  4. The 3 row branches from 1 and is used to define the object type (game).
  5. New instances are branched off of a type row (the end of the row).
  6. New `type versions` are defined by adding new or revised handlers to the type row.

Implications of type versions:
  1. New instances are always produced from the latest version.
  2. Old and new versions of a type can and will exist in the same process.
  3. Old versions of a type cannot be instantiated.
  4. Instances are not subsequently branched (aka only types are branched).
      An important exception to this is in testing, where branching instances is very useful indeed.

Note: it may be useful to collect all "raw" input into a row, or even one row per type, before reacting to it.
In practice we don't want to store all raw input, so this is a natural place to implement something like a circular buffer that throws away unnecessary input.
It also gives us a place to describe the system in "unresolved tension", such that the process knows about an event, but hasn't acted on it. This is useful.

In this example, all events are put into row 1, with two types defined on rows 2 and 3. Row 2 has two instances, 4 and 5, and Row 3 has one instance.
For instance events I've just used numbers, since the absolute ordering doesn't matter for them.
```
Simpatico RTree

a = config, b= current process stats
c = handler definition, d = event handler. e = events
fgh = user handlers
ijkl = game handlers

0-ab
1-cde12345
2-cfgh
3-cijkl
4-h1234
5-h12345
6-l123
```

Here's what this RTree means:
  1. Branching from h means creating a new user
  2. Branching from l means creating a new game
  3. Branching from c means creating a new type
  4. Adding handlers to row 2 or 3 means creating a new type version.
  5. Row 0 contains the full history of a) the current process, and b) summary information about the durable process and its past invocations.
  6. If you want to test something, just branch it. For example, if you wanted to test an alternate history for Row 5 (a game instance) you could make a 7-h12367 locally.

## RTree Summary function

It is often useful to allow branch residues in an rtree to interact with each other, and also to summarize them.
So the rtree defines one more function, that reduces over the branches and returns a kind of "super residue".
[I'd also like to give this function the ability to generate inputs for sibling rows in the rtree, but I haven't done that yet].
The canonical example here is a field of N particles.
The 0th row might define a particle, with subsequent rows defining new particles with new state.
Without a super residue, the particles can advance with time input, but cannot interact with each other.
With a super residue, we'd have the ability to detect collision and modify participating particle's momentum.


## Friendly functions and input validity

In the beginning, all inputs are allowed.
However once we define handlers, *invalid* input, invalid messages, are possible.
Handlers will have required values, values within a range, or values that match a pattern.
Simpatico takes the "friendly function" approach, and asserts that a function should help its caller call it, if possible.
So it's useful for a handler to be able to return a "pattern" describing inputs that would subsequently be valid.
This is, in fact, one of the ways branch residues are special - we expect them to contain a pattern that describes which inputs are valid.

Here is an example of an object pattern:
```js
  const userPattern = {
    id: ['num', 'between', 0, 1000],
    name: ['str', 'between', 3,50],
    nick: ['optional', 'str', 'between', 0, 10],
    email: ['str', 'matches', '^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$'],
    role: {
      id: ['num', 'between', 0, 10],
      category: ['optional', 'str', 'between', 3, 8],
    },
  };
```
This kind of pattern would be useful for any handler that accepts a user.

TO BE CONTINUED...

## Essays in the craft

  1. [d3-rectangles](./notes/d3-rectangles.html)
  1. [last-write-wins](./notes/last-write-wins.html)
  1. [browser-events](./notes/browser-events.html)
  1. [memory](./notes/memory.html)

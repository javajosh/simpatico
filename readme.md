 <p align="center">
  <a href="https://openpipe.ai">
    <img height="70" src="https://raw.githubusercontent.com/javajosh/simpatico/master/img/wizard.svg" alt="logo">
  </a>
</p>
<h1 align="center">
  Simpatico
</h1>

<p align="center">
  <i>Literate markdown server for a local codepen-like experience</i>
</p>

<p align="center">
  <a href="/LICENSE"><img alt="License MIT" src="https://img.shields.io/github/license/javajosh/simpatico?style=flat-square"></a>
  <a href='http://makeapullrequest.com'><img alt='PRs Welcome' src='https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square'/></a>
  <a href="https://github.com/javajosh/simpatico/graphs/commit-activity"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/javajosh/simpatico?style=flat-square"/></a>
  <a href="https://github.com/javajosh/simpatico/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/javajosh/simpatico?style=flat-square"/></a>
</p>

<p align="center">
  <a href="https://simpatico.io/">VPS deployable</a> - <a href="#running-locally">Running Locally</a> - <a href="#experiments">Experiments</a>
</p>

<br>
Use a simple text editor you already know and a browser plus a single simple server process to create simple, literate programs that execute immediately in the browser. Minimalist, privacy respecting, readable and short source code. No front-end build!
<br>


## Features

* <b>Offline development</b>
  * Have a codepen/observablehq/jsfiddle-like experience without being connected to the internet.
  * Use the text editor that you're comfortable with.
  * Use local source-code control
  * Have full control over the html, including head content.
  * Debug one top-level context rather than an embedded iframe context.
  * Speed up your build-test-debug (BTD) loop by eliminating the front-end build. No webpack, grunt, or anything else!

* <b>Publish</b>
  * Publish your work in a way that protects your users. No cookies. No 3rd party resources are permitted.
  * The Reflector server is very small in terms of source (450LOC total), dependencies (only 3 and they have no transitive dependencies).
  * The Reflector server at simpatico.io takes 200MB of RAM and can handle 10k requests-per-second on a $5 VPS.
  * Extremely fast, single process operation. TLS terminates in node, nginx proxy is not needed.


## Experiments

These are sample experiments users have created that show how Simpatico works. Feel free to fork them and start experimenting yourself.

1. [`core`](https://simpatico.io/core). Very generic, convenience functions that smooth over the JavaScript runtime.
   Of particular importance is the definition of a comprehensive set of predicates/assertions.
   Nothing in this module is specific to Simpatico, although it is a good example of my preferred style of ES6 programming -> functional and minimal.
2. [`combine`](https://simpatico.io/combine2). The function used to produce a new state from a previous state plus an input.
   `combine()` is a generalization of `Object.assign()` and previously published as [combine-keys](https://github.com/javajosh/combine-keys).
   Defines handler invocation and the message cascade.
3. [`stree`](https://simpatico.io/stree). A data structure that organizes inputs into chains that result in different, related states.
   Unifies previous distinct concepts like instantiation vs inheritance.
   Provides natural "collections" support.
4. [`friendly`](https://simpatico.io/friendly). A very simple runtime type system, accessed through `validate()`, that helps functions help their callers call them correctly.
5. [`svg`](https://simpatico.io/svg) SVG and SVG animation using only very small primitives. Visually interesting!

More detail about each module is available in the test harness `html` file, and the module source code itself.


## Running Locally

1. Install a recent version of [NodeJS](https://nodejs.org/en/download/current) (See [nvm](https://github.com/nvm-sh/nvm), the best way to install [node](https://nodejs.org) with `$ nvm install 20 && nvm use 20`)
2. Clone this repository: `git clone https://github.com/javajosh/simpatico`
3. Install the dependencies: `cd simpatico && npm install`
4. (Optional) generate self-signed certificate to run local TLS
5. Run the reflector `npm start`
6. Navigate to [http://localhost:8080](http://localhost:8080)

See [notes](/notes/simpatico.md) for more information.

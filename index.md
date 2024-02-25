# A Wev Server for Idealists
Self-hosted, privacy preserving, minimalist approach to writing code.
No front-end build, no frameworks.
Support a very fast *and* minimalist build-test-debug cycle
[Literate Markdown](lit.md).

Web development can be a pleasure again with no front-end builds or complex servers.
Reconnect with the roots of web-development by programming the browser on its own terms.

Write code like this in markdown, and have it run in the page, and signal you when it breaks:

```js
const a = {a: 1};
const b = {b: 2};

is.hasProp(a, 'a');
as.hasProp(a, 'a');
assert(c.hasProp(a, 'a'))
assert(!c.hasProp(a, 'b'))
```

## Installation
Install the server (see the [readme](readme.md) for more details):
  1. Install a recent version of [NodeJS](https://nodejs.org/en/download/current) (See [nvm](https://github.com/nvm-sh/nvm): the best way to install [node](https://nodejs.org) with `$ nvm install 20 && nvm use 20`)
  2. Clone this repository: `git clone https://github.com/javajosh/simpatico`
  3. Install the dependencies: `cd simpatico && npm install`
  4. Usen OpenSSL to generate a self-signed certificate to run local TLS (see [devops/deploy.sh](devops/deploy.sh#generateSelfSignedCert))
  5. Run the reflector `node reflector.js`
  6. Navigate to [https://localhost:8080](https://localhost:8080)

## Features
The server is called the [reflector](reflector.md), and features:
  1. No cookie support.
  2. No 3rd party content, because they ALL violate your users privacy.
  3. File-watching, in memory cache of all content.
  3. Aggressive client-caching headers are standard for all resources.
  3. Cache-busting sub-resource URLs (*coming soon*).
  3. Support for URLs with or without file extension.
  4. A *single process* and (almost) a single file, 500-line node program.
  5. Support for [automatic Let's Encrypt TLS certificate renewal](/devops/certbot.md).
  5. Terminates TLS natively - no need for a proxy.
  6. Supports dropping privileges to the user of your choice, all in node.
  6. Extensive script support for [deploying](/devops/deploy.sh) and [running](/devops/lib.sh) your own instance].
  7. Native Markdown. Not just markdown, but literate markdown that gives you common headers and runs your code (and is Github compatible).
  8. Minimal, and minimal dependencies.
  9. Fast. Cold start in 90ms. Most resources served in 10ms.
  10. All code is modern, ES6+ using ES modules `import` instead of CommonJS `require()`.
  11. Websocket support for [chat](chat.md).
  11. Logs are not stored, only printed to stdout.
  12. MIT licensed

## Requirements:
  1. Node 17+
  2. Openssh to generate your local tls certs.

## Limitations:
  1. Not released to `npm`/`npx` - you need to clone and modify. *Coming soon*.
  2. There is a lot of content that is currently irrelevant and needs to be moved/removed. *Coming soon*.
  3. Currently no [docker](kata/docker.md) support. *Coming Soon*.

## Compare with:
  1. [Caddy](https://caddyserver.com/), [Nginx](https://nginx.org/), [redbean](https://redbean.dev/). Minimalist, fast web-servers with lots of features.
  2. [Codepen](https://codepen.io/), [Observable](https://observablehq.com/), [jupyter](https://jupyter.org/). Simpatico serves a similar role as a notebook application, but it's browser focused, locally hosted, and easy to deploy to the public internet.


# Building Applications
[Literate Markdown](lit.md) serves as the basis of fast, minimalist content creation.
Use this, in combination with the assertion library in [core](core.md) and the functions in [testable](testable.js), as the foundation of a simple but powerful test harness.
Combine all the tests in a single place, [acceptance](acceptance.md), for a "go"/"no go" deployment decision.

An important application, currently in development, is [Chat](chat.md): the basis for a privacy-preserving E2EE structured-chat platform. *Coming soon*.

## Explore and exercise Browser APIs
Explore [svg authoring and animation](svg.md), and [subtle.crypto](crypto.md) for browser-native PKI.

Wrap a client-side [websocket](websocket.md) in an [stree](stree.md).

## Write new libraries
   - Write [core](core.md), a pure js library that defines comprehensive predicates and assertions.
   - Write [friendly](friendly.md), a 200-line runtime-type checker, comparable to [Zod](https://zod.dev/) but it is pure javascript.
   - Write [combine](combine.md), a generalization of `Object.assign()` that is a smaller, less verbose [Redux](https://redux.js.org/).
   - Write [stree](stree.md), a generalization of a trie-structure over arbitrary objects. Visualize it and use it to model a [websocket](websocket.md), for use in [chat](chat.md).

## Deeply enjoy a fast *and* minimalist build-test-debug cycle

[Example video]

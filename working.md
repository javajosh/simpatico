Simpatico
=========

jbr *2023*

*Site status:* unreleased tech demo. Non-technical, non-learner users
will find very little to interest them, currently. Advanced technical
users will be interested in the [github
code](https://github.com/javajosh/simpatico). One way to go from one to
the other is to read [Eloquent
JavaScript](https://eloquentjavascript.net/) and do the exercises.

In other words, this site is [under
construction](http://textfiles.com/underconstruction/)

Interesting resources
---------------------

1.  [Acceptance tests](/acceptance) iframe + testable.

1.  [kata](/kata/) many exercises, performed in a dojo.
    1.  [bootstrap](/kata/bootstrap/index.html) Material design bootstrap
    1.  [angular](/kata/angular) SPA TypeScript, RxJs, Redux,  Material Design,angular 16 signals
    2.  [rxjs](/kata/rxjs/rxjs.md) JS ReactiveX observables
    3.  [htmx](/kata/htmx) [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) JS library that uses HTML attributes to control ajax in the HATEOAS pattern. See also [grug brained developer](https://grugbrain.dev/)
    4.  [mermaid](/kata/mermaid.html) diagramming in markdown.
    5.  [d3](/kata/d3) exercise d3 js svg dataviz library.

# Labs
1. [Literate Markdown (litmd) and authoring standard](/lit) minimalist litmd literate programming for browsers. Used to produce the rest of these experiments.
1. [SVG authoring and lib](/svg). Exploring ways to animate SVG with JS with minimal code and no dependencies.
1. [Chat](/chat) exercising browser websockets api; primordial chat client
1. [stree()](/stree3) a functional approach to the n-ary tree.
1. [combine()](/combine2) just the timeline features, with less code. Working on caching.
1. [site proximity coherence](/kata/proximity-coherence) Many solutions exist to keep a site made of unique resources looking coherent.
   This is a fully client-side approach using javascript and resource layout conventions.
1. [HTML authoring](/kata/html.html)
1. [Friendly Functions](/friendly) a simple runtime type system
1. [Browser cryptology](/crypto) exercising browser crypto api
1. [SQLite in the browser](/db/) 400KB WASM build of SQL Lite running fully in the browser
1. [Simpatico](/notes/simpatico) An overview of simpatico\'s parts, most of which are represented here.

1. [Core](/core) Utilities, predicates, types
1. [Reflector](/reflector)Simpatico\'s server-side component, based on node
1. [word processor](/wp)

Gadgets around the web
----------------------

1.  [saharan\'s browser physics art](https://oimo.io/works)
2.  [Fabrice Bellard
    jslinux](https://bellard.org/jslinux/vm.html?url=alpine-x86.cfg&mem=192)
3.  [Svelte\'s tutorial](https://svelte.dev/tutorial) and also
    [philosophy](https://svelte.dev/blog/frameworks-without-the-framework)
4.  [Codepen.io](https://codepen.io/) Lots of great gadgets on this site
5.  [Val Town, codepen for the
    backend](https://blog.val.town/blog/migrating-from-supabase)
6.  [Signal
    analyzer](https://cprimozic.net/blog/building-a-signal-analyzer-with-modern-web-tech/)

Recently Interesting Views
--------------------------

1.  [The future of
    applications](https://mikecann.co.uk/posts/the-future-of-applications)
2.  [No code is no
    good](https://jaylittle.com/post/view/2023/4/low-code-software-development-is-a-lie)
3.  [Clocks in distributed
    systems](https://www.exhypothesi.com/clocks-and-causality/)

Unneeded complexity
-------------------

Simpatico\'s design solves many problems at the root, by not using
problematic technology in the first place. This is a list of mitigations
that *we don\'t need*

1.  [Interaction to Next Paint (INP)](https://web.dev/inp/) - A new
    metrics API to measure how slow a page is. Simpatico obviates this
    by not being huge, and having miniamlist libraries.

Similar things
--------------

1.  [nbdev](https://nbdev.fast.ai/) a jupyter distribution with some
    added value. Similar in goal to [literate markdown](lit.md)

todo
----

1.  reflector: cache invalidation not working. the server cache updates,
    but the browser doesn\'t. header issue?
2.  reflector: improve no-extension handling. allow md or html
3.  reflector: complete headless chrome functional test framework
4.  reflector: serve another domain, like javajosh.com. add virtual
    hosts.
5.  reflector: extract into an npm module
6.  npm & git: create new org for published modules
7.  general: cleanup notes to be more professional
8.  html: build a good looking landing page.
9.  angular: experiment with including global resource and see if that
    gets bundled.
10. angular: build a good looking UI

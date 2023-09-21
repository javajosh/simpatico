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
2.  [Chat](/chat) exercising browser websockets api; primordial chat
    client
3.  [stree3()](/stree3) a functional approach to the n-ary tree.
4.  [stree2()](/stree2) using arrays instead of an n-ary tree.
5.  [combine2()](/combine2) just the timeline features, with less code.
    Working on caching.
6.  [kata](/kata/) many exercises, performed in a dojo.
    1.  [bootstrap](/kata/bootstrap/index.html) Material design bootstrap
    1.  [angular](/kata/angular) a complex SPA library that includes
        TypeScript, RxJs, Redux, and Material Design (and angular 16
        signals)
    2.  [rxjs](/kata/rxjs/rxjs.md) focus on observable reactive
        programming with rxjs
    3.  [htmx](/kata/htmx) an interesting js library that uses html
        attributes to control ajax in the HATEOAS pattern.
    4.  [mermaid](/kata/mermaid.html) a diagramming library.
    5.  [d3](/kata/d3) d3 svg dataviz library.
    6.  [site proximity coherence](/kata/proximity-coherence) a classic
        webapp problem, with a new twist.
    7.  [HTML authoring](/kata/html.html)
7.  [Literate Markdown (litmd) and authoring standard](/lit) minimalist
    litmd literate programming for browsers.
8.  [Friendly Functions](/friendly) a simple runtime type system
9.  [Browser cryptology](/crypto) exercising browser crypto api
10. [SQLite in the browser](/db/) 400kb WASM
11. [Simpatico](/notes/simpatico) An overview of simpatico\'s parts,
    most of which are represented here.
12. [SVG authoring and lib](/svg)
13. [Core](/core) Utilities, predicates, types
14. [Reflector](/reflector)Simpatico\'s server-side component, based on
    node
15. [word processor](/wp)

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

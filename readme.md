# Simpatico

[@javajosh](https://twitter.com/javajosh), 28 June 2020

## Overview

**Status**: prototype. This repository is currently a mess; but most of the ideas are in `simpatico.js` and in a form
that is easily interacted with at the REPL.

Simpatico in its current form is a prototype exploring three areas of application development. First, the idea that
software can be expressed as a combination of inputs, embodied by the `combine()` function. Second, the idea that
software's superpower is the ability to copy even the most intricate state perfectly, leading to the Rehman Tree,
or `rtree`, which is a representation of many related states, or worldlines, such that the tip of each one is a coherent
application state. Finally, the idea of the "Friendly Function", which is a function that helps the caller understand
how to call it. This is achieved primarily with the (poorly named) `validate()` function, which does pattern checking on
objects, returning the parts of the pattern that failed to pass. In this way, we see that a program's
degrees-of-freedom (or DoF, a concept borrowed from physics) is the sum total of the programs patterns at any point in
time.

## Usage

This repository is all about the front-end code, but you will need a way to serve it.
(Sadly loading from file URLs doesn't work, although it really should.)

```shell
git clone
npm install
npm run serve
```

The result is that you have something running that responds to localhost:8080, and from there you can explore the rep
directly. There are two files per module, the javascript module itself and an html file that tests that module. A good
place to start is the [core](core.html) file, for example. All the test html resources are linked from index.html.

Note that there is no front-end build, and there is nothing special at all about this server. You could use
python's `python3 -m http.server` for example, or any other method you like (
see [MDN's article on setting up a testing server](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server)
.)

### Test harness
Each html file is a stand-alone test harness for a module using a minimalist script called "testable" that traps for
errors and sets the background and favicon to red on failure, green on success. The idea being that you can have all your
modules loaded as tabs in the same browser and see them blink on or off as you break/fix things. This is also why
the html files automatically refresh every 2s by default, so that you will know.

A nice trick on most operating systems is the ability to "open" or "start" files with GLOBS, so you could easily open all
html files in simpatico in your browser, if file URLs were supported. So you have to open them and bookmark the lot.

## Applications

This way of seeing values and their relationship to *process* and *time* is key to coherent thinking about software. In
a sense, it's this way of thinking that I hope will be the lasting achievement.

There are some very interesting applications. I believe the Simpatico method lends itself well to modeling both the chat
problem, and what we would consider "ordinary applications", in a consistent way, and so can support (mostly) common
applications.

An exotic (but interesting and potentially quite useful) application is the *monomorphic* browser application, where a
browser-type process serves as both the client and server. The "server" itself becomes simply a dumb router, essentially
reifying the internet itself. This is in contrast to "isomorphic" applications who's requirement is the same language on
the client and server (JavaScript on Client (browser) JavaScript on Server (node)) - a monomorphic javascript
application uses the browser as the basis of the server, too - so just (JavaScript on Client). This style of application
I like to call "Structured Chat", in reference to the fact that, I believe, all modern computer applications can be
characterized as a particular reduction over the lifetime of chat messages between two identities (which in my mind is
best represented as a public key).

# Challenges

There are, of course, some challenges, particularly in the area of persistence. LocalStorage is under attack by browser
vendors, who would prefer to treat it as ephemeral. And yet Simpatico requires something persistent in the browser, and
would like to avoid the hoops that Tiddlywiki, for example, has to jump through to enable saving and backups. Other
solutions to this problem abound, from the relatively heavy-weight Electron (which replaces the browser entirely) to the
middling weight Joplin (which runs a daemon plus a browser plugin that calls into that daemon).

## Related technology

Although my `combine()` function predates it, I believe it is an example of what Rich Hickey has called
a ["transducer"](https://www.youtube.com/watch?v=6mTbuzafcII), which is a reducer that itself changes over the
reduction. Rich is also an inspiration when it comes to going off on your own and doing something you really believe in,
which he has done by inventing the lovely [Clojure](https://clojure.org) language - a dynamic, immutable deeply
functional language written for the JVM.

It also predates my experience with [Dan Abramov's](https://twitter.com/dan_abramov)
excellent [Redux](https://redux.js.org/) library, and I think the rtree competes directly, and favorably, with Redux. In
particular, I think the combine() function has a more elegant story about how to define reducers, and eliminates the
need for actions entirely.

You'll see a lot of work with SVG within this repository, and that's in large part thanks to the inspiration
of [Mike Bostock's](https://bost.ocks.org/mike/) excellent [D3](https://d3js.org/) library. He really opened my eyes to
the power of native browser technology in general, and SVG in particular (although it is quite a heavy language, really,
unless you start to confine yourself to a subset of features, and using them with discipline!).

I first started programming on with Logo on the Apple IIe back in the 80's, and I only found out recently about it's
inventor, [Seymour Papert](https://en.wikipedia.org/wiki/Seymour_Papert) thanks
to [Bret Victor's](http://worrydream.com/) excellent talks (
particularly [Inventing On Principle](http://worrydream.com/#!/InventingOnPrinciple)) about software and it's
relationship to human minds. This encouraged me to not give into the status quo, and also courage to believe that
there's something deeper to discover here. And indeed, I think we are only at the beginning of the computer revolution.

At first, I wasn't so sure about JavaScript, but over time I've really come to enjoy the language itself, particular in
it's ES6 form, and in particular object literals and pure functions. Simpatico itself makes heavy use of these elements,
and deemphasises elements of the language I do not like, in particular any of the class stuff, new, or this. Lore has it
that JS was made by [Brandon Eich](https://en.wikipedia.org/wiki/Brendan_Eich) at Netscape in about a week, but it
really has some good ideas. Thanks to [Doug Crockford](https://en.wikipedia.org/wiki/Douglas_Crockford) for
inventing [JSON](https://www.json.org/json-en.html), noting that its okay to acknowledge that a thing
has [some good parts](https://www.alibris.com/JavaScript-The-Good-Parts-The-Good-Parts-Douglas-Crockford/book/39532121?matches=7)
and some bad ones, and also actually [using web native modules in some real code](https://jslint.com/).

## Possibilties

These are the primary components of what I hope to be a revolutionary software development environment, where software
is built in the same way the software is used, collaboratively, through the web (TTW). While it's heartening to me to
see TTW technologies explode, for the most part they are recapitulating traditional software methods. Codepen.io for
example is still quite code oriented, as are most of these environments. Simpatico is an attempt to "go with the grain"
of the web, and do something really different.

I think it's likely that Simpatico can support 100k simultaneous users on relatively modest machines, a number
approaching 1 if you ignore backups. Perhaps more, depending on the nature of the application. By nature, Simpatico
applications are high availability, as the build-test-deploy cycle is integrated with the runtime itself. Applications *
always* incrementally update, which obviates the need for separate, expensive and error prone devops software.

The goal is to build small teams of 4 people or so that can build a working application that meets the needs of all
stakeholders in close to real time. The value here would be immense; venture capitalists could test a lot more ideas a
lot faster, for example. Only those ideas that are successful need to get the bespoke treatment required to scale above
1 server, and I imagine as time goes on the knowledge of how to scale a Simpatico application up will grow, and it will
become easier. But the fact that Simpatico encourages a "ship in a bottle" approach to application design (that is, to
model your problem "in the small" and then "render it out") gives you a much better chance of succeeding even in that.

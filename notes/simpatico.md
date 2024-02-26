# Simpatico Thoughts

We can and should consider different data-structures, particularly shared data-structures that have
demonstrable value. Marketplaces. Social media platforms. We can think of a simple static site, which
is itself a sophisticated data-structure (a tree with every node itself a tree, but of a very different sort).
This is the file-system and it is HTML and while we have a fondness for static content, the fact is
that some see this as a lost opportunity for profit. It is possible to extract value from
consumers in a wide variety of ways.

A handler is a lovely object that is ultimately a function with some improvements. It has a string
name, and it's a pure function that takes an object, a context (or residue), and returns a list of objects.
By convention, if you call it with no arguments or incomplete arguments, it will return a
representation of validity with some fields being collapsed from pattern to value.

A string is the most general value, and the pattern is a list of predicates that monotonically
reduce the possible strings. JSON and scalar representations, all in strings.

Strive to express your application in text first. Model the domain in text, and get a feel for
the operations it must support. Operations, in Simpatico, are represented by Handlers. The
game in Simpatico is to define a useful World Event Tree; the programmer focuses on the Handlers
the users focus on steady state input.

Start with a root node representing the running application. The root node is a singleton object
that has an internal structure to support Handlers, Observers, and State, and that has enough of
these objects to produce a result. Handlers and state are related because state is mutated
during handler resolution (message cascade). Handlers can initialize the state they need.

The simplest representation is as a message list that, in a way that can most neatly expressed as a series
of reductions, produce a tree of residue

See [lehman's laws](https://bartwullems.blogspot.com/2023/05/lehmans-laws-of-software-evolution.html) for the post that inspired this note.

Also related is [what drives productivity](https://queue.acm.org/detail.cfm?id=3595878), but I particularly focus on fast feedback loops (which I call the BTD, build-test-debug, loop). Simpatico is extremely fast, which makes it pleasant to work on. There is also the issue of [design and code reviews](https://philip.greenspun.com/software/design-review).

Here are Lehman's Laws:

  1. software systems must evolve or they will become progressively less useful
  1. the complexity of software systems will increase over time unless they are actively reduced
  1. software systems are subject to feedback loops
  1. software systems are subject to both incremental and radical change
  1. software evolution is constrained by organizational stability and the ability of developers to understand the system
  1. the evolution of a software system is limited by its architecture


5th law note. the [stree](./stree2.md) offers insight into the difference between radical and incremental change. Changing the base of a tree, requiring "rerunning input", is radical. Adding the tree is incremental.

6th law note. Cognitive overhead is a problem, and I think the solution is "high g" environments that discourages deep causal chains. The javascript ecosystem is low g, and this has led to a cambrian explosion of tools and libraries, giant stacks of tools on which applications teeter. Simpatico is "high g" because it is very "close to the metal" of the browser, using mostly native js and DOM apis, and combinations happen late and reluctantly, and in the simplest possible way.



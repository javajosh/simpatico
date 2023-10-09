See [maximalism](./maximalism.md)

# Inspiration
  1. [The Architecture of Open Source Applications] 500 line programs (https://aosabook.org/en/index.html#500lines)
  1. [Choose Boring Technology](https://mcfunley.com/choose-boring-technology)
  1. [Minifesto](http://minifesto.org/)
  1. [Where have all the hackers gone?](https://morepablo.com/2023/05/where-have-all-the-hackers-gone.html) - soil, surface, atmosphere

# Thoughts

Not all change is equal.
Some change requires that you recapitulate the whole project.
For example, using markdown instead of html forces simpatico to use the reflector.
This means it's no longer possible to really use the project with a generic web server.
It also means that I rarely use raw HTML, which makes me kind of sad.
Heck, I even hid the code sections in "details" because even I was tired of looking at it.
And I realized that people won't care about your code until they are convinced its worth looking at.
(One way to mitigate this is to turn the reflector into a "static site generator").

I certainly have many innovation tokens!

  1. A new way to write websites (litmd)
  1. A new way to model data (stree)
  1. A new way to model change (combine)
  1. A new way to think about software (durable process)
  1. A new architectural pattern (monomorphic javascript)
  1. A new server (reflector)
  1. A 'new' minimalist deployment process (devops)
  1. A new company. (simpaticorp)

However its tenable because I've thrown out a LOT of complexity.

  1. No front-end build.
  1. No back-end build.
  1. No docker-compose
  1. No ORM
  1. No cluster
  1. No message queue
  1. No CDN
  1. No analytics.
  1. No logging
  1. No transpiled languages.
  1. No huge dependencies.

# TLS
TLS added a great deal of complexity, both to the code and to the operation of the site.
However it is worth it. The reason being that I will not put my users at risk.

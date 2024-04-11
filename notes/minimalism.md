See [maximalism](./maximalism.md)

# Inspiration
  1. [The Architecture of Open Source Applications](https://aosabook.org/en/index.html#500lines)
  1. [Choose Boring Technology](https://mcfunley.com/choose-boring-technology)
  1. [Minifesto](http://minifesto.org/)
  1. [Where have all the hackers gone?](https://morepablo.com/2023/05/where-have-all-the-hackers-gone.html) - soil, surface, atmosphere
  1. [How web bloat impacts users with slow devices](https://danluu.com/slow-device/)

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

# Distributed systems
Characterize workloads as the ratio of job/machines, J. There are 3 cases:
  1. J < 1. The jobs are small, one machine runs many of them.
  2. J = 1. Each job runs on one machine.
  3. J > 1. The jobs are large and run on multiple machines.

As machines grow, the J < 1 case becomes more common.
The J = 1 case is a sweet spot for developers, and many tools (containers and virtualization) simulate this even when J < 1.
The J > 1 case is in reality rare, limited to big data/big compute jobs like rendering, training LLM models, and processing large amounts of data.

Today the most common system design for ordinary webapps is a hybrid of 1 and 3.
Individual jobs are a tiny single request/response pair, J << 1, but the jobs are partitioned between app, database, proxy, cache and queue servers and remote API servers.
This design was required when the app server is CPU- or memory-bound, which was the case historically with OS process-bound CGI, or CPU thread-bound (Java) threads.
This solution introduces the drawbacks of 3: network IO bottlenecks, general distributed failure modes, RPC failure modes, and orchestration/configuration complexity.
The idempotent, stateless app server model is generally well-behaved under load and scalable, but by its nature requires a great deal of wasteful network data access.

The community of distributed application practitioners have been moving toward a consensus ideal state, represented roughly by k8s running docker processes orchestrated via k8s on cloud hardware.
This solution has many advantages to cloud companies, as this general architecture promotes process isolation and managed specialization, which are powerful value-adds.
The overall approach tends to architecture lock-in, vendor lock-in, and over-buying of compute resources at premium prices.
There is a positive feedback loop in that the community learns and solves specific trade-offs with specific technology combinations, making it risky to try other architectures, or move to other cloud vendors.
Many members of the community, unfamiliar with the history or the elements of this architectural pattern come under the impression that there is no reasonable alternative.

Part of empowering the individual is allowing them to make software as independently as possible.
This means being able to code offline. (This eliminates all web-based IDEs, and all cloud targets that aren't locally runnable.)
This means being able to deploy to COTS hardware, locally or remotely. (This eliminates the use of specialized cloud services.)

Another part of empowering the individual is making the development cycle pleasurable, and giving agency to the programmer.
The trend toward distributed systems harms this agency, since you now do not run most of your code, and are at the mercy of other, central interests.
The pleasure of developing and deploying working software is harmed by requiring complex deployment steps.
Automation via CI/CD attempts to manage this complexity, but often becomes a source of complexity and problems in itself. (Mitigating this is that Jenkins has come to be replaced by standard repository CI/CD which is quite good.)

This dovetails with another popular trend that harms dev efficacy and flow, complex and slow builds.
With back-end builds, devs are considered lucky if it only takes 30 seconds to build and start an app server, and often takes minutes and a great deal of data over the network.
Front-end builds are notoriously slow and complex. They also have the side effect of harming the usability of the web, for both users and devs.

## Thesis
Both devs and users are best served by the J < 1 case on a single machine.
I estimate that one can easily serve 100k active users on one physical machine, perhaps 1M in some cases.
Devs efficacy is enhanced by a fast BTD loop and the ability to go deep instead of wide into their tools.
The major downside is going against the community, and implementing a solution that has little support.
Mitigating this is that by focusing on deep knowledge of a small number of tools, one can find solutions in your own problem space, and reproduce problems more easily when you cannot.
Another major downside is that one machine may fail, physically.
Mitigating this is to add a hot backup machine, using database logical replication and a proxy failover.
Another downside is lack of geographical distribution. I don't think this is an issue for 99% of products.


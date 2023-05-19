Just as science is not a body of knowledge but rather [a way of thinking](https://www.youtube.com/watch?v=J1cNaFG1VII), so too software design and production methods.

"Computer science" is distinct from "software engineering". In terms of authors, it's [Knuth](https://www-cs-faculty.stanford.edu/~knuth/taocp.html) vs [Fowler](https://www.martinfowler.com/articles/enterprisePatterns.html). The difference is a little like that between chemistry and biology. In practice Knuth is read by library authors implementing languages, and standard library authors turning algorithms into tools and libraries. Fowler is read by application programmers who are combining many tools and libraries into an "application" that serves human needs. The problem space is similiar but not the same. In particular, the application programmer must deal with a great deal more uncertainty, relying heavily on abstraction, wheras the lang/lib programmer's knowledge is far more precise (but also smaller in reach and value that is harder to gather into applications.)

## Diagramming tools
  1. [Google Slides](https://slides.google.com) Very handy simple tools for making vector art, hosted and sharable. Hard to lose and easy to share. But also proprietary online only. I find it very easy to use.
  2. [Inkscape](https://inkscape.org/) Old and very open-source general vector drawing tool. I find it difficult to use.
  3. [Visio](https://www.microsoft.com/en-us/microsoft-365/visio/flowchart-software)
  4. [Lucid Chart](https://www.lucidchart.com/pages/) SaaS with free tier.
  5. [Figma](https://www.figma.com/) more of a prototyping tool. SaaS with free tier.
  6. [Mermaid](https://mermaid.js.org/) also [local mermaid](/kata/mermaid.html) plain-text diagramming rendered specially in markdown on github. Javascript, self-hosted. But you don't have low-level control (this is often acceptable). Native support on Gitlab and Github.
  7. [Omnigraffle](https://www.omnigroup.com/omnigraffle) Mac only, offline, proprietary. I used to use this alot.
  8. [svg](./svg) Hand-built SVG.

Sagan said, speaking of a high-tech society in general, "Ignorance and power is a potent combination that will blow up in our faces". Software is a field that sees this over and over again. In fact, I am guilty of it *right now*. Your computer, in order to be *yours*, must be completely inspectable and mutable. But I would fail at even the most basic test of my knowledge, about the list of processes currently running and the network connections they maintain to the outside world, and what data is sent across them. It's easy to see that this list should be small - but where does the pressure come from to keep it small? For years it was a practical matter of hording precious and expensive resources like RAM and network bandwidth. But once those pressures eased, we stopped worrying about it. We forgot the *other*, more profound reason to control our devices.

If even software professionals are mostly ignorant of the state of their tools, how far away from real understanding and control are laymen? If the only motivation to learn more is a sense of "duty" it will not, in general, scale. (Well, one could construct a guild that requires its members to swear to uphold this duty )

# Understanding systems
One can draw a basic "architectural" diagram of a system, which indicates the major data-flows of the system.
However this is often done in an ad hoc manner, which misses an opportunity.
You don't need to

# Sharing

Should you share your methods?
No, not until you are successful in deploying them.

I've attempted to

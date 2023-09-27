# Structure

There is great joy to be had in both structured and unstructured programming.
With structure, correctly used, you can achieve a great deal over a longer period of time.
Why, then, would you ever attempt to work in a less structured environment?

There are two reasons. First, because it's fun. It satisfies a deep desire artisan's share to *play* within the
confines of our art.
Second, because we might discover something new, as-yet-unseen, and it might be useful to others.
It's the difference between steady iteration and an abrupt transient that leads to novel solutions.

The two do not exist in isolation.
The lessons learned from highly structured programming apply.
Structured programming shapes ones opinions and knowledge about trade-offs.
The unstructured work is characterized by the hope of changing those trade-offs.

My career has moved between these two modes.
The unstructured work has been a compulsion; the structured work has felt like an obligation at times.
However, the structured work does more than just provide a paycheck!
It provides practice and wisdom.

# What is a software application?

It is distinct from computer science.
It is a superset of computer science, encompassing every solution to the boundary-value problem inherent in configuring a collection of connected screens.

One superficial objection to this characterization is that many computers don't have screens.
We call such computers "servers" but they have other names. "Appliances", "routers", and all manner of screen-less devices.
But ultimately these machines do indeed have an impact on screens, albeit indirectly.

Within this boundary exist both structured and unstructured activities.
Structure often has an economic or social motivation.
Structure gives us the tools to designate an outcome, to imagine it, and then make it real.
Unstructured work tends to not do this, or to do it in smaller steps, instead letting the system grow and change more organically.
The outcome of unstructured work is driven by intuition, emotion, and aesthetics, and the outcome is often a surprise.
In contrast, structured projects seek to minimize surprise, also known as reducing risk.

From both a historical and a technical viewpoint, it makes sense to examine the nature of software starting small and moving our way up.
Each screen is associated with a machine with a CPU, memory, and persistent storage.
Over time humans have settled on conventions that define  a "kernel" that manages "processes".
These processes start, do computations, have side-effects, and stop.
The kernel is what allows processes to function simultaneously.

Identifying further subdivisions go in and out of favor by way of pattern languages.
The underlying language, the artifact that a human produces that describes the behavior of a process, sometimes dictates which patterns are available and which work well under which circumstances.
I will define a process as a reactive entity that does nothing without input.
When input arrives, the process reacts to it and changes state.
Over time a process reacts deterministically to its input.

The core of computer science is the exploration of relatively low-level algorithms and data-structures which are important building blocks of software.
However, over time another emergent phenomena eclipses this in importance, and that is control over the causal chain.
A causal chain is a sequence of events that occur both within a process and between processes with the network of connected screens.
This chain is characterized by the protocols that describe messages passing between processes.
HTTP is a very important protocol. But in this definition, browser DOM events are a protocol, too, which collect physical measurement into a process.
SQL over a local network connection is another kind of specialized protocols.
The number of protocols in existence is quite large, subject to all kinds of pressure, technological, social and economic.

# Tools
Certain patterns and tools have become so ingrained they feel universal, but they are not.
The concept of "file" and "command line" and "daemon" and "socket" have become ubiquitous, but they are arbitrary.
In fact, although the boundaries are often hazy, these define a *coordinate system* in which humans *think* about software.
A particularly important coordinate system is *language*.
Humans have designed many, many languages and modern systems use many of these.
Interfacing between these languages is a coordinate transformation, often mediated by a protocol.
Some of these interfaces are more famous than others - for example, the famous "object relational impedance mismatch" identified early in enterprise java's lifetime (the early 2000's).

Another important class of tools are *editors*.
These are user interactive programs we use to make programs.
There are probably not more intensely used, scrutinized and modified programs on the planet, since programmers use them and have the capability to modify them.
However, in the end they let us define new languages and help us speak them without flaw.
They are themselves *applications* in the sense that they exist in close proximity to the user and device.

Modularity: Packages, containers (reseting the coordinates; known good state), virtualization.
Modularity: functions, libraries, components, patterns like MVC.




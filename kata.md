# Kata: provable competency

I learned of *kata* from Karate class when I was a child.
They are sequences of body moves you execute, correctly.
If executed correctly, you progress, indicated by belt color.
The dojo asserted an invariant: belt N means you can do *katas* 1-N.

As described, *kata* do not differ from learning a dance routine.
And *kata* is like dance.
One important distinction is that you dance for pleasure, yours and others.
But you do kata of this sort for achievement, recognition, and in theory, better survival.
Mentally you are simulating battle with an opponent who's not there.
So even if the kata is stylized and an art form, the soul of it is battle.
This, in turn, informs the energy of your movement.
A dancer kicks in a slow, wide arc to confer a feeling of lightness, and elegance.
A fighter kicks to maximize speed, power, ferocity, to cause as much damage, now, as you can to your opponent.
The fighter is in a life-threatening situation.
There are the notions of "hit" and "follow-through" and even "chi".
It is the thought, in addition to the motion, that characterizes a *kata*.

## Browser Kata, Browser Dojo

A small complication is that everyone makes their own dojo.
Your dojo is primarily you, your computer, and your physical surroundings.
Your physical browser kata movements will be looking, typing, and clicking.
Your mental browser kata movements will be moving through a mental map of your software and project files.
This is the operating system, configuration, tools, applications, and file structure in which you will operate.
One good thing to practice, even for a stage 1 dojo, is to be certain about the location of your device, your browser, tools, and *files* on that device.
This clarity and simplicity is surprisingly hard to attain - one must work to simplify, disconnect, and tame a modern computer to be quiet and well-behaved. You can achieve this, in order of preference:

  1. dedicated device.
  1. dedicated virtual machine.
  1. container (or set of containers).
  1. dedicated project
  1. dedicated module
  1. dedicated folder

My 'Simpatico dojo' as a "dedicated module" on two devices and one server with (public) github backup and my experience is dominated by intellij manipulating `html` and `js` files.
`md` files like this one

Much of this repo is currently (Feb, 2023) 'browser kata' that I have done for myself.
Each browser kata is a short, self-contained html file with minimal sub-resources.
Each kata should be executable with the smallest possible requirements. In order of preference:

  1. Browser loads kata.html as a file url.
     The basics. Limited API access, nothing network or security related.
    2. Run a simple, generic http server e.g. `python http server` and load http://localhost:8080/kata.html.
     Adds network related APIs; omits websockets and security still.
  3. Run a custom, local http server `npm start`: http://localhost:8080/kata.html,  ws://localhost.
     Adds websockets; security is still omitted.
  4. Run a custom server as 3, and add hostname to `/etc/hosts`:  [http://simpatico.local:8080/kata.html],  [ws://simpatico.local:8080]
  5. Run a named custom server as 4, generate a root ca, add ca to local browser, use ca to create a tls key and cert file, and add those files to custom server. [https://simpatico.local:8443/kata.html],  [wss://simpatico.local:8443]
     Complete API access
  6. (Optional) Run as root to bind to a lower power: [https://simpatico.local/kata.html],  [wss://simpatico.local]
     Remove the custom port from the URL
  7. (Optional) Run remotely on a vps with custom domain name and tls from letsencrypt: [https://simpatico.io/kata.html],  [wss://simpatico.io]

Note that these *kata* are building and upgrading the dojo with the guidance of the sensei.
In fact, unless you are already a confident black-belt, do not attempt to go past step 3.
If you want to play with apis that require tls, I suggest that you use [simpatico.io] itself.

## Durability
Durability is important.
If you don't have it, you cannot incrementally improve.
The best durability is local, that you control, on a definite file-system on a physical device in your possession.
A convenient way to maintain a backup of important files, and communicate them, is with git and github or gitlab.
One should not be ashamed of your *kata* in any condition!
Progress is laudable at any speed.
In fact, progress on kata may halt if you've accumulated all the kata you need to becoming a professional fighter.

## Commitment
Commitment can be measured.
If you are committed, then you will be creating space (on your device), time (in a calendar) and budget (tools, supplies, and training).

The best time commitments in order:
  1. daily, rain or shine. Pick an hourly slot. Writing. Working out. Meditation.
  1. weekly. A day slot. kids, movie night, social. "something to look forward to"
  1. monthly. Bills, budget and birthday cards.
  1. one-offs. sampling, novelty, adventure






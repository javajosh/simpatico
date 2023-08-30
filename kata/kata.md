<!--<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="Simpatico, kata">
  <meta name="author" content="jbr">
  <title>Simpatico - Kata</title>

  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='DodgerBlue' />
    </svg>" >
  <link href="/style.css" rel="stylesheet" type="text/css" >
  <link href="/kata/highlight.github-dark.css" rel="stylesheet" >
  <script type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    hljs.registerLanguage('javascript', javascript);
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
      });
    });
  </script>
  <script src="./htmx.js"></script>
</head>-->

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

## Dojo Levels
Much of this repo is currently (Feb, 2023) 'browser kata' that I have done for myself.
Each browser kata is a short, self-contained html file with minimal sub-resources.
Each kata should be executable with the smallest possible requirements. In order of preference:

  1. Browser loads kata.html as a file url.
     The basics. Limited API access, nothing network or security related.
  2. Run a simple, generic http server e.g. `python http server` and load http://localhost:8080/kata.html.
     Adds network related APIs; omits websockets and security.
  3. Run a custom, local http server `npm start`: http://localhost:8080/kata.html,  ws://localhost.
     Adds websockets; security is still omitted.
  4. Run a custom server as 3, and add hostname to `/etc/hosts`:  [http://simpatico.local:8080/kata.html],  [ws://simpatico.local:8080]
  5. Run a named custom server as 4, generate a root ca, add ca to local browser, use ca to create a tls key and cert file, and add those files to custom server.
     [https://simpatico.local:8443/kata.html],  [wss://simpatico.local:8443]
     See [deploy.sh#generateSelfSignedCert](/devops/deploy.sh)
     Complete API access
  6. (Optional) Run as root to bind to a lower port: [https://simpatico.local/kata.html],  [wss://simpatico.local]
     Remove the custom port from the URL
  7. (Optional) Run remotely on a vps with custom domain name and tls from letsencrypt: [https://simpatico.io/kata.html],  [wss://simpatico.io]
  8. (Optional, advanced) Understand how geographically distributed DNS works and design a robust world-wide cluster.
     Requires more understanding of [BGP](https://en.wikipedia.org/wiki/Border_Gateway_Protocol) than I currently have.

All code will run on a level 5 dojo; level 6 is "nice to have"; level 7 & 8 are "strong professional" steps.
[simpatico.io](https://simpatico.io) is a *shared level 7 dojo* that I set up for everyone!
Note that a separate dojo must be formed on every device on which you practice.
If you do not keep your dojos at the same level on all devices then you will be confused.
For example, if you have a desktop with a level 5 dojo, and you have a laptop with a level 3 dojo, you should upgrade the laptop (or downgrade the desktop).

Note that these particular *kata* are about building and upgrading the dojo itself, with the guidance of the sensei.
In fact, unless you are already a confident black-belt, do not attempt to build a dojo above stage 3.
If you want to play with apis that require tls, I suggest that you use [simpatico.io] itself.
Note also that your dojos will need to be created on every device on which you work.
This means desktop and laptop, and (perhaps) your phone and tablet.
(If you cannot build a dojo on the device, do you own it?)

I like this series on CSS from [netuts](https://code.tutsplus.com/tutorials/from-psd-to-html-building-a-set-of-website-designs-step-by-step--net-37).
It is done in a similar "starting with the basics and building up systematically" sort of way.

## Durability
Durability is important.
If you don't have it, you cannot incrementally improve.
The best durability is local, that you control, on a definite file-system on a physical device in your possession.
A convenient way to maintain a backup of important files, and communicate them, is with git and github or gitlab.
One should not be ashamed of your *kata* in any condition!
Progress is laudable at any speed.
In fact, progress on kata may halt if you've accumulated all the kata you need to becoming a professional fighter.


## Apology
I realized after writing this I broke a rule and used markdown instead of html.
One solution is to renounce markdown and author in plain html only.
This has some appeal, but I like markdown!
*The primary problem is that markdown is only directly support by github itself*
One solution to use markdown with a local server is to *introduce a build step*!
Either with [pandoc] or [showdown](https://github.com/showdownjs/showdown)
And then triggered off of [entr](https://github.com/eradman/entr) (And see this [excellent StackExchange article on the subject of file watching](https://superuser.com/questions/181517/how-to-execute-a-command-whenever-a-file-changes).)

Pandoc looks like a handy tool, as is entr, so I'm glad to make their acquaintance.
But *for now* I think its sufficient to allow some markdown to seep into the project and take no action.

# How to Convert HTML to markdown with Pandoc

Convert html to markdown with pandoc:
```bash
  sudo apt update && sudo apt install pandoc
  pandoc stree.html -o stree.md -f markdown+raw_html
```

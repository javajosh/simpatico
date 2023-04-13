# systemd

[Systemd](https://systemd.io/) is Ubuntu 22's preferred method of defining and running "services" in a controlled way.
It is very feature rich, taking care of running on boot, restarting, and even setuid issues.
In fact the docs strongly imply its used to manage hypervisors.
E.g. a VPS service like linode would use systemd to manage one quemu per customer.
However the community seems unhappy with systemd, primarily that it's big and must be understood entirely. I have decided to use it and mitigate the auditability problem with a little discipline, in particular, to keep good notes of how the server is setup, systemd wise.

This is my story.

I begin with a little trepidation.
How deep will this rabbit hole go?
Also, isn't this going against my "keep it simple" creed?
Let's just say I'm willing to give writing a unit file and learning some sub-commands a shot.
If it doesn't work, I'll figure something else out - like retreating and using nginx after all as a proxy.

Okay, I found some [Ubuntu systemd documentation](https://wiki.ubuntu.com/SystemdForUpstartUsers).
Luckily I can work locally on Linux which is nice.

```bash
/lib/systemd/system/simpatico.service:

[Unit]
Description=Job that runs the simpatico reflector daemon
Documentation=man:reflector(1)

  [Service]
Type=forking
Environment=statedir=/var/cache/simpatico
ExecStartPre=/usr/bin/mkdir -p ${statedir}
ExecStart=/usr/bin/node /home/simpatico/simpatico/reflector.js "{http:80, https:443, hostname:simpatico.io}"}

[Install]
WantedBy=multi-user.target
```

We can also move parameters between command line and environment variables.
But the key question is: does this work?
I can check locally on my laptop, after I push I can check over there.


## Systemd failure on Windows WSL2
So far so bad testing on Windows.
[This article lies](https://ubuntu.com/blog/ubuntu-wsl-enable-systemd), systemd is not enable-able in wsl. At least, I wasn't able to get it to work. Note that it's entirely possible there's something wrong with my wsl installation.
I can still test on laptop and in production.
  - Windows WSL note: enable systemd by modifying `/etc/wsl.conf`
  - Then restart wsl from powershell `wsl --shutdown`.
  - Dissapointingly this didn't work for me so I can't test this locally. on my windows machine.
  - I can still test it locally on my laptop :)

## Putting systemd aside for now
I think writing a solid systemd unit script for the reflector is a good way to proceed.
I like that its standard and feature rich.
Once its working I'd have high confidence in it.
But I don't like that the system is so big and complex and intimidating.
The time required to really learn systemd seems rather high.
Getting the BTD loop going for systemd work has been challenging as intelliJ cannot seem to directly edit `/etc/systemd/system/*.service` files even running natively in Linux (complains about inability to save backup file.)
Probably solveable with a liberal use of `chmod -R /etc/systemd/service`.

The alternative is something I just realized I can do: use tmux to run the reflector as root, allowing me to logout and not interrupt the server process.
This is a very low-tech way to do things.
It's simple and I like it.
It also (re)aquaints me with tmux, a very useful utility in many circumstances.
However to really make progress here, I need to solve the desktop->server access problem.
Generate public private key on the desktop. `ssh-keygen -f ~/.ssh/id_ed25519 -t ed25519`
Get the public key to the laptop (email? chat?). `cat ~/.ssh/id_ed25519.pub`
From the laptop, ssh into the server. `ssh josh@simpatico.io`.
(Alternatively their seems to be a special ssh command to push a key to a server).
Add the desktop public key to the server `vim ~/.ssh/authorized_keys`.
At this point I can access `josh@simpatico.io` from the desktop.
I can also revoke access on a per-device basis.

## Links

- [io_uring](https://kernel-recipes.org/en/2019/talks/faster-io-through-io_uring/) and [more](https://developers.redhat.com/articles/2023/04/12/why-you-should-use-iouring-network-io)



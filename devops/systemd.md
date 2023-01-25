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
So far so bad testing on Windows. I can still test on laptop and in production.
  - Windows WSL note: enable systemd by modifying /etc/wsl.conf
  - Then restart wsl from powershell wsl --shutdown.
  - Dissapointingly this didn't work for me so I can't test this locally. on my windows machine.
  - I can still test it locally on my laptop :)

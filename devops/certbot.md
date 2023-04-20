___________________________________________________
# Certbot
jbr 2023
See also: [certbot](https://certbot.eff.org/)

If you want TLS you should try [LetsEncrypt](https://letsencrypt.org/).
It's free and (sometimes) easy to use.
They have you install [certbot](https://certbot.eff.org/).

# Install Certbot
The official docs are [on readthedocs](https://eff-certbot.readthedocs.io/en/stable/install.html) but confusingly point you back to the parent site for official, customized install instructions:
[another url](https://certbot.eff.org/instructions?ws=other&os=ubuntufocal&tab=standard)

This part went without a hitch for me on Ubuntu 22.04.1 LTS:
```bash
function installCertbot() {
  # From https://certbot.eff.org/instructions?ws=other&os=ubuntufocal
  sudo snap install core; sudo snap refresh core
  sudo snap install --classic certbot
  cd ~/simpatico || exit
  sudo certbot certonly
}
```

# Renewing Certbot
They say I should start from this starting point:
```bash
sudo certbot renew --dry-run
```

However, because I'm writing my own server, I need to figure out what this command does. My guess is it writes a secret to a file, and then phones home saying, "hey check this place and find this unique string", expecting the file to be served as an http resource on port 80.

From [the docs](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates):

  > `certbot reconfigure` command can be used to change a certificate’s renewal options.
  > This command will use the new renewal options to perform a test renewal against the Let’s Encrypt staging server.
  > If this is successful, the new renewal options will be saved and will apply to future renewals.

  > You will need to specify the `--cert-name`, which can be found by running `certbot certificates`.

A list of common options that may be updated with the reconfigure command can be found by running `certbot help reconfigure`.

As a practical example, if you were using the webroot authenticator and had relocated your website to another directory, you can change the `--webroot-path` to the new directory using the following command:
```bash
sudo certbot reconfigure --cert-name simpatico.io --webroot-path ~/simpatico
```

It only needs `sudo` because of an intentional global lock file.
You can get more information out of the debug logs:
```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

The problem is that the reflector isn't properly serving this request:
```bash
curl http://simpatico.local:8080/.well-known/acme-challenge/6P9kCesSMDHBUc2vtKl_8sFBCqFHwndEh8kFL-orNzk
```

Once this was [fixed](https://github.com/javajosh/simpatico/commit/51df568074941913fbcf25f149ae0f7da5bd93b2) I ran `sudo certbot renew` to get a new cert. Very easy.

___________________________________________________
## Testing the timer
Note: I wrote this section before discovering `certbot reconfigure`.
However it may be useful in the future.

I am somewhat familiar with `cron` but not at all with `systemd` timers.
As with everything with `systemd`, I am somewhat wary.
I sense engineering maximalism at play, and I feel the lure of a rich featureset.
But the price is high: systemd is a toolset that must be studied, practiced.

By process of elimination I discovered that the timer is called `snap.certbot.renew.timer`:

```bash
systemctl list-timers
less /etc/systemd/system/snap.certbot.renew.timer
```

```properties
[Timer]
Unit=snap.certbot.renew.service
OnCalendar=*-*-* 05:02
OnCalendar=*-*-* 16:53
```

Finally the unit file for `snap.certbot.renew.service`:

```properties
[Unit]
# Auto-generated, DO NOT EDIT
Description=Service for snap application certbot.renew
Requires=snap-certbot-2913.mount

Wants=network.target
After=snap-certbot-2913.mount network.target snapd.apparmor.service
X-Snappy=yes
[Service]
EnvironmentFile=-/etc/environment
ExecStart=/usr/bin/snap run --timer="00:00~24:00/2" certbot.renew
SyslogIdentifier=certbot.renew
Restart=no
WorkingDirectory=/var/snap/certbot/2913
TimeoutStopSec=30
Type=oneshot
```

#!/usr/bin/env bash

# Load up our handy functions.
. ./lib.sh

# TODO revamp the rest of this to use those functions

SSH_KEY=

# root ssh keys
mkdir /root/.ssh
echo $SSH_KEY >> /root/.ssh/authorized_keys
chmod 0700 /root/.ssh

# update to latest
apt-get update -y
apt-get upgrade -y

# install dependencies
apt-get install -y build-essential curl
apt-get install -y git || apt-get install -y git-core

# install node
# TODO update this to use nvm

# setup a 'deploy' user
useradd -U -s /bin/bash -m deploy

## ssh directory
mkdir /home/deploy/.ssh
chmod 0700 /home/deploy/.ssh

## github known_hosts
## https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
cat <<EOF > /home/deploy/.ssh/known_hosts
github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
github.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==
EOF

## ssh keys
echo $SSH_KEY >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

## permissions
chown -R deploy:deploy /home/deploy/.ssh

# upstart script
cat <<'EOF' > /etc/init/node.conf
description "node server"
start on filesystem or runlevel [2345]
stop on runlevel [!2345]
respawn
respawn limit 10 5
umask 022
script
  HOME=/home/deploy
  . $HOME/.profile
  exec /usr/bin/node $HOME/app/current/app.js >> $HOME/app/shared/logs/node.log 2>&1
end script

post-start script
  HOME=/home/deploy
  PID=`status node | awk '/post-start/ { print $4 }'`
  echo $PID > $HOME/app/shared/pids/node.pid
end script

post-stop script
  HOME=/home/deploy
  rm -f $HOME/app/shared/pids/node.pid
end script
EOF

# sudoers
cat <<EOF > /etc/sudoers.d/node
deploy     ALL=NOPASSWD: /sbin/restart node
deploy     ALL=NOPASSWD: /sbin/stop node
deploy     ALL=NOPASSWD: /sbin/start node
EOF

chmod 0440 /etc/sudoers.d/node

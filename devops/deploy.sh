#!/usr/bin/env bash

# This script prepares a server for running a service securely.
# root login is disabled, an admin account with ssh key access and sudo, and a service account.

# Note, if the private key file is lost or you forget its passwd, you'll have to recreate the server.

# Load up our handy functions.
. ./lib.sh

# Pick these values
hostname=cassian
admin_username=josh
service_username=simpatico
service_repo=https://github.com/javajosh/simpatico.git
# Generate this value
admin_ssh_pubkey=$()

function installNode() {
  # https://github.com/nvm-sh/nvm
  # The script clones the nvm repository to ~/.nvm, and attempts to add the source lines from the snippet below to the correct profile file (~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.bashrc)
  . ./nvm_install.sh
  nvm install 18
  nvm use 18
}

function startSimpatico() {
  git clone "$service_repo"
  cd simpatico || exit
  npm install
  node reflector.js "{http:80, ws:8081, host:simpatico.io}"
}

function installSimpaticoService {

}

# systemd script
cat <<'EOF' >/etc/init/node.conf
description "simpatico server"
start on filesystem or runlevel [2345]
stop on runlevel [!2345]
respawn
respawn limit 10 5
umask 022
script
  HOME=/home/simpatico"
  . $HOME/.profile
  exec /usr/bin/node $HOME/app/current/app.js >> $HOME/app/shared/logs/node.log 2>&1
end script

post-start script
  HOME=/home/"$service_username"
  PID=`status node | awk '/post-start/ { print $4 }'`
  echo $PID > $HOME/app/shared/pids/node.pid
end script

post-stop script
  HOME=/home/deploy
  rm -f $HOME/app/shared/pids/node.pid
end script
EOF

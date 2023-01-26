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
admin_ssh_pubkey_=

function installNode() {
  # https://github.com/nvm-sh/nvm
  # The script clones the nvm repository to ~/.nvm, and attempts to add the source lines from the snippet below to the correct profile file (~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.bashrc)
  . ./nvm_install.sh
  nvm install 18
  nvm use 18
}

function installSimpaticoService() {
  # ssh josh@simpatico.io
  # sudo su - simpatico
  installNode
  sudo apt install tmux

  git clone $service_repo
  cd simpatico || exit
  npm install
}

function startSimpatico() {
  # ssh josh@simpatico.io
  # su - simpatico
  # tmux - see https://www.howtogeek.com/671422/how-to-use-tmux-on-linux-and-why-its-better-than-screen/
  sudo node ~/simpatico/reflector.js "{http:80, ws:8081, host:simpatico.io}"
  # CTRL-B + D to detach
  # CTRL-B + S to list sessions
  # You can also launch and attach to a named session.
}

function updateSimpatico() {
  cd ~/simpatico || exit
  git pull
  npm install
  startSimpatico
}

function installCertbot() {
  # From https://certbot.eff.org/instructions?ws=other&os=ubuntufocal
  sudo snap install core; sudo snap refresh core
  sudo snap install --classic certbot
  cd ~/simpatico || exit
  sudo certbot certonly
}

function runCertbod() {

}

# systemd script - not yet working
cat <<'EOF' >/lib/systemd/system/simpatico.service
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
EOF

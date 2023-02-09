#!/usr/bin/env bash

# This script prepares a server for running a service securely.
# root login is disabled, an admin account with ssh key access and sudo, and a service account.

# Note, if the private key file is lost or you forget its passwd, you'll have to recreate the server.

# Load up our handy functions.
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
. $SCRIPT_DIR/lib.sh

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
  sudo node ~/simpatico/reflector.js "{ http:80, https:443, ws:8081, host:simpatico.io, cert:/etc/letsencrypt/live/simpatico.io/fullchain.pem',
  key:/etc/letsencrypt/live/simpatico.io/privkey.pem, useCache:true, user:simpatico }"
  # Alternative you can use environment variables with a prefix, e.g. REFL_HTTP=80 sudo - node reflector...
  # Note: command line options take precedent.
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

function addToHosts() {
  true
  # Windows admin cmd C:\Windows\System32\drivers\etc\hosts
  # Linux sudo vi /etc/hosts
  # += 127.0.0.1  simpatico.local
}

function generateRootCA() {
  # Generate root ca once per device.
  # For each browser on the device, add the root ca.
  # You may want to share the RootCA.pem file
  # Note that if you're in WSL or another VM you may need to copy these files to the correct host directory.
  openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 \
  -keyout ~/.ssh/RootCA.key \
  -out ~/.ssh/RootCA.pem \
  -subj "/C=US/CN=Simpatico-Root-CA"

  openssl x509 -outform pem -in ~/.ssh/RootCA.pem -out ~/.ssh/RootCA.crt
}

function generateSelfSignedCert() {
  # This only needs to be done once per simulated domain, but it doesn't hurt to regenerate.
  # Describe the domain(s) you want to self-sign
  cat << 'EOF' > domains.ext
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = simpatico.local
EOF

  # Sign the domains using your new root.
  openssl req -new -nodes -newkey rsa:2048 -keyout localhost.key -out localhost.csr -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=simpatico.local"
  openssl x509 -req -sha256 -days 1024 -in localhost.csr -CA ~/.ssh/RootCA.pem -CAkey ~/.ssh/RootCA.key -CAcreateserial -extfile domains.ext -out localhost.crt

  # Now you can run reflector with something like "{http:8080, https:8443, host:simpatico.local, cert:localhost.crt, key:localhost.key}"
}

function addSimpaticoUnitFile() {
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
}



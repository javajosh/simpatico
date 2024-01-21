#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
###########################################################
# This is a library and reference for useful bash commands for both debian and redhat based systems
# I'm not a good bash programmer, or a good linux sysadmin. These links help:
# https://tldp.org/LDP/abs/html/abs-guide.html
# https://zwischenzugs.com/2018/01/06/ten-things-i-wish-id-known-about-bash/
# https://github.com/fail2ban/fail2ban
# https://help.ubuntu.com/community/UFW

# Some things that I considered but didn't use:
# https://manpages.ubuntu.com/manpages/kinetic/en/man1/authbind.1.html
# https://git.rootprojects.org/root/acme.js.git

# Note that most of these functions are designed to be called once during system initialization.

###########################################################

function system_primary_ip() {
  local -r ip_address="$(ip a | awk '/inet / {print $2}')"
  echo "$ip_address" | cut -d' ' -f 2 | cut -d/ -f 1
}

function system_primary_ipv6() {
  ip -6 a | grep inet6 | awk '/global/{print $2}' | cut -d/ -f1
}

function system_private_ip() {
  local -r ip_address="$(ip a | awk '/inet 192.168/ {print $2}')"
  echo "$ip_address" | cut -d ' ' -f 2 | cut -d/ -f 1
}

function get_rdns() {
  # $1 - The IP address to query
  [ ! -e /usr/bin/host ] && system_install_package dnsutils
  host "$1" | awk '/pointer/ {print $5}' | sed 's/\.$//'
}

function get_rdns_primary_ip() {
  # returns the reverse dns of the primary IP assigned to this system
  get_rdns "$(system_primary_ip)"
}

function system_set_hostname() {
  # Sets the system's hostname
  # $1 - The hostname to define
  local -r hostname="$1"
  [ -z "$hostname" ] && {
    printf "Hostname undefined\n"
    return 1
  }
  hostnamectl set-hostname "$hostname"
}

function system_add_host_entry() {
  # $1 - The IP address to set a hosts entry for
  # $2 - The fqdn to set to the IP
  # $3 - The Hostname to set a hosts entry for
  local -r ip_address="$1" fqdn="$2" hostname="$3"
  [ -z "$ip_address" ] || [ -z "$fqdn" ] && {
    printf "IP address and/or fqdn undefined in system_add_host_entry()\n"
    return 1
  }
  echo "$ip_address $fqdn $hostname" >>/etc/hosts
}

function detect_distro() {
  # Determine which distribution is in use - in my case it's ubuntu, which is a debian.
  # But it's nice to have redhat as a reference, too.
  # $1 - required - Which value to echo back to the calling function
  [ -z "$1" ] && {
    printf "detect_distro() requires which value to be returned as its only argument\n"
    return 1
  }

  local -r distro="$(grep "^ID=" /etc/os-release | cut -d= -f2)"
  distro="$(sed -e 's/^"//' -e 's/"$//' <<<"$distro")"

  local -r version="$(grep "^VERSION_ID=" /etc/os-release | cut -d= -f2)"
  version="$(sed -e 's/^"//' -e 's/"$//' <<<"$version")"

  [ -f /etc/debian_version ] && local -r family='debian'
  [ -f /etc/redhat-release ] && local -r family='redhat'
  # Determine what the calling function wants and provide it
  case "$1" in
  'distro')
    printf "%s\n" "$distro"
    ;;
  'family')
    printf "%s\n" "$family"
    ;;
  'version')
    printf "%s\n" "$version"
    ;;
  *)
    printf "This does not appear to be a supported distribution\n"
    return 1
    ;;
  esac
}

function system_set_timezone() {
  # $1 - required - timezone to set on the system
  [ -z "$1" ] && {
    printf "system_set_timezone() requires the timezone as its only argument\n"
    return 1
  }
  timedatectl set-timezone "$1"
}

function system_install_package() {
  # Install a list of packages
  [ -z "$1" ] && {
    printf "system_install_package() requires the package(s) to be installed as its only argument\n"
    return 1
  }

  local packages=("${@}")
  # Determine which package manager to use, and install the specified package
  case "${detected_distro['family']}" in
  'debian')
    DEBIAN_FRONTEND=noninteractive apt -y install "${packages[@]}" -qq >/dev/null || {
      printf "One of the packages could not be installed via apt\n"
      return 1
    }
    ;;
  'redhat')
    yum --quiet -y install "${packages[@]}" >/dev/null || {
      printf "One of the packages could not be installed via yum\n"
      return 1
    }
    ;;
  esac
}

function system_remove_package() {
  # Remove a list of packages
  [ -z "$1" ] && {
    printf "system_remove_package() requires the package to be removed as its only argument\n"
    return 1
  }
  local packages=("${@}")
  # Determine which package manager to use, and remove the specified package
  case "${detected_distro['family']}" in
  'debian')
    DEBIAN_FRONTEND=noninteractive apt -y purge "${packages[@]}" -qq >/dev/null || {
      printf "One of the packages could not be removed via apt\n"
      return 1
    }
    ;;
  'redhat')
    yum --quiet -y remove "${packages[@]}" >/dev/null || {
      printf "One of the packages could not be removed via yum\n"
      return 1
    }
    ;;
  esac
}

function system_configure_ntp() {
  systemctl start systemd-timesyncd
  system_install_package ntp
  systemctl enable ntpd
  systemctl start ntpd
}

###########################################################
# Users and Security
###########################################################
function ssh_generate_keypair() {
  # Run this on your private laptop once.
  # Concat the generated public key to remote:~/.ssh/authorized_keys
  # Use the key with either ssh -i or copy the private key to ~/.ssh/id_ed25519
  # https://www.ssh.com/academy/ssh/keygen
  # https://www.cryptopp.com/wiki/Ed25519 <- I guess this is the best as of 2023
  ssh-keygen -f ~/.ssh/id_ed25519 -t ed25519
}

function encrypt() {
  # https://askubuntu.com/questions/60712/how-do-i-quickly-encrypt-a-file-with-aes#60713
  # "Pick a great password, or you're hosed"
  # Here are the cyphers supported by my current version of ssh
  # debug2: ciphers ctos: / ciphers stoc:
  # chacha20-poly1305@openssh.com,
  # aes128-ctr,aes192-ctr,
  # aes256-ctr,
  # aes128-gcm@openssh.com,
  # aes256-gcm@openssh.com

   openssl aes-256-cbc -in "$1" -out "$1".enc -a -pbkdf2
   rm "$1"
}

function decrypt() {
  openssl aes-256-cbc -d -in "$1".enc -out "$1" -a -pbkdf2
  rm "$1".enc
}

function user_add_admin() {
  # Run this as root once
  # $1 - required - username
  # $2 - required - public key
  [ -z "$1" ] || [ -z "$2" ] && {
    printf "No new username and/or public-key entered\n"
    return 1
  }
  adduser \
    --gecos \
    --disabled-password \
    --home /home/"$1" \
    --shell /bin/bash \
    "$1"
  # echo "${username}:${userpass}" | chpasswd
  adduser "$1" sudo >/dev/null
  user_add_pubkey "$2"

  # Note that redhat does it like this
  # useradd "$username" && usermod -aG wheel "$username" >/dev/null
}

function user_add_service() {
  # Run this as root once per service (generally one per VPS)
  # $1 - required - username
  [ -z "$1" ] && {
    printf "No new username\n"
    return 1
  }
  adduser \
    --gecos \
    --disabled-password \
    --home /home/"$1" \
    --shell /bin/bash \
    "$1"

  ## add github known_hosts
  ## https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
  cat <<EOF >/home/"$1"/.ssh/known_hosts
  github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
  github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
  github.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==
EOF

}

function user_add_pubkey() {
  # Adds the users public key to authorized_keys for the specified user. Make sure you wrap
  # your input variables in "{double quotes and curly braces}", or the key may not load properly
  # $1 - Required - username
  # $2 - Required - public key
  [ -z "$1" ] || [ -z "$2" ] && {
    printf "Must provide a username and a public key\n"
    return 1
  }
  local -r username="$1" userpubkey="$2"
  case "$username" in
  'root')
    mkdir /root/.ssh
    echo "$userpubkey" >>/root/.ssh/authorized_keys
    return 1
    ;;
  *)
    mkdir -p /home/"${username}"/.ssh
    chmod -R 700 /home/"${username}"/.ssh/
    echo "$userpubkey" >>/home/"${username}"/.ssh/authorized_keys
    chown -R "${username}":"${username}" /home/"${username}"/.ssh
    chmod 600 /home/"${username}"/.ssh/authorized_keys
    ;;
  esac
}

function user_remove_pubkey() {
  sed -i '/ user@domain$/d' ~/.ssh/authorized_keys
}

function ssh_disable_root() {
  # Disable root SSH access
  sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
  sed -i -e "s/#PermitRootLogin no/PermitRootLogin no/" /etc/ssh/sshd_config
  # Disable password authentication
  sed -i -e "s/PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config
  sed -i -e "s/#PasswordAuthentication no/PasswordAuthentication no/" /etc/ssh/sshd_config
  # Restart SSHd
  [ "${detected_distro[family]}" == 'debian' ] && systemctl restart ssh
  [ "${detected_distro[family]}" == 'redhat' ] && systemctl restart sshd
}

function configure_ufw_firewall() {
  local -a ports=("$@")
  # Open the ports specified in "${@}"
  for i in "${ports[@]}"; do
    ufw allow "$i"
  done
  ufw reload
}

function configure_basic_firewall() {
  case "${detected_distro[family]}" in
  'debian')
    iptables --policy INPUT DROP
    iptables --policy OUTPUT ACCEPT
    iptables --policy FORWARD DROP
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
    iptables -A INPUT -i lo -m comment --comment "Allow loopback connections" -j ACCEPT
    iptables -A INPUT -p icmp -m comment --comment "Allow Ping to work as expected" -j ACCEPT

    ip6tables --policy INPUT DROP
    ip6tables --policy OUTPUT ACCEPT
    ip6tables --policy FORWARD DROP
    ip6tables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
    ip6tables -A INPUT -i lo -m comment --comment "Allow loopback connections" -j ACCEPT
    ip6tables -A INPUT -p icmpv6 -m comment --comment "Allow Ping to work as expected" -j ACCEPT
    ;;

  esac
  # Open port 22 for SSH
  add_port 'ipv4' 22 'tcp'
  add_port 'ipv6' 22 'tcp'
  save_firewall
}

function add_port() {
  # $1 - required - IP standard to use (IPv4 or IPv6)
  # $2  - Required - Port to open
  [ -z "$1" ] && {
    printf "add_port() requires the IP standard (IPv4/IPv6) as its first argument\n"
    return 1
  }

  [ -z "$2" ] && {
    printf "add_port() requires the port number as its second argument\n"
    return 1
  }

  [ -z "$3" ] && {
    printf "add_port() requires the protocol (TCP/UDP) as its third argument\n"
    return 1
  }

  local -r standard="${1,,}" port="$2" protocol="${3,,}"

  case "${detected_distro[family]}" in
  'redhat')
    firewall-cmd --quiet --permanent --add-port="${port}/${protocol}"
    firewall-cmd --quiet --reload
    ;;
  *)
    if [ -x /usr/sbin/ufw ]; then
      ufw allow "$port/$protocol"
    else
      case "$standard" in
      'ipv4')
        iptables -A INPUT -p "$protocol" --dport "$port" -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
        ;;
      'ipv6')
        ip6tables -A INPUT -p "$protocol" --dport "$port" -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
        ;;
      esac
    fi
    ;;
  esac
}

function add_ports() {
  # Opens a list of firewall ports for both IPv4 and IPv6
  local -a ports=("${@}")
  # Open the ports specified in "${@}"
  for i in "${ports[@]}"; do
    add_port 'ipv4' $i 'tcp'
    add_port 'ipv6' $i 'tcp'
  done
}

function save_firewall() {
  case "${detected_distro[family]}" in
  'debian')
    # Save the IPv4 and IPv6 rule-sets so that they will stick through a reboot
    printf "Saving firewall rules for IPv4 and IPv6...\n"
    echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
    echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
    system_install_package iptables-persistent
    ;;
  'redhat')
    firewall-cmd --quiet --reload
    ;;
  esac

}

function enable_fail2ban() {
  # Install fail2ban - which blocks hosts from trying to authenticate too many times.
  # See https://github.com/fail2ban/fail2ban
  system_install_package fail2ban
  # Configure fail2ban defaults
  cd /etc/fail2ban || exit
  cp fail2ban.conf fail2ban.local
  cp jail.conf jail.local
  sed -i -e "s/backend = auto/backend = systemd/" /etc/fail2ban/jail.local
  systemctl enable fail2ban
  systemctl start fail2ban
  cd /root/ || exit
  # Start fail2ban and enable it as a system service
  systemctl start fail2ban
  systemctl enable fail2ban
}

function enable_passwordless_sudo() {
  # $1 - required - Username to grant passwordless sudo access to
  [ -z "$1" ] && {
    printf "enable_passwordless_sudo() requires the username to grant passwordless sudo access to as its only argument\n"
    return 1
  }
  local -r username="$1"
  echo "$username ALL = (ALL) NOPASSWD: ALL" >>/etc/sudoers
}

function automatic_security_updates() {
  # Configure automatic security updates for Debian-based systems
  # To test use unattended-upgrades --dry-run --debug
  if [ "${detected_distro[family]}" == 'debian' ]; then
    system_install_package unattended-upgrades
    cat >/etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
  # Configure automatic security updates for RedHat-based systems
  elif [ "${detected_distro[family]}" == 'redhat' ]; then
    system_install_package yum-cron
    sed -i 's/apply_updates = no/apply_updates = yes/g' /etc/yum/yum-cron.conf
  fi
}

function makeRootNice() {
  # Enable the "ll" list long alias and colorful root Bash prompt
  sed -i -e 's/^#PS1=/PS1=/' /root/.bashrc
  sed -i -e "s/^#alias ll='ls -l'/alias ll='ls -al'/" /root/.bashrc
}

###########################################################
# Utility functions
###########################################################

function restartServices() {
  # restarts services that have a file in /tmp/restart-*
  for service in $(ls /tmp/ | grep 'restart-' | cut -d- -f2-10); do
    # Restart the services and delete the restart file from /tmp
    systemctl restart "$service"
    rm -f "/tmp/restart-${service}"
  done
}

function randomString() {
  LC_ALL=C tr -dc A-Za-z0-9 </dev/urandom | head -c "${1:-20}"
}

###########################################################
# OS Detection Stuff
###########################################################

# Store detected distribution information in a globally-scoped Associative Array
readonly dist="$(detect_distro 'distro')"
readonly fam="$(detect_distro 'family')"
readonly -A detected_distro="(
    [distro]="${dist,,}" \
    [family]="${fam,,}" \
    [version]="$(detect_distro 'version')"
    [version_major]="$(detect_distro 'version' | cut -d. -f1)"
    [version_minor]="$(detect_distro 'version' | cut -d. -f2)"
)"

###########################################################
# Other functions
###########################################################

function get_started() {
  local -r subdomain="$1" domain="$2" ip="$3"
  if [ "$domain" ]; then
    if [ "$subdomain" ]; then
      local -r fqdn="${subdomain}.${domain}"
    else
      local -r fqdn="$domain"
    fi
    local -r hostname="$domain"
  else
    local -r hostname="$(dnsdomainname -A | awk '{print$1}')"
    local -r fqdn=$hostname
  fi

  # Set the hostname and Fully Qualified domain Name (fqdn) in the /etc/hosts file
  printf "Setting IP Address (%s), fqdn (%s), and hostname (%s) in /etc/hosts...\n" "$ip" "$fqdn" "$hostname"
  system_add_host_entry "$ip" "$fqdn" "$hostname"
  # Run initial updates
  system_update
  # Set the hostname
  system_set_hostname "$hostname"
}

function secure_server() {
  # Performs basic security configurations
  # Follows the basic steps oulined in  'How to Secure Your Server' guide -
  #   https://www.linode.com/docs/security/securing-your-server
  #
  # $1 - The username for the limited sudo user
  # $2 - The password for the limited sudo user
  # $3 - Public Key to be used for SSH authentication
  [ -z "$1" ] && {
    printf "secure_server() requires the username for the limited sudo user as its first argument\n"
    return 1
  }
  [ -z "$2" ] && {
    printf "secure_server() requires the password for the limited sudo user as its second argument\n"
    return 1
  }
  [ -z "$3" ] && {
    printf "secure_server() requires the Public Key to be used for SSH authentication as its third argument\n"
    return 1
  }

  local -r user="$1" password="$2" pubkey="$3"
  # Create the user and add give it 'sudo' privileges
  # This function needs updating for systems that use the 'wheel' group
  user_add_sudo "$user" "$password"
  # Configure Public Key Authentication, disable root, and restart SSHd
  user_add_pubkey "$user" "$pubkey"
  ssh_disable_root
  # Configure basic firewall rules
  configure_basic_firewall
  # Install and enable fail2ban
  enable_fail2ban
}

function ufw_install() {
  # Install UFW and add basic rules
  system_install_package ufw
  ufw default allow outgoing
  ufw default deny incoming
  ufw allow ssh
  ufw enable
  systemctl enable ufw
  # Stop flooding Console with messages
  ufw logging off
}

# TODO replace this with a docker image.
function sdkman_install(){
  # Install SDKMAN and Java 21
  sudo apt install zip
  # if you're really going to be doing things on this server, then you probably want these packages, too:
  # sudo apt install autojump silversearcher-ag docker.io docker-compose
  curl -s "https://get.sdkman.io" | bash
  source "/home/josh/.sdkman/bin/sdkman-init.sh"
  sdk install java 21-amzn
  # j <project>
  # chmod 700 ./gradlew
  # ./gradlew -Dorg.gradle.daemon=false bootRun
}

function docker_install(){
  # Based on https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04
  # Add docker repo
  sudo apt install apt-transport-https ca-certificates curl software-properties-common
  # TODO resolve Warning: apt-key is deprecated. Manage keyring files in trusted.gpg.d instead (see apt-key(8)).
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  # Get current distro name with lsb_release -a
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu jammy stable"
  apt-cache policy docker-ce

  # Install docker
  sudo apt install docker-ce
  # Check that it's running
  # sudo systemctl status docker

  # Allow non-root user to run docker commands
  sudo usermod -aG docker ${USER}
  su - ${USER}
}

# Make sure the user node is linked to the global node. Rerun after version change.
function fix_sudo_node(){
  sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node"
  sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/npm" "/usr/local/bin/npm"
  sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/npx" "/usr/local/bin/npx"
}

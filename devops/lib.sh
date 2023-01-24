#!/usr/bin/env bash

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

function system_primary_ip {
    local ip_address="$(ip a | awk '/inet / {print $2}')"
    echo $ip_address | cut -d' ' -f 2 | cut -d/ -f 1
}

function system_primary_ipv6 {
    ip -6 a | grep inet6 | awk '/global/{print $2}' | cut -d/ -f1
}

function system_private_ip {
    local ip_address="$(ip a | awk '/inet 192.168/ {print $2}')"
    echo $ip_address | cut -d ' ' -f 2 | cut -d/ -f 1
}

function get_rdns {
    # $1 - The IP address to query
    [ ! -e /usr/bin/host ] && system_install_package dnsutils
    host "$1" | awk '/pointer/ {print $5}' | sed 's/\.$//'
}

function get_rdns_primary_ip {
    # returns the reverse dns of the primary IP assigned to this system
    get_rdns $(system_primary_ip)
}

function system_set_hostname {
    # Sets the system's hostname
    # $1 - The hostname to define
    local -r hostname="$1"
    [ -z "$hostname" ] && {
        printf "Hostname undefined\n"
        return 1;
    }
    hostnamectl set-hostname "$hostname"
}

function system_add_host_entry {
    # $1 - The IP address to set a hosts entry for
    # $2 - The fqdn to set to the IP
    # $3 - The Hostname to set a hosts entry for
    local -r ip_address="$1" fqdn="$2" hostname="$3"
    [ -z "$ip_address" ] || [ -z "$fqdn" ] && {
        printf "IP address and/or fqdn undefined in system_add_host_entry()\n"
        return 1;
    }
    echo "$ip_address $fqdn $hostname" >> /etc/hosts
}

function detect_distro {
    # Determine which distribution is in use - in my case it's ubuntu, which is a debian.
    # But it's nice to have redhat as a reference, too.
    # $1 - required - Which value to echo back to the calling function
    [ -z "$1" ] && {
        printf "detect_distro() requires which value to be returned as its only argument\n"
        return 1;
    }

    local distro="$(grep "^ID=" /etc/os-release | cut -d= -f2)"
    distro="$(sed -e 's/^"//' -e 's/"$//' <<<"$distro")"

    local version="$(grep "^VERSION_ID=" /etc/os-release | cut -d= -f2)"
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
            return 1;
            ;;
    esac
}

function system_set_timezone {
    # $1 - required - timezone to set on the system
    [ -z "$1" ] && {
         printf "system_set_timezone() requires the timezone as its only argument\n"
         return 1;
    }
    timedatectl set-timezone "$1"
}

function system_install_package {
    # Install a list of packages
    [ -z "$1" ] && {
        printf "system_install_package() requires the package(s) to be installed as its only argument\n"
        return 1;
    }

    local packages=("${@}")
    # Determine which package manager to use, and install the specified package
    case "${detected_distro['family']}" in
        'debian')
            DEBIAN_FRONTEND=noninteractive apt-get -y install "${packages[@]}" -qq >/dev/null || {
                printf "One of the packages could not be installed via apt-get\n"
                printf "Check out /var/log/stackscript.log for more details\n"
                return 1;
            }
            ;;
        'redhat')
            yum --quiet -y install "${packages[@]}" >/dev/null || {
                printf "One of the packages could not be installed via yum\n"
                printf "Check out /var/log/stackscript.log for more details\n"
                return 1;
            }
            ;;
    esac
}

function system_remove_package {
    # This function expands a bit on the system_remove_package() by allowing removal of a
    # list of packages, stored in an array, using a single command instead of requiring scripts
    # to call the function once for each package removed
    [ -z "$1" ] && {
        printf "system_remove_package() requires the package to be removed as its only argument\n"
        return 1;
    }
    local packages=("${@}")
    # Determine which package manager to use, and remove the specified package
    case "${detected_distro['family']}" in
        'debian')
            DEBIAN_FRONTEND=noninteractive apt-get -y purge "${packages[@]}" -qq >/dev/null || {
                printf "One of the packages could not be removed via apt-get\n"
                printf "Check out /var/log/stackscript.log for more details\n"
                return 1;
            }
            ;;
        'redhat')
            yum --quiet -y remove "${packages[@]}" >/dev/null || {
                printf "One of the packages could not be removed via yum\n"
                printf "Check out /var/log/stackscript.log for more details\n"
                return 1;
            }
            ;;
    esac
}

function system_configure_ntp {
    case "${detected_distro[distro]}" in
        'debian')
            if [ "$(echo "${detected_distro[version_major]}")" -ge 10 ]; then
                systemctl start systemd-timesyncd
            fi
            ;;
        'ubuntu')
            if [ "$(echo "${detected_distro[version_major]}")" -ge 20 ]; then
                systemctl start systemd-timesyncd
            fi
            ;;
        *)
            system_install_package ntp
            systemctl enable ntpd
            systemctl start ntpd
            ;;
    esac
}

###########################################################
# Users and Security
###########################################################

function user_add_server {
  [ -z "$1" ] && {
      printf "No new username and/or public-key entered\n"
      return 1;
  }
  adduser -m \
    -gecos \
    -disabled-password \
    -d /home/"$1" \
    -s /bin/bash \
    "$1"
}
function user_add_admin {
  # $1 - required - username
  # $2 - required - public key
  [ -z "$1" ] || [ -z "$2" ] && {
      printf "No new username and/or public-key entered\n"
      return 1;
  }

  adduser -m \
    -gecos \
    -disabled-password \
    -d /home/"$1" \
    -s /bin/bash \
    "$1"

  adduser "$1" sudo >/dev/null
  user_add_pubkey "$2"
}

function user_add_sudo {
    # $1 - required - username
    # $2 - required - password
    [ -z "$1" ] || [ -z "$2" ] && {
        printf "No new username and/or password entered\n"
        return 1;
    }
    local -r username="$1" userpass="$2"
    case "${detected_distro[family]}" in
        'debian')
            # Add the user and set the password
            adduser "$username" --disabled-password --gecos ""
            echo "${username}:${userpass}" | chpasswd
            # Add the newly created user to the 'sudo' group
            adduser "$username" sudo >/dev/null
            ;;
        'redhat')
            # Add the user and set the password
            useradd "$username"
            echo "${username}:${userpass}" | chpasswd
            # Add the newly created user to the 'wheel' group
            usermod -aG wheel "$username" >/dev/null
            ;;
    esac
}

function user_add_pubkey {
    # Adds the users public key to authorized_keys for the specified user. Make sure you wrap
    # your input variables in "{double quotes and curly braces}", or the key may not load properly
    # $1 - Required - username
    # $2 - Required - public key
    [ -z "$1" ] || [ -z "$2" ] && {
        printf "Must provide a username and a public key\n"
        return 1;
    }
    local -r username="$1" userpubkey="$2"
    case "$username" in
        'root')
            mkdir /root/.ssh
            echo "$userpubkey" >> /root/.ssh/authorized_keys
            return 1;
            ;;
        *)
            mkdir -p /home/"${username}"/.ssh
            chmod -R 700 /home/"${username}"/.ssh/
            echo "$userpubkey" >> /home/"${username}"/.ssh/authorized_keys
            chown -R "${username}":"${username}" /home/"${username}"/.ssh
            chmod 600 /home/"${username}"/.ssh/authorized_keys
            ;;
    esac
}

function ssh_generate_keypair {
  # Run this on your private laptop.
  # Concat the public key to /home/user/.ssh/authorized_keys
  # https://www.ssh.com/academy/ssh/keygen
  # https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm
  # https://en.wikipedia.org/wiki/EdDSA
  # https://www.cryptopp.com/wiki/Ed25519 <- I guess this is the best as of 2023
  ssh-keygen -f ~/"$USER"key -t ed25519
}
function ssh_revoke_access {
  sed -i '/ user@domain$/d' ~/.ssh/authorized_keys
}

function ssh_disable_root {
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

function configure_ufw_firewall {
    local -a ports=("$@")
    # Open the ports specified in "${@}"
    for i in "${ports[@]}"; do
        ufw allow "$i"
    done
    ufw reload
}

function configure_basic_firewall {
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

function add_port {
    # $1 - required - IP standard to use (IPv4 or IPv6)
    # $2  - Required - Port to open
    [ -z "$1" ] && {
        printf "add_port() requires the IP standard (IPv4/IPv6) as its first argument\n"
        return 1;
    }

    [ -z "$2" ] && {
        printf "add_port() requires the port number as its second argument\n"
        return 1;
    }

    [ -z "$3" ] && {
        printf "add_port() requires the protocol (TCP/UDP) as its third argument\n"
        return 1;
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

function add_ports {
    # Opens a list of firewall ports for both IPv4 and IPv6
    local -a ports=("${@}")
    # Open the ports specified in "${@}"
    for i in "${ports[@]}"; do
        add_port 'ipv4' $i 'tcp'
        add_port 'ipv6' $i 'tcp'
    done
}

function save_firewall {
    case "${detected_distro[family]}" in
        'debian')
            # Save the IPv4 and IPv6 rulesets so that they will stick through a reboot
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

function enable_fail2ban {
    # Install fail2ban - which blocks hosts from trying to authenticate too many times.
    # See https://github.com/fail2ban/fail2ban
    system_install_package fail2ban
    # Configure fail2ban defaults
    cd /etc/fail2ban
    cp fail2ban.conf fail2ban.local
    cp jail.conf jail.local
    sed -i -e "s/backend = auto/backend = systemd/" /etc/fail2ban/jail.local
    systemctl enable fail2ban
    systemctl start fail2ban
    cd /root/
    # Start fail2ban and enable it as a system service
    systemctl start fail2ban
    systemctl enable fail2ban
}

function enable_passwordless_sudo {
    # $1 - required - Username to grant passwordless sudo access to
    [ -z "$1" ] && {
        printf "enable_passwordless_sudo() requires the username to grant passwordless sudo access to as its only argument\n"
        return 1;
    }
    local -r username="$1"
    echo "$username ALL = (ALL) NOPASSWD: ALL" >> /etc/sudoers
}

function automatic_security_updates {
    # Configure automatic security updates for Debian-based systems
    if [ "${detected_distro[family]}" == 'debian' ]; then
        system_install_package unattended-upgrades
        cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
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

function makeRootNice {
    # Enable the "ll" list long alias and colorful root Bash prompt
    sed -i -e 's/^#PS1=/PS1=/' /root/.bashrc
    sed -i -e "s/^#alias ll='ls -l'/alias ll='ls -al'/" /root/.bashrc
}


###########################################################
# Utility functions
###########################################################

function restartServices {
    # restarts services that have a file in /tmp/restart-*
    for service in $(ls /tmp/ | grep 'restart-' | cut -d- -f2-10); do
        # Restart the services and delete the restart file from /tmp
        systemctl restart "$service"
        rm -f "/tmp/restart-${service}"
    done
}

function randomString {
    if [ -z "$1" ];
        then length=20
        else length="$1"
    fi
    # Generate a random string
    echo "$(</dev/urandom tr -dc A-Za-z0-9 | head -c $length)"
}

function certbot {
    local todo=1
    # Installs a Certbot SSL cert with a basic HTTPS re-direct for
    # TODO See https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal
    # Also see https://letsencrypt.org/getting-started/

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

function get_started {
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

function secure_server {
    # Performs basic security configurations
    # Follows the basic steps oulined in  'How to Secure Your Server' guide -
    #   https://www.linode.com/docs/security/securing-your-server
    #
    # $1 - The username for the limited sudo user
    # $2 - The password for the limited sudo user
    # $3 - Public Key to be used for SSH authentication
    [ -z "$1" ] && {
        printf "secure_server() requires the username for the limited sudo user as its first argument\n"
        return 1;
    }
    [ -z "$2" ] && {
        printf "secure_server() requires the password for the limited sudo user as its second argument\n"
        return 1;
    }
    [ -z "$3" ] && {
        printf "secure_server() requires the Public Key to be used for SSH authentication as its third argument\n"
        return 1;
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

function ufw_install {
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

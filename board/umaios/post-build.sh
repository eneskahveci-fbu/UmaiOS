#!/bin/sh
# UmaiOS post-build customization. Runs against $TARGET_DIR after all
# packages are installed but before the root filesystem image is made.

set -u
set -e

# Make sure DNS resolution works out of the box for DHCP-configured
# interfaces (busybox udhcpc's default script writes here too).
if [ ! -e "${TARGET_DIR}/etc/resolv.conf" ]; then
    echo "nameserver 1.1.1.1" > "${TARGET_DIR}/etc/resolv.conf"
fi

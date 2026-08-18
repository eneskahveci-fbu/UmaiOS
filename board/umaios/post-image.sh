#!/bin/bash
# UmaiOS post-image script. Runs after all filesystem images are built.
#
# - Drops a ready-to-run start-qemu.sh next to the images, for local
#   testing with a system-installed QEMU.
# - Copies the initramfs boot artifacts (bzImage + rootfs.cpio.gz) into
#   web/boot/ so the browser (v86) boot page can load them directly.

set -u
set -e

BOARD_DIR="$(dirname "$0")"
ROOT_DIR="$(cd "${BOARD_DIR}/../.." && pwd)"

cat > "${BINARIES_DIR}/start-qemu.sh" <<'EOF'
#!/bin/sh
# Boot UmaiOS from the initramfs image with a system-installed QEMU.
HERE="$(dirname "$0")"
exec qemu-system-x86_64 \
	-M pc \
	-m 256M \
	-kernel "${HERE}/bzImage" \
	-initrd "${HERE}/rootfs.cpio.gz" \
	-append "console=ttyS0" \
	-nographic \
	-net nic,model=virtio -net user \
	"$@"
EOF
chmod +x "${BINARIES_DIR}/start-qemu.sh"

if [ -f "${BINARIES_DIR}/bzImage" ] && [ -f "${BINARIES_DIR}/rootfs.cpio.gz" ]; then
    mkdir -p "${ROOT_DIR}/web/boot"
    cp -f "${BINARIES_DIR}/bzImage" "${ROOT_DIR}/web/boot/bzImage"
    cp -f "${BINARIES_DIR}/rootfs.cpio.gz" "${ROOT_DIR}/web/boot/rootfs.cpio.gz"
fi

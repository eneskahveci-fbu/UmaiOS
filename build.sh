#!/usr/bin/env bash
# Build UmaiOS with Buildroot.
#
# Usage:
#   ./build.sh                 Build the default image (bzImage + rootfs)
#   ./build.sh menuconfig      Open Buildroot's package menu
#   ./build.sh linux-menuconfig  Open the kernel config menu
#   ./build.sh clean           Remove build output (keeps dl/ cache)
#   ./build.sh <any make target>  Passed straight through to Buildroot's make
#
# Output lands in output/images/ (bzImage, rootfs.cpio.gz, rootfs.ext4,
# start-qemu.sh). The initramfs boot pair is also copied to web/boot/
# for the browser boot page.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILDROOT_DIR="${ROOT_DIR}/buildroot"
OUTPUT_DIR="${ROOT_DIR}/output"
DEFCONFIG="umaios_x86_64_defconfig"

if [ ! -f "${BUILDROOT_DIR}/Makefile" ]; then
    echo "==> Fetching Buildroot submodule..."
    git -C "${ROOT_DIR}" submodule update --init --recursive buildroot
fi

export BR2_EXTERNAL="${ROOT_DIR}"

if [ ! -f "${OUTPUT_DIR}/.config" ]; then
    echo "==> Applying ${DEFCONFIG}..."
    make -C "${BUILDROOT_DIR}" O="${OUTPUT_DIR}" BR2_EXTERNAL="${ROOT_DIR}" "${DEFCONFIG}"
fi

if [ "$#" -eq 0 ]; then
    JOBS="$(nproc 2>/dev/null || echo 2)"
    echo "==> Building UmaiOS (this compiles a full toolchain + kernel + rootfs, expect it to take a while)..."
    make -C "${BUILDROOT_DIR}" O="${OUTPUT_DIR}" BR2_EXTERNAL="${ROOT_DIR}" -j"${JOBS}"
    echo "==> Done. Images are in ${OUTPUT_DIR}/images/"
else
    make -C "${BUILDROOT_DIR}" O="${OUTPUT_DIR}" BR2_EXTERNAL="${ROOT_DIR}" "$@"
fi

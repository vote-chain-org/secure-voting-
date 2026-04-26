#!/bin/bash
# SecuGen FDx SDK Pro Linux Setup Script
# Run from: final_project/
# Usage: sudo bash setup_sdk.sh

set -e

SDK_LIB="FDx_SDK_Pro_Linux_v4.0c/FDx SDK Pro for Linux v4.0c/FDx_SDK_PRO_LINUX4_X64_4_0_0/lib/linux4X64"

echo "=== Step 1: Copy .so files ==="
cp "${SDK_LIB}/libpysgfplib.so.4.0.0"    /usr/local/lib/
cp "${SDK_LIB}/libsgfplib.so.4.0.1"      /usr/local/lib/
cp "${SDK_LIB}/libsgfpamx.so.3.7.0"      /usr/local/lib/
cp "${SDK_LIB}/libsgimage.so.1.0.0"      /usr/local/lib/
cp "${SDK_LIB}/libsgnfiq.so.1.0.0"       /usr/local/lib/
cp "${SDK_LIB}/libAKXUS.so.2.0.11"       /usr/local/lib/
cp "${SDK_LIB}/libnxsdk.so"              /usr/local/lib/
cp "${SDK_LIB}/libuvc.so.0.0.6"          /usr/local/lib/
echo "  .so files copied"

echo "=== Step 2: Copy HU20 licence/data ==="
cp "${SDK_LIB}/hu20_231.dat"  /usr/local/lib/
cp "${SDK_LIB}/hu20_231.lic"  /usr/local/lib/
cp "${SDK_LIB}/hu20a_231.dat" /usr/local/lib/
cp "${SDK_LIB}/hu20a_231.lic" /usr/local/lib/
echo "  licence files copied"

echo "=== Step 3: Create symlinks ==="
ln -sf /usr/local/lib/libpysgfplib.so.4.0.0  /usr/local/lib/libpysgfplib.so
ln -sf /usr/local/lib/libsgfplib.so.4.0.1    /usr/local/lib/libsgfplib.so
ln -sf /usr/local/lib/libsgfpamx.so.3.7.0    /usr/local/lib/libsgfpamx.so
ln -sf /usr/local/lib/libsgimage.so.1.0.0    /usr/local/lib/libsgimage.so
ln -sf /usr/local/lib/libsgnfiq.so.1.0.0     /usr/local/lib/libsgnfiq.so
ln -sf /usr/local/lib/libAKXUS.so.2.0.11     /usr/local/lib/libAKXUS.so
ln -sf /usr/local/lib/libAKXUS.so.2.0.11     /usr/local/lib/libAKXUS.so.2
ln -sf /usr/local/lib/libuvc.so.0.0.6        /usr/local/lib/libuvc.so
ln -sf /usr/local/lib/libuvc.so.0.0.6        /usr/local/lib/libuvc.so.0
echo "  symlinks created"

echo "=== Step 4: Refresh linker cache ==="
ldconfig
echo "  ldconfig done"

echo "=== Step 5: Verify ==="
python3 -c "from ctypes import CDLL; CDLL('/usr/local/lib/libpysgfplib.so'); print('SDK loaded successfully!')"

echo ""
echo "=== SDK Setup Complete ==="

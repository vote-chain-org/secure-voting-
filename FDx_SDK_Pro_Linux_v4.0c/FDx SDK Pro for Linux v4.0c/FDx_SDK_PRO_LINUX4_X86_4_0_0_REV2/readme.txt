Wed 23 Mar 2022 05:02:27 PM CDT
SecuGen FDx SDK PRO for Linux Kernel4
Version 4.0.0
#################################################################

X86 Build

================================================================
Release Notes:
=================================================================
1. This version supports the following SecuGen devices:
    USB Hamster Air      VID:0x1162 PID:0x2500 (U-Air class device)
    USB Hamster PRO 30   VID:0x1162 PID:0x2410 (U30A class device)
    USB Hamster PRO 20AP VID:0x1162 PID:0x2360 (U20AP class device)
    USB Hamster PRO 20   VID:0x1162 PID:0x2240 (U20A class device)
    USB Hamster PRO 10   VID:0x1162 PID:0x2203 (U10 class device)
    USB Hamster PRO      VID:0x1162 PID:0x2201 (UPx class device)
    USB Hamster PRO 20   VID:0x1162 PID:0x2200 (U20 class device)
    USB Hamster IV       VID:0x1162 PID:0x2000 (SDU04P class device)
    USB Hamster Plus     VID:0x1162 PID:0x1000 (SDU03P class device)
    USB Hamster IV       VID:0x1162 PID:0x330  (FDU04 class device)
    USB Hamster Plus     VID:0x1162 PID:0x322  (SDU03M class device)
    USB Hamster Plus     VID:0x1162 PID:0x320  (FDU03 class device)
2. This version supports (has been tested with) the following Linux versions:
    (x86)
    Debian 11
    Linux debian11-32bit 5.10.0-11-686 #1 SMP Debian 5.10.92-1 (2022-01-18) i686 GNU/Linux    libusb-0.1.12
    gcc version 10.2.1 20210110 (Debian 10.2.1-6)
    openjdk version "11.0.14"


=================================================================
SYSTEM INSTALLATION NOTES
=================================================================
1. Install the following packages if not already installed on your system.
    libgtk2.0-dev (2.24.23-0ubuntu1)

2. Install the SecuGen USB Device Drivers
    cd <install_dir>/lib/linux4X86
    make uninstall install

3. By default, only the root user can access the SecuGen USB device because the device requires
    write permissions, To allow non-root users to use the device, perform the following steps:
    3.1 Create a SecuGen Group
        # groupadd SecuGen
    3.2 Add fingerprint users to the SecuGen group.
        #gpasswd -a myUserID SecuGen
        (substitute user name for myUserID)
    3.3 Create a file in /etc/udev/rules.d/99SecuGen.rules.
        Add the following lines:

ATTRS{idVendor}=="1162", ATTRS{idProduct}=="0320", SYMLINK+="input/fdu03-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="0322", SYMLINK+="input/sdu03m-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="0330", SYMLINK+="input/fdu04-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="1000", SYMLINK+="input/sdu03p-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2000", SYMLINK+="input/sdu04p-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2200", SYMLINK+="input/u20-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2201", SYMLINK+="input/upx-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2203", SYMLINK+="input/u10-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2240", SYMLINK+="input/u20a-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2360", SYMLINK+="input/u20ap-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2410", SYMLINK+="input/u30a-%k", MODE="0660", GROUP="SecuGen"
ATTRS{idVendor}=="1162", ATTRS{idProduct}=="2500", SYMLINK+="input/uair-%k", MODE="0660", GROUP="SecuGen"
KERNEL=="uinput", MODE="0660", GROUP="SecuGen"

    3.4 Reboot
    3.5 Note: The "ATTRS" function above is not supported by earlier Linux kernels. Use "SYSFS" instead to
        configure UDEV permissions.

4. Plug in the SecuGen USB fingerprint reader

5. Now you are ready to run the demo programs in the
    <installdir>/bin/linux4X86 directory



=================================================================
Java development
=================================================================
JDK version 1.8.0_241 or later is required for distributions supporting Java

=================================================================
Bug Fixes/Enhancements
=================================================================
v4.0.0         2022-02-17 Added support for Hamster Air
                          Added support for Hamster PRO 20 AP
                          Fixed Hamster IV AUTO_ON Callback bug
v4.0.0 Beta14  2021-12-09 Bug fixes Raspbrry PI Zero (armv6l)
v4.0.0 Beta13  2021-05-13 Added support for Hamster PRO 30
                          Java and python native libraries statically linked to device driver library.
                          Default device is HU30. Rename of library file before library before install
                          will be required for other devices.
v4.0.0 Beta12  2021-04-14 Added static libraries
v4.0.0 Beta11  2020-07-22 Check for data and license files in /usr/lib
                          if not in /usr/local/lib
v4.0.0 Beta10  2020-06-15 Merged Android image improvements
v4.0.0 Beta9   2020-06-09 Fixed AUTO_ON Callbuck bug in PRO 10 driver
v4.0.0 Beta8   2020-05-15 Added WSQ sample and fixed WSQ decode on 64bit
v4.0.0 Beta7   2020-04-14 Added support for AUTO_ON Callback function in Python
v4.0.0 Beta6   2020-04-10 Added support for AUTO_ON Callback function in Java
v4.0.0 Beta5   2020-03-19 Added support for AUTO_ON Callback function
                         (Hamster Plus and Hamster IV do not support callback function)
v4.0.0 Beta4   2019-10-15 Merged Android port
v4.0.0 Beta3   2019-06-10 Added U10, U20-A and U20-AP fake detection
v4.0.0 Beta2   2019-06-10 Driver libraries loaded dynamically
                          Include MINEX III Extractor v3.7
v3.8.7         2018-10-05 Added U20 Fake Detection x64 and x86
v3.8.6         2018-08-29 Added support for Hamster PRO 10A (HU10-AP)
                          Added support for Hamster PRO 20 (HU20-AP)
v3.8.5         2018-02-08 Added support for Hamster PRO 10
v3.8.4         2017-10-18 Added new sample application
v3.8.3 REV93   2017-04-28 Fixed problem with null templates (libsgfpamx.so)
v3.8.2 REV75   2016-12-05 Integrated SecuGen WSQ library (libsgimage.so)
v3.8.1 REV60   2016-11-12 Fixed problem with Hamster Plus on USB3.0
                          libsgfdu03.so.2.0.7
v3.8.0 REV1228 2016-6-30 Added support for NFIQ
                         Addes support for Hamster Pro (HUPx)
v3.7.1 REV883  2015-6-23 Added support for Java in Rasperry Pi/Rasbian JDK1.8
v3.7.1 REV576  2014-3-14 Rebuilt 64bit release using JDK1.6
v3.7.1 REV570  2014-3-7  Release Build
v3.7.0 REV477  2014-1-2  Hamster PRO 20 is now supported
v3.5.6 REV329  2013-2-25 Java now supported
v3.5.5 REV311  2013-2-13 Multiple devices of same class now supported.
                         FDU04 and FDU03 class devices cannot be used
                         concurrently within the same application. Multiple
                         FDU04 class devices can be used concurrently.
                         Multiple FDU03 class devices can be used concurrently.
                         Fixed null S/N returned for SDU03M and SDU03P
v3.5.4 REV232  2012-09-28 Fixed auto on sample code
v3.5.4 REV219  2012-09-28 Added support for 512KB SDU04P
                         Fixed problem with exposure settings. Image quality is
                         improved
v3.5.3 RC1     2012-06-25 Add support for SDU04P, FDU03 and SDU03P
v3.5.3 Beta1   2009-12-10 Initial Release


=================================================================
Building the demo programs
=================================================================
-------------------------------------------------------------------------
FPLIB TEST SAMPLE
    cd <installdir>/sgfplibtest
    make clean all
    ../bin/linux4X64/sgfplibtest
-------------------------------------------------------------------------
AUTO_ON TEST SAMPLE
    cd <installdir>/auto_on
    make clean all
    ../bin/linux4X64/auto_on
-----------------------------------------------------------------
SECUGEN DIAGNOSTIC SAMPLE
    cd <installdir>/sgd2
    make clean all
    ../bin/linux/sgd2
-----------------------------------------------------------------
FPMATCHER SAMPLE
    cd <installdir>/fpmatcher
    make clean all
    ../bin/linux4X64/
-----------------------------------------------------------------
MULTIDEV SAMPLE (Same class of device must be used)
    cd <installdir>/multidev
    make clean all
    ../bin/linux4X64/
-----------------------------------------------------------------
=================================================================
Running the Java Samples
=================================================================
-----------------------------------------------------------------
FPLIB TEST SAMPLE
    cd <installdir>/java
    .sudo ./run_jsgfplibtest.sh
-----------------------------------------------------------------
SGD SWING SAMPLE
    cd <installdir>/java
    .sudo ./run_jsgd.sh
-----------------------------------------------------------------


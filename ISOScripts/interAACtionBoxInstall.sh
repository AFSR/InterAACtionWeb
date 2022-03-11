
# /********************************************************************************************************/
# /* PartO : Color of message */

neutre='\e[0;m'
vert='\e[0;32m'

# /********************************************************************************************************/
# /* Part1 : Set-Up InteraactionInterface, GazePlay, InteraactionGaze, InteraactionScene, InteraactionPlayer, AugCom and Tobii */

cd ~/ISOScripts/
sh ./interAACtionBoxInterfaceInstall.sh

cp -r ~/InterAACtionBox_Interface-linux /etc/skel/
cd /etc/skel/InterAACtionBox_Interface-linux/lib/jre/bin/
chmod +x java
cd /etc/skel/InterAACtionBox_Interface-linux/bin/
dos2unix ./* 2>>/etc/skel/log/dos2unix.log
cd ./scripts/
dos2unix ./* 2>>/etc/skel/log/dos2unix.log

cd ~/ISOScripts/
sh ./gazeplayInstall.sh
sh ./interAACtionGazeInstall.sh

mkdir /etc/skel/dist
sh ./interAACtionSceneInstall.sh
sh ./interAACtionPlayerInstall.sh
sh ./augcomInstall.sh

# /********************************************************************************************************/
# /* Part2 : Create Desktop Shortcut */

cd /etc/skel

cp -R ~/Ressources/.email /etc/skel/
cp ~/Ressources/interaactionBoxLauncher /etc/skel/
cd /etc/skel/
dos2unix interaactionBoxLauncher 2>>/etc/skel/log/dos2unix.log
chmod +x interaactionBoxLauncher

echo "${vert}Email settings ... Done${neutre}"

cd .config
mkdir autostart

cd /etc/skel/
mkdir .local/
mkdir .local/share
mkdir .local/share/applications
cp ~/Ressources/DesktopFiles/*.desktop  /etc/skel/.local/share/applications
chmod a+x /etc/skel/.local/share/applications/*
cp ~/Ressources/DesktopFiles/InteraactionBoxLauncher.desktop /etc/skel/.config/autostart
cp ~/Ressources/DesktopFiles/desktopIcons.desktop /etc/skel/.config/autostart
chmod a+x /etc/skel/.config/autostart/*

echo "${vert}Shortcut creation ... Done${neutre}"

cp -R ~/Ressources/Launcher /etc/skel/
dos2unix /etc/skel/Launcher/* 2>>/etc/skel/log/dos2unix.log
chmod a+x /etc/skel/Launcher/*

echo "${vert}Install launcher files for applications ... Done${neutre}"

# dbus-launch gio set InteraactionBoxLauncher.desktop "metadata::trusted" true

mkdir /etc/skel/Update
cp -R ~/Scripts/* /etc/skel/Update
dos2unix /etc/skel/Update/* 2>>/etc/skel/log/dos2unix.log

echo "${vert}Install update files for applications ... Done${neutre}"

# /********************************************************************************************************/
# /* Part3 : Choose the default wallpaper and modify installation slides */

cd /usr/share/backgrounds/
cp ~/Ressources/wallpaper_interaactionBox.png /usr/share/backgrounds/

cp ~/Ressources/90_ubuntu-custom.gschema.override /usr/share/glib-2.0/schemas/

glib-compile-schemas /usr/share/glib-2.0/schemas/

cd  /usr/share/ubiquity-slideshow/slides/
rm *.html
cp ~/slides/*.html /usr/share/ubiquity-slideshow/slides/

cd icons/
rm *
cp ~/slides/icons/* /usr/share/ubiquity-slideshow/slides/icons/

cd ../screenshots/
rm *
cp ~/slides/screenshots/* /usr/share/ubiquity-slideshow/slides/screenshots/

cd ../l10n/fr/
rm *
cp ~/slides/*.html /usr/share/ubiquity-slideshow/slides/l10n/fr/

echo "${vert}Install background & Slides ... Done${neutre}"

# /********************************************************************************************************/
# /* Part4 : locale */

cd /usr/share/localechooser/

echo "en;0;US;en_US.UTF-8;;console-setup
fr;1;FR;fr_FR.UTF-8;;console-setup" > languagelist

echo "en
fr" > shortlists

gunzip languagelist.data.gz 
echo "0:en:English:English
1:fr:French:Français" > languagelist.data
gzip languagelist.data


cd /usr/lib/ubiquity/localechooser
cp /usr/share/localechooser/languagelist ./
cp /usr/share/localechooser/languagelist.data.gz ./
cp /usr/share/localechooser/regionmap ./           
cp /usr/share/localechooser/shortlists ./

echo "${vert}Local settings ... Done${neutre}"

# /********************************************************************************************************/
# /* Part5 : account creation */
echo "yes" > /etc/skel/.config/gnome-initial-setup-done

# cd /usr/share/polkit-1/actions/
# gedit org.freedesktop.NetworkManager.policy
# System policy prevents modification of network settings for all users
# and change to <allow_active>yes</allow_active>

echo "${vert}Gnome setup ... Done${neutre}"

# /********************************************************************************/
# /* Part6 : Icons

cd /usr/share/icons/
mkdir interaactionBox
cp ~/Ressources/icons/* /usr/share/icons/interaactionBox
echo "${vert}Install icons ... Done${neutre}"

# /********************************************************************************/
# /* Part7 : Splash Screen

cd ~/Ressources/interAACtionBox-Splash-Screen
./splashScreenInstall

echo "${vert}Install of InterAACtionBox splash screen ... Done${neutre}"

# /********************************************************************************/
# /* Part8 : Remove pop up

# Software problem detected

rm /var/crash/*
sed -i 's/enabled=1/enabled=0/' /etc/default/apport

# Update software

sed -i 's/APT::Periodic::Update-Package-Lists "[0-9]";/APT::Periodic::Update-Package-Lists "0";/' /etc/apt/apt.conf.d/10periodic
apt-get -y remove update-notifier 2>>errorAptGet.log 1>>/etc/skel/log/purgeApp.log

echo "${vert}Pop-up settings ... Done${neutre}"

# /********************************************************************************/
# /* Part9 : Remove unecessary file

cd ~
rm -R *

echo "${vert}Remove unecessary files ... Done${neutre}"

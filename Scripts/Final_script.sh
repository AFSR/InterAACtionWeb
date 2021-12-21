
# /********************************************************************************************************/
# /* Part1 : Internet Connection and deb Libs installation */

# /**
# ** Copy the libs folder to cubic
# **/


# /* IF INTERNET DOESNT WORK
rm -r /etc/resolv.conf
touch /etc/resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf

cd Libs/

echo "deb http://fr.archive.ubuntu.com/ubuntu/ focal main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ focal-security main restricted
deb http://archive.ubuntu.com/ubuntu/ focal-updates main restricted
" > /etc/apt/sources.list
apt-get update
apt-get -y install build-essential
apt-get -y install curl
apt-get -y install ./*.deb
apt-get -y install google-chrome-stable

# /********************************************************************************************************/
# /* Part2 : Set-Up GazePlay, InteraactionScene and Tobii */

cp -r ~/InterAACtionBox_Interface-linux /etc/skel/
cd /etc/skel/InterAACtionBox_Interface-linux/lib/jre/bin/
chmod +x java
cd /etc/skel/InterAACtionBox_Interface-linux/bin/
dos2unix interaactionBoxOS-linux.sh
cd ./scripts/
dos2unix ./*

cd ~/ISOScripts/
sh ./gazeplayUpdate.sh
sh ./interAACtionGazeUpdate.sh 

mkdir /etc/skel/dist
sh ./interAACtionSceneUpdate.sh
sh ./interAACtionPlayerUpdate.sh
sh ./augcomUpdate.sh

# /********************************************************************************************************/
# /* Part3 : Create Desktop Shortcut */

cd /etc/skel
mkdir Desktop
cd Desktop/

cp -R ~/Ressources/.email /etc/skel/
cp ~/Ressources/interaactionBoxLauncher /etc/skel/
cd /etc/skel/
chmod +x interaactionBoxLauncher

mkdir .config
cd .config
mkdir autostart

cd /etc/skel/
mkdir .local/
mkdir .local/share
mkdir .local/share/applications
cp ~/Ressources/DesktopFiles/*.desktop  .local/share/applications
chmod a+x /etc/skel/.local/share/applications
cp ~/Ressources/DesktopFiles/InteraactionBoxLauncher.desktop /etc/skel/.config/autostart
chmod a+x /etc/skel/.config/autostart/InteraactionBoxLauncher.desktop

cp -R ~/Ressources/Launcher /etc/skel/
chmod a+x /etc/skel/Launcher/*

# dbus-launch gio set InteraactionBoxLauncher.desktop "metadata::trusted" true

mkdir /etc/skel/Update
cp -R ~/Scripts/* /etc/skel/Update

# /********************************************************************************************************/
# /* Part4 : Choose the default wallpaper and modify slides*/

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

# /********************************************************************************************************/
# /* Part6 : locale */

cd /usr/share/localechooser/

echo "fr;0;FR;fr_FR.UTF-8;;console-setup
en;1;US;en_US.UTF-8;;console-setup" > languagelist

echo "en
fr" > shortlists

gunzip languagelist.data.gz 
echo "1:en:English:English
0:fr:French:Français" > languagelist.data 
gzip languagelist.data


cd /usr/lib/ubiquity/localechooser
cp /usr/share/localechooser/languagelist ./
cp /usr/share/localechooser/languagelist.data.gz ./
cp /usr/share/localechooser/regionmap ./           
cp /usr/share/localechooser/shortlists ./

# /********************************************************************************************************/
# /* Part7 : account creation */
echo "yes" > /etc/skel/.config/gnome-initial-setup-done

# cd /usr/share/polkit-1/actions/
# gedit org.freedesktop.NetworkManager.policy
# System policy prevents modification of network settings for all users
# and change to <allow_active>yes</allow_active>


# /********************************************************************************/
# /* ICONS
cd /usr/share/icons/
mkdir interaaction
cp ~/Ressources/icons/* /usr/share/icons/interaaction


# /********************************************************************************************************/
# /* Part1: Internet Connection and deb Libs installation */

# /**
# ** Copy the libs folder to cubic
# **/

cd libs/

rm -r /etc/resolv.conf
touch /etc/resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf

apt install ./dos2unix_7.4.0-2_amd64.deb ./gconf2_3.2.6-6ubuntu1_amd64.deb ./gconf2-common_3.2.6-6ubuntu1_all.deb ./gconf-service_3.2.6-6ubuntu1_amd64.deb ./gconf-service-backend_3.2.6-6ubuntu1_amd64.deb ./libappindicator1_12.10.1+18.04.20180322.1-0ubuntu1_amd64.deb ./libdbusmenu-gtk4_16.04.1+18.04.20171206-0ubuntu1_amd64.deb ./libgconf-2-4_3.2.6-6ubuntu1_amd64.deb ./libindicator7_12.10.2+16.04.20151208-0ubuntu1_amd64.deb ./TobiiProEyeTrackerManager-2.1.2.deb ./multiarch-support_2.27-3ubuntu1_amd64.deb ./google-chrome-stable_current_amd64.deb ./xdotool_3.20160805.1-4_amd64.deb

add-apt-repository ppa:xalt7x/chromium-deb-vaapi
cat <<EOF | tee /etc/apt/preferences.d/pin-xalt7x-chromium-deb-vaapi
Package: *
Pin: release o=LP-PPA-xalt7x-chromium-deb-vaapi
Pin-Priority: 1337
EOF
apt update
apt install chromium-browser

cd ../
rm -r libs/



# /********************************************************************************************************/
# /* Part2 : Set-Up GazePlay, InteraactionScene and Tobii */

cd /etc/skel

# /**
# ** Copy the Gazeplay and InteraactionScene-Linux folders to cubic
# **/

echo "deb http://archive.ubuntu.com/ubuntu/ $(lsb_release -cs)-proposed main" | tee /etc/apt/sources.list.d/proposed-repositories.list
apt update
apt -t $(lsb_release -cs)-proposed install zsys
rm /etc/apt/sources.list.d/proposed-repositories.list
apt update

cd gazeplay-linux-x64-1.8.2-SNAPSHOT/tobiiDrivers/drivers/deps/
apt install build-essential ./libsqlcipher0_3.4.1-1build1_amd64.deb ./libuv0.10_0.10.22-2_amd64.deb

cd ../
apt install ./tobii_engine_linux-0.1.6.193_rc-Linux.deb ./tobiiusbservice_l64U14_2.1.5-28fd4a.deb

cd ../../lib/jre/bin/
chmod +x java

cd ../../../../
cd interaactionBoxOs-linux/lib/jre/bin/
chmod +x java

cd ../../../bin
dos2unix interaactionBoxOS-linux.sh

# /********************************************************************************************************/
# /* Part3 : Create Desktop Shortcut */

cd /etc/skel
mkdir Desktop
cd Desktop

# /**
# ** Copy the interaactionBoxLauncher file to cubic
# **/

chmod +x interaactionBoxLauncher
cd /etc/skel/
mkdir .config
cd .config
echo "
[Desktop Entry]
Type=Application
Exec=./Desktop/interaactionBoxLauncher
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name[fr_FR]=interaactionBox
Name=interaactionBox
Comment[fr_FR]=
Comment=
" > interaactionBoxLauncher.desktop

# /********************************************************************************************************/
# /* Part4 : Choose the default wallpaper */

cd /usr/share/backgrounds/

# /**
# ** Copy the wallpaper image wallpaper_interaactionBox.png to cubic
# **/

sed -i 's/\<filename\>.*\<\/filename\>/\<filename\>\/usr\/share\/backgrounds\/wallpaper_interaactionBox.png\<\/filename\>/' /usr/share/gnome-background-properties/ubuntu-wallpapers.xml

sed -i 's/<\/wallpapers>/ \<wallpaper\>\n     \<name\>InteraactionBox wallpaper\<\/name\>\n     \<filename\>\/usr\/share\/backgrounds\/wallpaper_interaactionBox.png\<\/filename\>\n     \<options\>zoom\<\/options\>\n     \<pcolor\>#000000\<\/pcolor\>\n     \<scolor\>#000000\<\/scolor\>\n     \<shade_type\>solid\<\/shade_type\>\n \<\/wallpaper\>\n\<\/wallpapers\>/' focal-wallpapers.xml

sed -i "s@picture-uri.*\'@picture-uri = \'file:///usr/share/backgrounds/wallpaper_interaactionBox.png\'@g" 10_ubuntu-settings.gschema.override

glib-compile-schemas /usr/share/glib-2.0/schemas/


# /********************************************************************************************************/
# /* PartSpot : spotify */
apt-get install curl
curl -sS https://download.spotify.com/debian/pubkey_0D811D58.gpg | apt-key add -
echo "deb http://repository.spotify.com stable non-free" | tee /etc/apt/sources.list.d/spotify.list
apt-get update
apt-get install spotify-client

snap install ffmpeg

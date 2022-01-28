
# /********************************************************************************************************/
# /* Part1 : Internet Connection, remove unecessary applications and installation of important applications */

mkdir /etc/skel/log

rm -r /etc/resolv.conf
touch /etc/resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo -e "\E[32m Internet configuration ... Done \E[0m"

apt-get -y purge firefox 2>>errorAptGet.log 1>>/etc/skel/log/purgeApp.log
echo -e "\E[32m Delete unecessary file ... Done \E[0m"

echo "deb http://fr.archive.ubuntu.com/ubuntu/ focal main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ focal-security main restricted
deb http://archive.ubuntu.com/ubuntu/ focal-updates main restricted
" > /etc/apt/sources.list

apt-get update 2>>errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install build-essential 2>>errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install curl 2>>errorAptGet.log 1>>/etc/skel/log/installApp.log
echo -e "\E[32m Install necessary file ... Done \E[0m"


# /********************************************************************************************************/
# /* Part2 : Download main installation files */

LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/InterAACtionBox/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionBox-main*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionBox-main*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd ~/ || exit

echo "Download of ${NEW_VERSION_NAME}"

wget $NEW_VERSION_LINK

tar -zxvf "${NEW_VERSION}" >>/etc/skel/log/tarInterAACtionBox.log

rm -r "${NEW_VERSION}"

echo -e "\E[32m Download files of InterAACtionBox ... Done \E[0m"

# /********************************************************************************************************/
# /* Part3 : deb Libs installation  */

cd ~/Libs/
apt-get -y install ./*.deb 2>>errorAptGet.log 1>>/etc/skel/log/installDeb.log

cd ~/ISOScripts/
dos2unix ./* >>/etc/skel/log/dos2unix.log

cd ~/Scripts/
dos2unix ./* >>/etc/skel/log/dos2unix.log

cd ~/Launcher/
dos2unix ./* >>/etc/skel/log/dos2unix.log

cd ~/Ressources/
dos2unix interaactionBoxLauncher >>/etc/skel/log/dos2unix.log

cd ~/Ressources/interAACtionBox-Splash-Screen/
dos2unix splashScreenInstall >>/etc/skel/log/dos2unix.log
chmod +x splashScreenInstall

echo -e "\E[32m Install necessary file ... Done \E[0m"

# /********************************************************************************************************/
# /* Part4 : Google Chrome CORS installation  */

apt-get -y install google-chrome-stable 2>>errorAptGet.log 1>>/etc/skel/log/installApp.log

sh ~/ISOScripts/corsInstall.sh

cd /etc/skel/
mkdir .config

cp -R ~/Ressources/google-chrome /etc/skel/.config

echo -e "\E[32m Install & Configure Google Chrome ... Done \E[0m"

# /********************************************************************************************************/
# /* Part5 : run main installation */
sh ~/ISOScripts/interAACtionBoxInstall.sh

echo -e "\E[32m Install of InterAACtionBox sucessful ! \E[0m"

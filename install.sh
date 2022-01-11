
# /********************************************************************************************************/
# /* Part1 : Internet Connection, remove unecessary applications and installation of important applications */

rm -r /etc/resolv.conf
touch /etc/resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf

apt-get -y purge firefox

echo "deb http://fr.archive.ubuntu.com/ubuntu/ focal main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ focal-security main restricted
deb http://archive.ubuntu.com/ubuntu/ focal-updates main restricted
" > /etc/apt/sources.list
apt-get update
apt-get -y install build-essential
apt-get -y install curl

# /********************************************************************************************************/
# /* Part2 : Download main installation files */

LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/InterAACtionBox/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionBox-main*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionBox-main*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd ~/ || exit

echo "téléchargement de la version ${NEW_VERSION_NAME} en utilisant le lien ${NEW_VERSION_LINK}"

wget $NEW_VERSION_LINK

echo "extraction de l'archive ${NEW_VERSION}"

tar -zxvf "${NEW_VERSION}"

echo "suppression de l'archive ${NEW_VERSION}"

rm -r "${NEW_VERSION}"

# /********************************************************************************************************/
# /* Part3 : deb Libs installation  */
cd ~/Libs/

apt-get -y install ./*.deb
apt-get -y install google-chrome-stable

cd ~/ISOScripts/
dos2unix ./*

cd ~/Scripts/
dos2unix ./*

cd ~/Launcher/
dos2unix ./*

cd ~/Ressources/
dos2unix interaactionBoxLauncher

# /********************************************************************************************************/
# /* Part4 : run main installation */
sh ~/ISOScripts/interAACtionBoxInstall.sh

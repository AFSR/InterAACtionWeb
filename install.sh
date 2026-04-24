
# /********************************************************************************************************/
# /* PartO : Color of message */

neutre='\e[0;m'
vert='\e[0;32m'

# /********************************************************************************************************/
# /* Part1 : Internet Connection, remove unnecessary applications and installation of important applications */

mkdir /etc/skel/log

# Ensure DNS resolution works inside Cubic's chroot. Cubic ships a
# symlink to systemd-resolved's stub, but the stub isn't running in
# the chroot, so name resolution must be bootstrapped. We only fill
# /etc/resolv.conf when it is missing or empty, and we prefer the
# loopback stub (127.0.0.53) used by systemd-resolved, falling back
# to common public resolvers if it is not available at runtime. This
# avoids silently overriding the host's DNS policy, which is important
# for a device destined for medical/educational environments where
# operators may run their own resolver.
if [ ! -s /etc/resolv.conf ]; then
	{
		echo "# Generated during ISO build (see install.sh)."
		echo "# On first boot, systemd-resolved will manage this file."
		echo "nameserver 127.0.0.53"
		echo "nameserver 1.1.1.1"
		echo "nameserver 9.9.9.9"
	} > /etc/resolv.conf
fi
echo "${vert}Internet configuration ... Done${neutre}"

apt-get -y purge firefox 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/purgeApp.log
echo "${vert}Delete unnecessary file ... Done${neutre}"

echo "deb http://fr.archive.ubuntu.com/ubuntu/ focal main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ focal-security main restricted
deb http://archive.ubuntu.com/ubuntu/ focal-updates main restricted
" > /etc/apt/sources.list

apt-get update 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install build-essential 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install curl 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install yad 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install msmtp msmtp-mta 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install bsd-mailx 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/installApp.log
apt-get -y install grub-efi-amd64-signed 2>>/etc/skel/log/errorAptGet.log 1>>/etc/skel/log/installApp.log
echo "${vert}Install necessary file ... Done${neutre}"

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

echo "${vert}Download files of InterAACtionBox ... Done${neutre}"

# /********************************************************************************************************/
# /* Part3 : deb Libs installation  */

cd ~/Libs/
apt-get -y install ./*.deb 2>>errorAptGet.log 1>>/etc/skel/log/installDeb.log

cd ~/ISOScripts/
dos2unix ./* 2>>/etc/skel/log/dos2unix.log

cd ~/Scripts/
dos2unix ./* 2>>/etc/skel/log/dos2unix.log

cd ~/Ressources/Launcher/
dos2unix ./* 2>>/etc/skel/log/dos2unix.log

cd ~/Ressources/splashScreenBox/
dos2unix install 2>>/etc/skel/log/dos2unix.log
chmod +x install

echo "${vert}Install necessary file ... Done${neutre}"

# /********************************************************************************************************/
# /* Part4 : Google Chrome CORS installation  */

apt-get -y install google-chrome-stable 2>>errorAptGet.log 1>>/etc/skel/log/installApp.log

sh ~/ISOScripts/corsInstall.sh

cd /etc/skel/
mkdir .config

cp -R ~/Ressources/google-chrome /etc/skel/.config

# sed -i '/^Exec=/s/$/ --password-store=basic %U/' /usr/share/applications/google-chrome.desktop

echo "${vert}Install & Configure Google Chrome ... Done${neutre}"

# /********************************************************************************************************/
# /* Part5 : run main installation */
sh ~/ISOScripts/interAACtionBoxInstall.sh

echo "${vert}Install of InterAACtionBox sucessful !${neutre}"

interfaceName=$(find $HOME/* -name "InterAACtionBox_Interface-linux")
rm -r "$interfaceName"

LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/InteraactionGroup/InterAACtionBox_Interface/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionBox_Interface-linux*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionBox_Interface-linux*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd ~/ || exit

echo "Download of ${NEW_VERSION_NAME}"

wget $NEW_VERSION_LINK

tar -zxvf "${NEW_VERSION}"

rm -r "${NEW_VERSION}"

cd /etc/skel/InterAACtionBox_Interface-linux/lib/jre/bin/
chmod +x java
cd /etc/skel/InterAACtionBox_Interface-linux/bin/
dos2unix ./*
cd ./scripts/
dos2unix ./*
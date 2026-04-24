#!/bin/sh
neutre='\e[0;m'
vert='\e[0;32m'

LATEST_RELEASE_INFO=$(curl -fsSL https://api.github.com/repos/InteraactionGroup/InterAACtionBox_Interface/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | jq -r '.assets[] | select(.name | test("InterAACtionBox_Interface-linux")) | .browser_download_url' | head -n 1)

NEW_VERSION=$(basename "$NEW_VERSION_LINK")

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | jq -r '.name')

cd /etc/skel/ || exit

echo "Download of ${NEW_VERSION_NAME}"

wget "$NEW_VERSION_LINK"

tar -zxf "${NEW_VERSION}" >>/etc/skel/log/tarInterAACtionBoxInterface.log

rm *.tar.gz

cd /etc/skel/InterAACtionBox_Interface-linux/lib/jre/bin/
chmod +x java
cd /etc/skel/InterAACtionBox_Interface-linux/bin/
dos2unix ./* 2>>/etc/skel/log/dos2unix.log
cd ./scripts/
dos2unix ./* 2>>/etc/skel/log/dos2unix.log

echo "${vert}Download of InterAACtionBox_Interface ... Done${neutre}"

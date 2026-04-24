#!/bin/sh
neutre='\e[0;m'
vert='\e[0;32m'

LATEST_RELEASE_INFO=$(curl -fsSL https://api.github.com/repos/AFSR/InterAACtionScene-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | jq -r '.assets[] | select(.name | test("InterAACtionScene.tar.gz")) | .browser_download_url' | head -n 1)

NEW_VERSION=$(basename "$NEW_VERSION_LINK")

NEW_VERSION_NO_EXT=$(echo "${NEW_VERSION}" | cut -d. -f1)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | jq -r '.name')

cd /etc/skel/dist || exit

echo "Download of ${NEW_VERSION_NAME}"

wget "$NEW_VERSION_LINK"

tar -zxf "${NEW_VERSION}" >>/etc/skel/log/tarInterAACtionScene.log

rm *.tar.gz

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

echo "${vert}Download of InterAACtionScene ... Done${neutre}"

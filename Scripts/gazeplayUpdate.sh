#!/bin/sh
gazeplayName=$(find $HOME/* -name "*GazePlay-AFSR*")
rm -r "$gazeplayName"

LATEST_RELEASE_INFO=$(curl -fsSL https://api.github.com/repos/AFSR/GazePlay-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | jq -r '.assets[] | select(.name | test("gazeplay-linux")) | .browser_download_url' | head -n 1)

NEW_VERSION=$(basename "$NEW_VERSION_LINK")

TAG_VERSION=$(echo "$LATEST_RELEASE_INFO" | jq -r '.tag_name')

NEW_VERSION_NO_EXT=$(echo "${NEW_VERSION}" | cut -d. -f1)

NEW_NAME="$NEW_VERSION_NO_EXT-$TAG_VERSION"

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | jq -r '.name')

cd ~/ || exit

echo "Download of ${NEW_NAME}"

wget "$NEW_VERSION_LINK"

tar -zxf "${NEW_VERSION}"

rm *.tar.gz

mv "${NEW_NAME}" "${NEW_VERSION_NAME}"

cd "$HOME/${NEW_VERSION_NAME}/lib/jre/bin/"
chmod +x java
cd ../../../bin
dos2unix gazeplay-linux.sh
dos2unix gazeplay-afsr-linux.sh

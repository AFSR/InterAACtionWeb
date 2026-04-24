#!/bin/sh
sceneName=$(find "$HOME/dist/" -name "*InterAACtionScene-AFSR*")
rm -r "$sceneName"

LATEST_RELEASE_INFO=$(curl -fsSL https://api.github.com/repos/AFSR/InterAACtionScene-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | jq -r '.assets[] | select(.name | test("InterAACtionScene.tar.gz")) | .browser_download_url' | head -n 1)

NEW_VERSION=$(basename "$NEW_VERSION_LINK")

NEW_VERSION_NO_EXT=$(echo "${NEW_VERSION}" | cut -d. -f1)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | jq -r '.name')

cd ~/dist || exit

echo "Download of ${NEW_VERSION_NAME}"

wget "$NEW_VERSION_LINK"

tar -zxf "${NEW_VERSION}"

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

ls | grep -i "InterAACtionScene.*" | egrep -v "^(${NEW_VERSION_NAME}$)" | while read -r line; do
rm -rf "${line}";
rm -rf " ${line}";
done

fuser -k 4201/tcp

if [ -d ~/.cache/google-chrome/Default ]; then
	rm -r ~/.cache/google-chrome/Default
fi

INTERAACTIONSCENE_DIRECTORY=$(ls ~/dist | grep "InterAACtionScene" | head -n 1)
if [ ! "$INTERAACTIONSCENE_DIRECTORY" = "" ]; then
	INTERAACTIONSCENE_PATH="$HOME/dist/${INTERAACTIONSCENE_DIRECTORY}"
	if [ -d "$INTERAACTIONSCENE_PATH" ]; then
	  cd "$INTERAACTIONSCENE_PATH" || exit
	  python3 -m http.server 4201 >InterAACtionScene.log &
	fi
fi

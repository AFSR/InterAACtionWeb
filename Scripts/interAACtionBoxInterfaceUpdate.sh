#!/bin/sh

actualLanguage=$LANG

title="Update"
text="Update of InterAACtionBox Interface !"

if [ "$actualLanguage" = "fr_FR.UTF-8" ]; then
	title="Mise à jour"
	text="Mise à jour d'InterAACtionBox Interface !"
fi

cd ~/ || exit

url=$(curl -fsSL https://api.github.com/repos/InteraactionGroup/InterAACtionBox_Interface/releases/latest)
curl_url=$(echo "$url" | jq -r '.assets[] | select(.name | test("InterAACtionBox_Interface-linux")) | .browser_download_url' | head -n 1)
nameFile=$(basename "$curl_url")

wget "$curl_url" -q --show-progress 2>&1 |
sed -nru '/[0-9]{1,3}%/ {s/.*[^0-9]([0-9]{1,3}%).*/\1/;p}' | xargs -L 1 |
zenity --progress \
	--title="$title" \
	--text="$text" \
	--percentage=0 \
  	--width=400 \
  	--height=100

if [ $? -eq 1 ]; then
  rm $nameFile
else
	interfaceName=$(find $HOME/* -name "InterAACtionBox_Interface-linux")
  rm -r "$interfaceName"

  LATEST_RELEASE_INFO=$(curl -fsSL https://api.github.com/repos/InteraactionGroup/InterAACtionBox_Interface/releases/latest)

  NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | jq -r '.assets[] | select(.name | test("InterAACtionBox_Interface-linux")) | .browser_download_url' | head -n 1)

  NEW_VERSION=$(basename "$NEW_VERSION_LINK")

  NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | jq -r '.name')

  cd ~/ || exit

  tar -zxf "${NEW_VERSION}"

  rm -r "${NEW_VERSION}"

  cd ~/InterAACtionBox_Interface-linux/lib/jre/bin/
  chmod +x java
  cd ~/InterAACtionBox_Interface-linux/bin/
  dos2unix ./*
  cd ~/InterAACtionBox_Interface-linux/bin/scripts/
  dos2unix ./*
fi

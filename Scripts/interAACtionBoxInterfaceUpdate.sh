#!/bin/sh

actualLanguage=$LANG

title="Update"
text="Update of InterAACtionBox Interface !"

if [ "$actualLanguage" = "fr_FR.UTF-8" ]; then
	title="Mise à jour"
	text="Mise à jour d'InterAACtionBox Interface !"
fi

cd ~/ || exit

url=$(curl -s https://api.github.com/repos/InteraactionGroup/InterAACtionBox_Interface/releases/latest)
curl_url=$(echo "$url" | grep "browser_download_url.*InterAACtionScene*" | cut -d: -f2,3 | tr -d \")
nameFile=$(echo $curl_url | -d/ -f9)

wget $curl_url -q --show-progress 2>&1 |
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

  LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/InteraactionGroup/InterAACtionBox_Interface/releases/latest)

  NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionBox_Interface-linux*" | cut -d: -f2,3 | tr -d \")

  NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

  NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionBox_Interface-linux*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

  cd ~/ || exit

  tar -zxvf "${NEW_VERSION}"

  rm -r "${NEW_VERSION}"

  cd ~/InterAACtionBox_Interface-linux/lib/jre/bin/
  chmod +x java
  cd ~/InterAACtionBox_Interface-linux/bin/
  dos2unix ./*
  cd ~/InterAACtionBox_Interface-linux/bin/scripts/
  dos2unix ./*
fi

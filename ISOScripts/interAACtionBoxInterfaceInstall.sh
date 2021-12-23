LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/InteraactionGroup/InterAACtionBox_Interface/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionBox_Interface-linux*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionBox_Interface-linux*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd ~/ || exit

echo "téléchargement de la version ${NEW_VERSION_NAME} en utilisant le lien ${NEW_VERSION_LINK}"

wget $NEW_VERSION_LINK

echo "extraction de l'archive ${NEW_VERSION}"

tar -zxvf "${NEW_VERSION}"

echo "suppression de l'archive ${NEW_VERSION}"

rm -r "${NEW_VERSION}"

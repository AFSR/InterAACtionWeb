LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/InteraactionGroup/InteraactionGaze/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*interAACtionGaze-linux*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1)

NEW_VERSION_NAME="InterAACtionGaze"

NEW_VERSION_NAME_TEMP="InterAACtionGazeTEMP"

cd ~ || exit

echo "téléchargement de la version ${NEW_VERSION_NAME} en utilisant le lien ${NEW_VERSION_LINK}"

wget $NEW_VERSION_LINK

echo "extraction de l'archive ${NEW_VERSION}"

tar -zxvf "${NEW_VERSION}"

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME_TEMP}"

echo "supression de l'ancienne version"

ls | grep "InterAACtionGaze*" | egrep -v "^(${NEW_VERSION_NAME_TEMP}$)" | while read -r line; do
rm -rf "${line}";
rm -rf " ${line}";
done

ls | grep "interAACtionGaze-linux*" | egrep -v "^(${NEW_VERSION_NAME_TEMP}$)" | while read -r line; do
rm -rf "${line}";
rm -rf " ${line}";
done


mv "${NEW_VERSION_NAME_TEMP}" "${NEW_VERSION_NAME}"
cd "../${NEW_VERSION_NAME}"
dos2unix bin/interAACtionGaze-linux.sh
chmod +x lib/jre/bin/java

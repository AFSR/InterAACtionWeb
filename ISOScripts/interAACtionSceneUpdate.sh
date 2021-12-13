LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/InteraactionScene-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionScene*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionScene*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd /etc/skel/dist || exit

echo "téléchargement de la version ${NEW_VERSION_NAME} en utilisant le lien ${NEW_VERSION_LINK}"

wget $NEW_VERSION_LINK

echo "extraction de l'archive ${NEW_VERSION}"

tar -zxvf "${NEW_VERSION}"

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

echo "supression de l'ancienne version"

ls | grep -i "InterAACtionScene.*" | egrep -v "^(${NEW_VERSION_NAME}$)" | while read -r line; do 
rm -rf "${line}"; 
rm -rf " ${line}"; 
done


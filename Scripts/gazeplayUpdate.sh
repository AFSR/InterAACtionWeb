LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/GazePlay-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*gazeplay-linux*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo ${NEW_VERSION_LINK} | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1,2,3)

cd ~/ || exit

echo "téléchargement de la version ${NEW_VERSION_NO_EXT} en utilisant le lien ${NEW_VERSION_LINK}"

wget $NEW_VERSION_LINK

echo "extraction de l'archive ${NEW_VERSION}"

tar -zxvf ${NEW_VERSION}

echo "supression de l'ancienne version"

ls | grep "gazeplay-linux.*" | egrep -v "^(${NEW_VERSION_NO_EXT}$)" | while read -r line; do 
rm -rf "${line}"; 
rm -rf " ${line}"; 
done

cd ~/interaactionBox_Interface-linux/bin || exit

echo "../../${NEW_VERSION_NO_EXT}" > configuration.conf


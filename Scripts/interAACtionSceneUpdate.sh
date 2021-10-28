LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/InteraactionScene-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionScene*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionScene*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd ~/dist || exit

echo "téléchargement de la version ${NEW_VERSION_NAME} en utilisant le lien ${NEW_VERSION_LINK}"

wget $NEW_VERSION_LINK

echo "extraction de l'archive ${NEW_VERSION}"

tar -zxvf "${NEW_VERSION}"

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

echo "supression de l'ancienne version"

ls | grep "InterAACtionScene.*" | egrep -v "^(${NEW_VERSION_NAME}$)" | while read -r line; do 
rm -rf "${line}"; 
rm -rf " ${line}"; 
done

fuser -k 8081/tcp

if [ -d ~/.cache/google-chrome/Default ]; then
	rm -r ~/.cache/google-chrome/Default
fi

INTERAACTIONSCENE_DIRECTORY=$(ls ~/dist | grep "InterAACtionScene" | head -n 1)
if [ ! "$INTERAACTIONSCENE_DIRECTORY" = "" ]; then
  INTERAACTIONSCENE_PATH="$HOME/dist/${INTERAACTIONSCENE_DIRECTORY}"
  if [ -d "$INTERAACTIONSCENE_PATH" ]; then
    cd "$INTERAACTIONSCENE_PATH" || exit
    python3 -m http.server 8081 >InterAACtionScene.log &
  fi
fi

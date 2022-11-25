augcomName=$(find "$HOME/dist/" -name "*AugCom-AFSR*")
rm -r "$augcomName"

LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/AugCom-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*AugCom.tar.gz*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*AugCom*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd ~/dist || exit

echo "Download of ${NEW_VERSION_NAME}"

wget $NEW_VERSION_LINK

tar -zxvf "${NEW_VERSION}"

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

ls | grep -i "AugCom.*" | egrep -v "^(${NEW_VERSION_NAME}$)" | while read -r line; do 
rm -rf "${line}"; 
rm -rf " ${line}"; 
done

fuser -k 4200/tcp

if [ -d ~/.cache/google-chrome/Default ]; then
	rm -r ~/.cache/google-chrome/Default
fi

AUGCOM_DIRECTORY=$(ls ~/dist | grep "AugCom" | head -n 1)
if [ ! "$AUGCOM_DIRECTORY" = "" ]; then
	AUGCOM_PATH="$HOME/dist/${AUGCOM_DIRECTORY}"
	if [ -d "$AUGCOM_PATH" ]; then
	  cd "$AUGCOM_PATH" || exit
	  python3 -m http.server 4200 >AugCom.log &
	fi
fi

playerName=$(find "$HOME/dist/" -name "*InterAACtionPlayer-AFSR*")
rm -r "$playerName"

LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/InterAACtionPlayer-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionPlayer*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionPlayer*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd ~/dist || exit

echo "Download of ${NEW_VERSION_NAME}"

wget $NEW_VERSION_LINK

tar -zxvf "${NEW_VERSION}"

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

ls | grep -i "InterAACtionPlayer.*" | egrep -v "^(${NEW_VERSION_NAME}$)" | while read -r line; do
rm -rf "${line}";
rm -rf " ${line}";
done

fuser -k 4202/tcp

if [ -d ~/.cache/google-chrome/Default ]; then
	rm -r ~/.cache/google-chrome/Default
fi

INTERAACTIONPLAYER_DIRECTORY=$(ls ~/dist | grep "InterAACtionPlayer" | head -n 1)
if [ ! "$INTERAACTIONPLAYER_DIRECTORY" = "" ]; then
  INTERAACTIONPLAYER_PATH="$HOME/dist/${INTERAACTIONPLAYER_DIRECTORY}"
  if [ -d "$INTERAACTIONPLAYER_PATH" ]; then
    cd "$INTERAACTIONPLAYER_PATH" || exit
	  python3 -m http.server 4202 >InterAACtionPlayer.log &
	fi
fi

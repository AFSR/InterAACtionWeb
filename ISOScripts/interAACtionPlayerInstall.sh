neutre='\e[0;m'
vert='\e[0;32m'

LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/InterAACtionPlayer-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*InterAACtionPlayer.tar.gz*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo "${NEW_VERSION_LINK}" | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*InterAACtionPlayer*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd /etc/skel/dist || exit

echo "Download of ${NEW_VERSION_NAME}"

wget $NEW_VERSION_LINK

tar -zxvf "${NEW_VERSION}" >>/etc/skel/log/tarInterAACtionPlayer.log

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

ls | grep -i "InterAACtionPlayer.*" | egrep -v "^(${NEW_VERSION_NAME}$)" | while read -r line; do
rm -rf "${line}";
rm -rf " ${line}";
done

echo "${vert}Download of InterAACtionPlayer ... Done${neutre}"

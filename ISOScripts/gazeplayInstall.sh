neutre='\e[0;m'
vert='\e[0;32m'

LATEST_RELEASE_INFO=$(curl -s https://api.github.com/repos/AFSR/GazePlay-AFSR/releases/latest)

NEW_VERSION_LINK=$(echo "$LATEST_RELEASE_INFO" | grep "browser_download_url.*gazeplay-linux*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo ${NEW_VERSION_LINK} | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1,2,3)

NEW_VERSION_NAME=$(echo "$LATEST_RELEASE_INFO" | grep "name.*GazePlay*" | cut -d: -f2,3 | tr -d \" | head -n 1 | tr -d \,)

cd /etc/skel || exit

echo "Download of ${NEW_VERSION_NO_EXT}"

wget $NEW_VERSION_LINK

tar -zxvf ${NEW_VERSION} >>/etc/skel/log/tarGazePLay.log

mv "${NEW_VERSION_NO_EXT}" "${NEW_VERSION_NAME}"

ls | grep -i "gazeplay-.*" | egrep -v "^(${NEW_VERSION_NAME}$)" | while read -r line; do 
rm -rf "${line}"; 
rm -rf " ${line}"; 
done

cd /etc/skel/InterAACtionBox_Interface-linux/bin || exit

echo "../../${NEW_VERSION_NAME}" > configuration.conf

cd "/etc/skel/${NEW_VERSION_NAME}/lib/jre/bin/"
chmod +x java
cd ../../../bin
dos2unix gazeplay-linux.sh >>/etc/skel/log/dos2unix.log

echo -e "${vert}Download of GazePLay ... Done${neutre}"

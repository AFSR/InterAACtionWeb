#!/bin/bash

NEW_VERSION_LINK=$(curl -s https://api.github.com/repos/AFSR/GazePlay-AFSR/releases/latest | grep "browser_download_url.*gazeplay-linux*" | cut -d: -f2,3 | tr -d \")

NEW_VERSION=$( echo ${NEW_VERSION_LINK} | cut -d/ -f9)

NEW_VERSION_NO_EXT=$( echo ${NEW_VERSION} | cut -d. -f1,2,3)

cd ../

echo "\n téléchargement de la version ${NEW_VERSION_NO_EXT} en utilisant le lien ${NEW_VERSION_LINK} \n"

wget $NEW_VERSION_LINK

echo "\n extraction de l'archive ${NEW_VERSION} \n"

tar -zxvf ${NEW_VERSION}

echo "\n supression de l'ancienne version \n"

ls | grep "gazeplay-linux.*" | egrep -v "^(${NEW_VERSION_NO_EXT}$)" | xargs rm -r

cd ../interaactionBox_Interface-linux/bin

echo "../../${NEW_VERSION_NO_EXT}" > configuration.conf

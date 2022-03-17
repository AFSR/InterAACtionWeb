#!/bin/sh

actualLanguage=$LANG

googleStatus="# Preparing Google Chrome"
gazeplayStatus="# Preparing GazePlay"
augcomStatus="# Preparing AugCom"
sceneStatus="# Preparing InterAACtionScene"
player="# Preparing InterAACtionPlayer"
interfaceStatus="# Launch of InterAACtionBox"
text="Starting the InterAACtionBox"

if [ "$actualLanguage" = "fr_FR.UTF-8" ]; then
	googleStatus="# Préparation de Google Chrome"
	gazeplayStatus="# Préparation de GazePlay"
	augcomStatus="# Préparation de AugCom"
	sceneStatus="# Préparation de InterAACtionScene"
	playerStatus="# Préparation de InterAACtionPlayer"
	interfaceStatus="# Lancement de l'InterAACtionBox"
	text="Démarrage de l'InterAACtionBox"
fi

(
sleep 0.5
echo "0" ;
echo "$googleStatus" ;
	gsettings set org.gnome.desktop.wm.preferences auto-raise 'true'

	fuser -k 4200/tcp
	fuser -k 4201/tcp
	fuser -k 4202/tcp

	if [ -d ~/.cache/google-chrome/Default ]; then
	rm -r ~/.cache/google-chrome/Default
	fi
sleep 0.5	
echo "20" ;
echo "20" ;
echo "$gazeplayStatus" ; 
sleep 0.5
echo "40" ;
echo "$augcomStatus" ; 
	AUGCOM_DIRECTORY=$(ls ~/dist | grep "AugCom" | head -n 1)
	if [ ! "$AUGCOM_DIRECTORY" = "" ]; then
	  AUGCOM_PATH="$HOME/dist/${AUGCOM_DIRECTORY}"
	  if [ -d "$AUGCOM_PATH" ]; then
	    cd "$AUGCOM_PATH" || exit
	    python3 -m http.server 4200 >AugCom.log &
	  fi
	fi
sleep 0.5
echo "60" ; 
echo "$sceneStatus" ; 
	INTERAACTIONSCENE_DIRECTORY=$(ls ~/dist | grep "InterAACtionScene" | head -n 1)
	if [ ! "$INTERAACTIONSCENE_DIRECTORY" = "" ]; then
	  INTERAACTIONSCENE_PATH="$HOME/dist/${INTERAACTIONSCENE_DIRECTORY}"
	  if [ -d "$INTERAACTIONSCENE_PATH" ]; then
	    cd "$INTERAACTIONSCENE_PATH" || exit
	    python3 -m http.server 4201 >InterAACtionScene.log &
	  fi
	fi
sleep 0.5
echo "80" ;
echo "playerStatus" ; 
	INTERAACTIONPLAYER_DIRECTORY=$(ls ~/dist | grep "InterAACtionPlayer" | head -n 1)
	if [ ! "$INTERAACTIONPLAYER_DIRECTORY" = "" ]; then
	  INTERAACTIONPLAYER_PATH="$HOME/dist/${INTERAACTIONPLAYER_DIRECTORY}"
	  if [ -d "$INTERAACTIONPLAYER_PATH" ]; then
	    cd "$INTERAACTIONPLAYER_PATH" || exit
	    python3 -m http.server 4202 >InterAACtionPlayer.log &
	  fi
	fi
sleep 0.5
echo "100" ;
echo "$interfaceStatus" ;
) |
zenity --progress \
  --title="InterAACtionBox" \
  --text="$text" \
  --percentage=0 \
  --width=300 \
  --height=100 \
  --auto-close \
  --no-cancel

cd ~/InterAACtionBox_Interface-linux/bin || exit
sh ./interaactionBoxOS-linux.sh	

#!/bin/sh

valueTobii=$(xdotool search --onlyvisible --class tobii)
startProgress=0
actualLanguage=$LANG

title="Eye Tracker"
text="Preparation for setting up your Eye Tracker"

if [ "$actualLanguage" = "fr_FR.UTF-8" ]; then
	title="Commande oculaire"
	text="Préparation pour la configuration de votre commande oculaire"
fi

(
while [ -z "$valueTobii" ]
do
	echo "$startProgress"; sleep 1
	valueTobii=$(xdotool search --onlyvisible --class tobii)
	startProgress=$(( $startProgress + 4 ))
done
echo "100"; sleep 1
) |
zenity --progress \
	--title="$title" \
	--text="$text" \
	--width=500 \
	--height=100 \
	--percentage=$startProgress \
	--auto-close \
	--no-cancel
	
exit 0

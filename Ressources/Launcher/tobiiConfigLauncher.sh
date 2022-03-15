#!/bin/sh

valueTobii=$(xdotool search --onlyvisible --class tobii)
startProgress=0

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
	--title="Eye Tracker" \
	--text="Préparation pour la configuration de l'Eye Tracker" \
	--width=400 \
	--height=100 \
	--percentage=$startProgress \
	--auto-close
	
exit 0

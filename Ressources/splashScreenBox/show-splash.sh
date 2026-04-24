#!/usr/bin/env bash

# check if runing as root user
if [ "$EUID" -ne 0 ]; then
	echo -e "This script needs to run as root user";
	exit 1;
fi



# starting plymouth daemon to show splashscreen
echo -n "starting plymouthd   ..........................................   ";
plymouthd ;
if [ $? -gt 0 ]; then
	echo -e "\nan error occurred while starting plymouthd" ;
	echo "quitting plymouthd..."
	plymouth --quit ;
	if [ $? -gt 0 ]; then
		echo "an error occurred stopping plymouthd" ;
		echo "plymouthd might be still running in background"
		exit 1;
	fi
	exit 1;
fi
echo "[done]" ;



echo -n "showing currently selected splash screen theme   ...............   ";
plymouth show-splash ;
sleep 5 ;
echo "[done]" ;



echo -n "quitting plymouthd   ...........................................   ";
plymouth --quit ;
if [ $? -gt 0 ]; then
	echo -e "\nan error occurred stopping plymouthd, retrying" ;
	n=0 ;
	while [ $? -gt 0 -a $n -le 20 ]; do
		plymouth --quit ;
		n=$(( n+1 )) ;
	done
fi
echo "[done]" ;



exit 0;

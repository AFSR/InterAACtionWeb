neutre='\e[0;m'
vert='\e[0;32m'
rouge='\e[0;31m'

nbError=0

# /********************************************************************************************************/
# Check install google chrome

if [ ! -d /etc/skel/.config/google-chrome ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of Google Chrome failed !${neutre}"
fi

# /********************************************************************************************************/
# Check install cors

if [ -d /opt/google/chrome/extensions ];
then
  cd /opt/google/chrome/extensions
  fileCors=$(find . -name "lfhmikememgdcahcdlaciloancbhjino.json" | head -n 1 | cut -d/ -f2)
  if [ -z "$fileCors" ]:
  then
    nbError=$(( $nbError + 1 ))
    echo "${rouge}CORS not installed !${neutre}"
  fi
else
  echo "${rouge}Google Chrome not installed !${neutre}"
fi

# /********************************************************************************************************/
# Check install InterAACtionBox_Interface-linux

if [ ! -d /etc/skel/InterAACtionBox_Interface-linux ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of InterAACtionBox_Interface-linux failed !${neutre}"
fi

# /********************************************************************************************************/
# Check install GazePlay-AFSR

cd /etc/skel
fileGazeplay=$(find . -name "*GazePlay*" | head -n 1)
if [ -z "$fileGazeplay" ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of GazePlay-AFSR failed !${neutre}"
fi

# /********************************************************************************************************/
# Check install InterAACtionGaze

if [ ! -d /etc/skel/InterAACtionGaze ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of InterAACtionGaze failed !${neutre}"
fi

# /********************************************************************************************************/
# Check install InterAACtionScene-AFSR, InterAACtionPlayer-AFSR, AugCom-AFSR

if [ -d /etc/skel/dist ];
then

  cd /etc/skel/dist

  # InterAACtionScene-AFSR
  fileScene=$(find . -name "*Scene*" | head -n 1)
  if [ -z "$fileScene" ];
  then
    nbError=$(( $nbError + 1 ))
    echo "${rouge}Install of InterAACtionScene-AFSR failed !${neutre}"
  fi

  # InterAACtionPlayer-AFSR
  filePlayer=$(find . -name "*Player*" | head -n 1)
  if [ -z "$filePlayer" ];
  then
    nbError=$(( $nbError + 1 ))
    echo "${rouge}Install of InterAACtionPlayer-AFSR failed !${neutre}"
  fi

  # AugCom-AFSR
  fileAugcom=$(find . -name "*AugCom*" | head -n 1)
  if [ -z "$fileAugcom" ];
  then
    nbError=$(( $nbError + 1 ))
    echo "${rouge}Install of AugCom-AFSR failed !${neutre}"
  fi

else
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of InterAACtionScene-AFSR, InterAACtionPlayer-AFSR & AugCom-AFSR failed !${neutre}"
fi

# /********************************************************************************************************/
# Check configuration email

if [ ! -f /etc/skel/.msmtprc ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Configuration of email failed !${neutre}"
fi

if [ ! -d /etc/skel/.email ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Configuration of email keys failed !${neutre}"
fi

# /********************************************************************************************************/
# Check shortcuts creation

if [ ! -d /etc/skel/.config/autostart ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Creation of shortcuts failed !${neutre}"
fi

# /********************************************************************************************************/
# Check Launcher files

if [ ! -d /etc/skel/Launcher ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Settings up Launcher files failed !${neutre}"
fi

# /********************************************************************************************************/
# Check Update files

if [ ! -d /etc/skel/Update ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Settings up Update files failed !${neutre}"
fi

# /********************************************************************************************************/
# Check install wallpaper

cd /usr/share/backgrounds
fileWallpaper=$(find . -name "wallpaper_interaactionBox.png" | head -n 1)
if [ -z "$fileWallpaper" ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of wallpaper failed !${neutre}"
fi

# /********************************************************************************************************/
# Check install icons

if [ ! -d /usr/share/icons/interaactionBox ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of icons failed !${neutre}"
fi

# /********************************************************************************************************/
# End of check

if [ "$nbError" -gt "0" ];
then
  echo "${rouge}$nbError found !${neutre}"
else
  echo "${vert}No error found !${neutre}"
fi

exit 0
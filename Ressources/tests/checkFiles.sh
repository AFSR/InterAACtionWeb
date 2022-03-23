neutre='\e[0;m'
vert='\e[0;32m'
rouge='\e[0;31m'

nbError=0

# /********************************************************************************************************/
# Check install google chrome

if [ ! -d /etc/skel/.config/google-chrome ];
then
  nbError=$(( $nbError + 1 ))
  echo "${rouge}Install of Google Chrome fail !${neutre}"
fi

# /********************************************************************************************************/
# Check install cors

if [ -d /opt/google/chrome/extensions ];
then
  cd /opt/google/chrome/extensions
  file=$(find . -name "lfhmikememgdcahcdlaciloancbhjino" | head -n 1)
  if [ -z "$file" ]:
  then
    nbError=$(( $nbError + 1 ))
    echo "${rouge}CORS not installed !${neutre}"
  fi
else
  echo "${rouge}Google Chrome not installed !${neutre}"
fi

# get name file -> $(find . -name "*Scene*" | head -n 1 | cut -d/ -f2)
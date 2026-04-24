var track = [];
var status;

/**
 * Allows to initialize sdk Deezer
 */
function initDeezer(){
  DZ.init({
    appId : '479942',
    channelUrl : 'https://interaactionplayer.imag.fr/stable/',
  });
}

/**
 * Allows to init the Deezer audio player
 */
function initDZPlayer(){
  DZ.init({
    player: {
      container: 'deezerSong',
      width: 500,
      height: 90,
      layout: 'dark',
      onload: function (response){
        console.log('DZ.player is ready', response);
        playTracks();
      }
    }
  })
}

/**
 * Allows to load the music we want to listen into the deezer audio player
 */
var playTracks = function (){
  console.log("Chargement d'une musique");
  DZ.player.playTracks(track);
}

/**
 * Allows to start Deezer audio player
 */
function playDeezer(){
  DZ.player.play();
}

/**
 * Allows to pause Deezer audio player
 */
function pauseDeezer(){
  DZ.player.pause();
}

/**
 * Allows to increase the volume of Deezer audio player
 */
function increaseVolumeDeezer(){
  DZ.player.setVolume(DZ.player.getVolume() + 10);
}

/**
 * Allows to decrease the volume of Deezer audio player
 */
function decreaseVolumeDeezer(){
  DZ.player.setVolume(DZ.player.getVolume() - 10);
}

/**
 * Allows to put the song we want to listen into the playlist
 */
function setTrack(trackId){
  track[0] = trackId;
}

/**
 * Allows to login the user on Deezer
 */
function loginDeezer(){
  DZ.login(function(response){}, {perms: 'basic_access,offline_access'});
}

/**
 * Allows to disconnect the user to Deezer
 */
function logoutDeezer(){
  DZ.logout();
}

function initStatusDeezer(){
  DZ.getLoginStatus(function(response) {
    if (response.authResponse) {
      status = response.status;
    } else {
      status = response.status;
    }
  });
}

function getStatusDeezer(){
  return status;
}

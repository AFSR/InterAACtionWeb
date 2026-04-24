/**
 * Allows to initialise the visualizer
 */
function initVisualizer(){
  window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
  startVisualizer();
}

var startVisualizer = function() {
  var audio = document.getElementById('audio');
  var ctx = new AudioContext();
  var analyser = ctx.createAnalyser();
  var audioSrc = ctx.createMediaElementSource(audio);
  // we have to connect the MediaElementSource with the analyser
  audioSrc.connect(analyser);
  analyser.connect(ctx.destination);

  // we're ready to receive some data!
  var canvas = document.getElementById('canvas'),
    cwidth = canvas.width,
    cheight = canvas.height - 2,
    meterWidth = 10, //width of the meters in the spectrum
    gap = 2, //gap between meters
    capHeight = 2,
    capStyle = '#fff',
    meterNum = 800 / (10 + 2), //count of the meters
    capYPositionArray = []; ////store the vertical position of hte caps for the previous frame
  ctx = canvas.getContext('2d'),
    gradient = ctx.createLinearGradient(0, 0, 0, 300);
  for (var i = 0.0; i<=1.0; i = i + 0.1){
    gradient.addColorStop(i, randomColor());
  }
  // loop
  function renderFrame() {
    var array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var step = Math.round(array.length / meterNum); //sample limited data from the total array
    ctx.clearRect(0, 0, cwidth, cheight);
    for (var i = 0; i < meterNum; i++) {
      var value = array[i * step];
      if (capYPositionArray.length < Math.round(meterNum)) {
        capYPositionArray.push(value);
      };
      ctx.fillStyle = capStyle;
      //draw the cap, with transition effect
      if (value < capYPositionArray[i]) {
        ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
      } else {
        ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
        capYPositionArray[i] = value;
      };
      ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
      ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
    }
    requestAnimationFrame(renderFrame);
  }
  renderFrame();
};

/**
 * @returns {string}
 *
 * Allows to generate a random color
 */
var randomColor = function (){
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i<6; i++){
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

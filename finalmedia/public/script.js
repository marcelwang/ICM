/* global io */
let videow = 200;
let videoh = 150;

// in order to make positions are fully used in one round
// i count all positions and put them into array
// incoming recordings will randomly pick a position (won't pick twice in one round)
// that position is spliced in position's array
class CanvasController {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    this.emptyPositions = [];
    this.initEmptyPosition();
    
    this.videos = [];

  }
  
  // loop through and draw each video in videos array
  drawCanvas() {
    for (let i = 0; i < this.videos.length; i++) {
      this.ctx.drawImage(this.videos[i].src, this.videos[i].position.x, this.videos[i].position.y, videow, videoh);
    }
  }
  
  // initial position
  initEmptyPosition() {
    // number of videos in each line/row depending on browser's size
    let horizontalCount = Math.floor(window.innerWidth / videow);
    let verticalCount = Math.floor(window.innerHeight / videoh);
    
    // count all positions - define value of x/y - push them into array
    for (let i = 0; i < horizontalCount; i++) {
      for (let j = 0; j < verticalCount; j++) {
        this.emptyPositions.push({
          // x/y - coordinate
          x: i * videow,
          y: j * videoh
        })
      }
    }
  }
  
 //////////////////////////////
  ///////// add others video //////
  addVideo(src) {
    var video = document.createElement("video");
    video.src = src;
    video.width = videow;
    video.height = videoh;
    video.play(); // need play here instead of video.autoplay()
    video.loop = true;
    video.muted = true;

    
    // pick random location. here pick random index  
    var positionIndex = Math.floor(Math.random() * this.emptyPositions.length);
    // videos - store all incoming recordings
    // push each video and its position
    this.videos.push({
      src: video,
      position: this.emptyPositions[positionIndex]
    })
    // after this specific position being picked, remove it from position array
    this.emptyPositions.splice(positionIndex, 1);
    
    // when all positions are picked and used, start again
    if (this.emptyPositions.length === 0) {
      this.initEmptyPosition();
    }
  }

  
}



let canvasController = new CanvasController();
let socket;

initCapture();


function initCapture() {
  console.log("initCapture");

  let video = document.getElementById("video");

  let constraints = { audio: false, video: true };

  // Prompt the user for permission, get the stream
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function(stream) {

      // Attach to our video object
      video.srcObject = stream;

      // Wait for the stream to load enough to play
      video.onloadedmetadata = function(e) {
        video.play();
        video.style.display = "none";

        startMediaRecorder(stream);
      };

      // Now setup socket
      setupSocket();
    })
    .catch(function(err) {
      /* Handle the error */
      alert(err);
    });
}

function startMediaRecorder(streamToRecord) {
  // This array will contain "chunks" of the video captured by the MediaRecorder
  var chunks = [];

  // Give the MediaRecorder the stream to record
  var mediaRecorder = new MediaRecorder(streamToRecord);

  // This is an event listener for the "stop" event on the MediaRecorder
  // mediaRecorder.addEventListener('stop', function(e) { ... });
  mediaRecorder.onstop = function(e) {
    console.log("stop");
  
    // Create a blob - Binary Large Object of type video/webm
    var blob = new Blob(chunks, { type: "video/webm" });
    // Generate a URL for the blob
    var videoURL = window.URL.createObjectURL(blob);
    
    // define video source
    canvasController.addVideo(videoURL);

    // clear out chunks array
    chunks.length = 0;
    repeat();
    loop();
    socket.emit("myvideo", blob);
    
  };

  // Another callback/event listener - "dataavailable"
  // callback funtion
  mediaRecorder.ondataavailable = function(e) {
    // Whenever data is available from the MediaRecorder put it in the array
    chunks.push(e.data);
  };

  
  // Start the MediaRecorder
  function repeat() {
    // Start the MediaRecorder
    mediaRecorder.start();

    // After 2 seconds, stop the MediaRecorder
    setTimeout(function() {
      mediaRecorder.stop();
    }, 5000);
  }

  // call this function one time
  repeat();
  //mediaRecorder.requestData();
}

function setupSocket() {
  socket = io.connect();
  
  socket.on("connect", function() {
    console.log("connected");
   
  })

  socket.on("myvideo", function(data) {
    // "data" is filename sent from server
    console.log(data);
    
    const src = "https://yw4867.itp.io/vids/" + data + ".webm";

     canvasController.addVideo(src)
  });
}

function loop() {
  canvasController.drawCanvas();
  requestAnimationFrame(loop);
  // window.setInterval(loop, 1000);
}

// function drawCanvas() {
//   for (let i = 0; i < videos.length; i++) {
//     ctx.drawImage(videos[i], i * 200, 0, 200, 150);
//   }

//   window.requestAnimationFrame(drawCanvas);
// }

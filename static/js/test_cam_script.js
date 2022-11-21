'use strict';

// Set up media stream constant and parameters.

const mediaStreamConstraints = {
    video: true,
    audio: false,
};

// Set up to exchange only video.
const offerOptions = {
    offerToReceiveVideo: 1,
};

// using test stun server
var configuration = {
    'iceServers': [{
        'url': 'stun:stun1.l.google.com:19302' //'stun:stun.l.google.com:19302'
    }]
};

// Define initial start time of the call (defined as connection between peers).
let startTime = null;

// Define peer connections, streams and video elements.
const localVideo =  document.createElement('video');
localVideo.setAttribute('id', 'localVideo');
localVideo.setAttribute('autoplay', '');
localVideo.setAttribute('playsinline', '');
localVideo.setAttribute('uk-video', '');
localVideo.setAttribute('class', 'rounded-3');

const remoteVideo = document.createElement('video');
remoteVideo.setAttribute('id', 'remoteVideo');
remoteVideo.setAttribute('autoplay', '');
remoteVideo.setAttribute('playsinline', '');
remoteVideo.setAttribute('uk-video', '');
remoteVideo.setAttribute('class', 'rounded-3 col-12');

const cameraSelect = document.querySelector('#camera-select-input');

let localStream;
let remoteStream;

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
}


// Get cameras list
getCameras()

function getCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        trace("enumerateDevices() not supported.");
        return;
    }

    // List cameras and microphones.
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                trace(device.kind + ": " + device.label + " id = " + device.deviceId);

                // add different camera options to a select tag
                if (device.kind === 'videoinput') {
                    let option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label;
                    cameraSelect.append(option);
                }
            });

        })
        .catch(function (err) {
            trace(err.name + ": " + err.message);
        });
}



/* DEFINE MEDIASTREAMS CALLBACKS. */

// Sets the MediaStream as the video element src.
function gotLocalMediaStream(mediaStream) {
    document.querySelector('#localVideoPlaceholder').replaceWith(localVideo);
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
    trace('Received local stream.');
    callButton.disabled = false;  // Enable call button.
}

// Handles error by logging a message to the console.
function handleLocalMediaStreamError(error) {
    trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

// Handles remote MediaStream success by adding it as the remoteVideo src.
function gotRemoteMediaStream(event) {
    document.querySelector('#remoteVideoPlaceholder').replaceWith(remoteVideo);
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    trace('Remote peer connection received remote stream.');
}



/* ADD BEHAVIOR FOR VIDEO STREAMS. */

// Logs a message with the id and size of a video element.
function logVideoLoaded(event) {
  const video = event.target;
    trace(`${video.id} videoWidth: ${video.videoWidth}px, ` + `videoHeight: ${video.videoHeight}px.`);
}

// Logs a message with the id and size of a video element.
// This event is fired when video begins streaming.
function logResizedVideo(event) {
    logVideoLoaded(event);

    if (startTime) {
        const elapsedTime = window.performance.now() - startTime;
        startTime = null;
        trace(`Setup time: ${elapsedTime.toFixed(3)}ms.`);
    }
}

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);



/* DEFINE AND ADD BEHAVIOR TO BUTTONS. */

// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

// Set up initial action buttons status: disable call and hangup.
callButton.disabled = true;
hangupButton.disabled = true;


// Handles start button action: creates local MediaStream.
function startAction() {
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
    trace('Requesting local stream.');
}

// Handles call button action: creates peer connection.
function callAction() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    trace('Starting call.');
    startTime = window.performance.now();

    // Get local media stream tracks.
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
        trace(`Using video device: ${videoTracks[0].label}.`);
    }
    if (audioTracks.length > 0) {
        trace(`Using audio device: ${audioTracks[0].label}.`);
    }
}

// Add click event handlers for buttons.
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
//hangupButton.addEventListener('click', hangupAction);
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
        }
    );
}

getCameras()



/* DEFINE VIDEO SIGNAL WEBSOCKET BEHAVIOR. */

// Create WebSocket for video connection
const videoSignalSocket = new WebSocket(
    websocketProtocol
    + '://'
    + window.location.host
    + '/ws/video_call/'
    + roomName
    + '/'
);

// WebSocket open status handler
videoSignalSocket.onopen = function(e) {
    console.log('Video signal socket opened successfully')
}

// WebSocket error handler
videoSignalSocket.onclose = function(e) {
    console.error('Video signal socket closed unexpectedly');
};

function startSignaling() {
    trace('start signaling');
    rtcPeerConn = new RTCPeerConnection(configuration);

    // send any ice candidates to other peer
    rtcPeerConn.onicecandidate = function (evt) {
        if (evt.candidate) {
            videoSignalSocket.send(JSON.stringify({
                'type': 'ice candidate',
                'message': JSON.stringify({
                    'candidate': evt.candidate
                }),
                'room': roomName
            }));
        }
        trace('completed that ice candidate...');
    }

    // when we receive an offer, we return our offer
    // let the 'negotiationneeded' event trigger offer generation
    rtcPeerConn.onnegotiationneeded = function () {
        trace('on negotiation called');
        rtcPeerConn.createOffer(sendLocalDesc, logError);
    }

    // once remote stream arrives, show it in remote video element
    rtcPeerConn.onaddstream = function (evt) {
        displaySignalMessage('going to add their stream...');
        theirVideoArea.srcObject = evt.stream;
    }

    // get a local stream, show it in our video tag and add it to be sent
    startStream();

}



/* DEFINE MEDIASTREAMS CALLBACKS. */

// Sets the MediaStream as the video element src.
function gotLocalMediaStream(mediaStream) {
    if (document.querySelector('#localVideoPlaceholder') != null){
        document.querySelector('#localVideoPlaceholder').replaceWith(localVideo);
    }
    else{
        document.querySelector('#localVideo').replaceWith(localVideo);
    }
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
function startStream() {
    trace('Requesting local stream.');
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const updatedMediaStreamConstraints = {
            ...mediaStreamConstraints,
            deviceId: {
                exact: cameraSelect.value
            }
        };
        navigator.mediaDevices.getUserMedia(updatedMediaStreamConstraints)
            .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
    }
    else{
        trace('No supported devices!')
    }
}

function startAction() {
    startButton.disabled = true;
    startStream()
}

cameraSelect.onchange = () => {startStream();}

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
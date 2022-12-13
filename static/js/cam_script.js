'use strict';

// Frontend io we have { io.on as input, io.emit as op)
let width = 1920;
let height = 1080;

var localVideoPlaceholder = document.querySelector('#localVideoPlaceholder');
var remoteVideoPlaceholder = document.querySelector('#remoteVideoPlaceholder');

var localVideoPlaceholderHTML = localVideoPlaceholder.cloneNode(true);
var remoteVideoPlaceholderHTML = remoteVideoPlaceholder.cloneNode(true);

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

// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

var cameraSelect = document.querySelector('#camera-select-input');
var devices = navigator.mediaDevices.enumerateDevices();

var SIGNAL_ROOM = 'SIGNAL_ROOM';

const constraints = {
    video: true/* {
        width: width,
        height: height,
    } */,
    audio: false
};

var websocketProtocol;

console.log('host = ', window.location.host);
console.log('protocol=', location.protocol);

if (location.protocol === 'http:') {
    websocketProtocol = 'ws';
} else {
    websocketProtocol = 'wss';
}

var websocketBaseUrl = websocketProtocol + '://' + window.location.host + '/ws/';

// using test stun server
var configuration = {
    'iceServers': [{
        'url': 'stun:stun1.l.google.com:19302' //'stun:stun.l.google.com:19302'
    }]
};

var rtcPeerConn;

getCameras();

// WebSocket -> .send, .onmessage, .onclose


const videoSignalSocket = new WebSocket(
    websocketBaseUrl + 'video_call/signal/'
);

videoSignalSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    console.log('Signal received:' + data.type);

    // setup RTC peer connection object
    if (!rtcPeerConn) {
        console.log('rtc Peer conn doesnt exists yet');
        startSignaling();
    }

    // we are sending some bogus signal on load with type='user_here'. we call below
    // code only for real signal message
    if (data.type != 'user_here') {
        console.log('data type != user_here');
        var message = JSON.parse(data.message);

        // sdp message means remote party made us an offer
        if (message.sdp) {
            rtcPeerConn.setRemoteDescription(
                new RTCSessionDescription(message.sdp), function () {
                    // if we received an offer, we need to answer
                    if (rtcPeerConn.remoteDescription.type == 'offer') {
                        rtcPeerConn.createAnswer(sendLocalDesc, logError);
                    }
                }, logError);
        } else {
            rtcPeerConn.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }

};

videoSignalSocket.onclose = function (e) {
    console.error('video signal socket closed unexpectedly');
};

// send ready state signal
// this one also should only be told to other user, not both user
var videoSignalSocketReady = setInterval(function () {
    // keep checking if socket is ready at certain intervals
    // once ready, send a signal and exit loop
    console.log('ready state=', videoSignalSocket.readyState);
    if (videoSignalSocket.readyState === 1) {
        videoSignalSocket.send(JSON.stringify({
            'type': 'user_here',
            'message': 'Are you ready for a call?',
            'room': SIGNAL_ROOM
        }));
        clearInterval(videoSignalSocketReady);
    }

}, 1000);

function startSignaling() {
    console.log('start signaling...');
    rtcPeerConn = new RTCPeerConnection(configuration);

    // send any ice candidates to other peer
    rtcPeerConn.onicecandidate = function (event) {
        if (event.candidate) {
            videoSignalSocket.send(JSON.stringify({
                'type': 'ice candidate',
                'message': JSON.stringify({
                    'candidate': event.candidate
                }),
                'room': SIGNAL_ROOM
            }));
        }
        console.log('completed that ice candidate...');
    }

    rtcPeerConn.onnegotiationneeded = function () {
        console.log('on negotiation called');
        rtcPeerConn.createOffer(sendLocalDesc, logError);
    }

    rtcPeerConn.onaddstream = function (event) {
        console.log('going to add remote stream...');
        if (remoteVideoPlaceholder != null){
            remoteVideoPlaceholder.replaceWith(remoteVideo);
        }
        else{
            remoteVideo.replaceWith(remoteVideo);
        }
        remoteVideo.srcObject = event.stream;
    }

    rtcPeerConn.onclose  = function () {
        console.log('RTCpeer connection closed');
    }

    //startStream();

}

function startStream() {
    console.log('Requesting local stream');
    const updatedConstraints = {
            ...constraints,
            deviceId: {
                exact: cameraSelect.value
            }
        };
    navigator.mediaDevices.getUserMedia(updatedConstraints)
        .then(function (stream) {
            console.log('Stream connected successfully');
            if (localVideoPlaceholder != null){
                localVideoPlaceholder.replaceWith(localVideo);
            }
            else{
                localVideo.replaceWith(localVideo);
            }
            localVideo.srcObject = stream;
            //rtcPeerConn.addStream(stream);
        })
        .catch(function (error) {
            console.log('Error in local stream:', error);
        });
    callButton.disabled = false;
}

function sendLocalDesc(desc) {
    rtcPeerConn.setLocalDescription(desc, function () {
        console.log('sending local description');
        videoSignalSocket.send(JSON.stringify({
            'type': 'SDP',
            'message': JSON.stringify({
                'sdp': rtcPeerConn.localDescription
            }),
            'room': SIGNAL_ROOM
        }));
    }, logError);
}

function logError(error) {
    console.log(error.name + ':' + error.message);
}

function getCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
        return;
    }

    // List cameras and microphones.
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                console.log(device.kind + ": " + device.label + " id = " + device.deviceId);

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
            console.log(err.name + ": " + err.message);
        });
}



/* DEFINE AND ADD BEHAVIOR TO BUTTONS. */

// Set up initial action buttons status: disable call and hangup.
callButton.disabled = true;
hangupButton.disabled = true;

function startAction() {
    startButton.disabled = true;
    startStream();
}

function callAction() {
    var isConnectionSuccess = false;
    console.log('Starting call...');

    try{
        console.log('Adding local stream...');
        rtcPeerConn.addStream(localVideo.srcObject);
        isConnectionSuccess = true;
        console.log('Connection succeeded!');
    }
    catch (error) {
        console.log("Something went wrong. Info: " + error)
        alert("The call should be made by your interlocutor...")
    }

    if (isConnectionSuccess) {
        callButton.disabled = true;
        hangupButton.disabled = false;
    }
}

function hangupAction() {
    console.log('Ending call...');
    callButton.disabled = false;
    hangupButton.disabled = true;
    rtcPeerConn.close();
    rtcPeerConn = null;
    remoteVideo.replaceWith(remoteVideoPlaceholderHTML);
}

// Add click event handlers for buttons.
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);
    

/* const foo = () => {}; */
// Get room name
const roomName = JSON.parse(document.getElementById('room-name').textContent);

var websocketProtocol;

if (location.protocol === 'http:') {
    websocketProtocol = 'ws';
} else {
    websocketProtocol = 'wss';
}

// Create WebSocket
const chatSocket = new WebSocket(
    websocketProtocol
    + '://'
    + window.location.host
    + '/ws/start/'
    + roomName
    + '/'
);

// WebSocket open status handler
chatSocket.onopen = function(e) {
    console.log('Chat socket opened successfully')
}

// Action when room in layer get a message
chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    console.log(`Message: ${data.message} recieved from ${data.username}`)
    document.querySelector('#chat-log').value += (`${data.username}: ${data.message}\n`);

};

// WebSocket error handler
chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

document.querySelector('#chat-message-input').focus();
document.querySelector('#chat-message-input').onkeyup = function(e) {
    if (e.keyCode === 13) {  // enter
        document.querySelector('#chat-message-submit').click();
    }
};

// Submit actions (send user message on server)
document.querySelector('#chat-message-submit').onclick = function(e) {
    const messageInputDom = document.querySelector('#chat-message-input');
    const message = messageInputDom.value;
    console.log(`Message sent: ${message}`)
    chatSocket.send(JSON.stringify({
        'message': message,
        'username': localStorage.getItem('username'),
    }));
    messageInputDom.value = '';
};
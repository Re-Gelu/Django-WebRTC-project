document.querySelector('#room-name-input').focus();
document.querySelector('#room-name-input').onkeyup = function(e) {
    if (e.keyCode === 13) {  // enter
        document.querySelector('#room-name-submit').click();
    }
};

// Submit actions (redirect in the room with special name)
document.querySelector('#room-name-submit').onclick = function(e) {
    const roomName = document.querySelector('#room-name-input').value;
    if (roomName) {
        const username = document.querySelector('#user-name-input').value;
        if (username) {
            localStorage.setItem('username', username);
            window.location.pathname = '/chat/' + roomName + '/';
        }
        else {
            alert("Input username please!");
        }
    }
    else {
        alert("Input room name please!");
    }
};
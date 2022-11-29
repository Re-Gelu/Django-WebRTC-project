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
        if (localStorage.getItem('username')) {
            window.location.pathname = '/chat/' + roomName + '/';
        }
        else {
            if (username) {
                localStorage.setItem('username', username);
                window.location.pathname = '/chat/' + roomName + '/';
            }
            else {
                alert("Input username please!");
            }
        }
    }
    else {
        alert("Input room name please!");
    }
};

document.querySelectorAll('#room-connect-submit').forEach(function(element) {
    element.onclick = function(e) {
        const username = document.querySelector('#user-name-input').value;
        if (localStorage.getItem('username')) {
            window.location.pathname = element.getAttribute("link");
        } 
        else {
            if (username) {
                localStorage.setItem('username', username);
                window.location.pathname = element.getAttribute("link");
            }
            else {
                alert("Input username please!");
            }
        }
    };
});
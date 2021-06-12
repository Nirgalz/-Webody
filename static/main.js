'use strict';

$(document).ready(() => {
    $(document).on('mousemove', function (e) {
            $('#my-body').css({top: e.clientY, left: e.clientX});

            easyrtc.sendDataWS({targetRoom: "default"}, "message", JSON.stringify({clientX: e.clientX, clientY: e.clientY}), null);
        });

    connect(true);

});

var selfEasyrtcid = "";
function mousePosition(who, msgType, content) {
    console.log(who + " " + msgType + " " + content);
    var position = JSON.parse(content);
    $('#other-body').css({top: position.clientY, left: position.clientX});
}

//joins a room
function connectToRoom(roomName) {
    easyrtc.joinRoom(roomName, null,
        function () {
            console.log("connection to room ok");
        },
        function (errorCode, errorText, roomName) {
            easyrtc.showError(errorCode, errorText + ": room name was(" + roomName + ")");
        });
}

function connect(immediateMode) {
    connectToRoom("default");
    easyrtc.setPeerListener(mousePosition);
    // easyrtc.setRoomOccupantListener(convertListToButtons);

    var mysocket = io.connect(null, {
        'connect timeout': 10000,
        'force new connection': true
    });


    if (!mysocket) {
        throw "io.connect failed";
    }
    else {
        console.log("application allocated socket ", mysocket);
        easyrtc.useThisSocketConnection(mysocket);
    }
    if( immediateMode) {
        easyrtc.connect("easyrtc.reconnect", loginSuccess, loginFailure);
    }
    else {
        setTimeout(function() {
            easyrtc.connect("easyrtc.reconnect", loginSuccess, loginFailure);
        }, 10*1000);
    }
}


function convertListToButtons (roomName, occupants, isPrimary) {

    for(var easyrtcid in occupants) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                sendStuffWS(easyrtcid);
            };
        }(easyrtcid);
        var label = document.createTextNode("Send to " + easyrtc.idToName(easyrtcid));
        button.appendChild(label);

        otherClientDiv.appendChild(button);
    }
    if( !otherClientDiv.hasChildNodes() ) {
        otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
    }
}


function sendStuffWS(otherEasyrtcid) {
    var text = document.getElementById('sendMessageText').value;
    if(text.replace(/\s/g, "").length === 0) { // Don't send just whitespace
        return;
    }

    easyrtc.sendDataWS(otherEasyrtcid, "message",  text);
    mousePosition("Me", "message", text);
    document.getElementById('sendMessageText').value = "";
}


function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    console.log(selfEasyrtcid);
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}
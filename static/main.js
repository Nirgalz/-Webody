'use strict';

$(document).ready(() => {
    $(document).on('mousemove', function (e) {
        $('#my-body').css({top: e.clientY, left: e.clientX});

        easyrtc.sendDataWS({targetRoom: "default"}, "message", JSON.stringify({
            clientX: e.clientX,
            clientY: e.clientY
        }), null);
    });

    connect(true);

});

var selfEasyrtcid = "";
var webodies = {};

function mousePosition(who, msgType, content) {
    // console.log(who + " " + msgType + " " + content);
    var position = JSON.parse(content);
    $('#' + who).css({top: position.clientY, left: position.clientX});
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
    easyrtc.setRoomOccupantListener(occupantsListener);

    var mysocket = io.connect(null, {
        'connect timeout': 10000,
        'force new connection': true
    });


    if (!mysocket) {
        throw "io.connect failed";
    } else {
        console.log("application allocated socket ", mysocket);
        easyrtc.useThisSocketConnection(mysocket);
    }
    if (immediateMode) {
        easyrtc.connect("easyrtc.reconnect", loginSuccess, loginFailure);
    } else {
        setTimeout(function () {
            easyrtc.connect("easyrtc.reconnect", loginSuccess, loginFailure);
        }, 10 * 1000);
    }
}

function occupantsListener(roomName, occupants, isPrimary) {
    console.log(occupants)
    for (const key in occupants) {
        if (!webodies[key]) {
            webodies[key] = '';
            $('#webodies-div').append(
                `<span class="webody" style="font-size: 48px; color: #${intToRGB(occupants[key].roomJoinTime)}; position: absolute" id="${key}">
<i class="far fa-smile"></i>
</span>`);
        }
    }
}

function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    console.log(selfEasyrtcid);
}

function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}

function intToRGB(i) {
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    var result = "00000".substring(0, 6 - c.length) + c;
    result.replace("F", "D")
        .replace("E", "C")
        .replace("0", "2")
        .replace("1", "3");
    return result;
}
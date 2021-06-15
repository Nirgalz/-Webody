'use strict';

const messageType = {
    MOUSE_POSITION: "mousePosition",
    CHANGE_SMILEY: "changeSmiley",
    MESSAGE: "message",
    DRAWING: "drawing"
}
let smileyIndex = 0;

const smileys = [
    "fa-smile", "fa-smile-beam", "fa-smile-wink", "fa-grin-squint-tears", "fa-grin-squint", "fa-grin-hearts", "fa-grin-beam-sweat", "fa-grin", "fa-laugh-wink", "fa-laugh-squint", "fa-sad-tear", "fa-sad-cry", "fa-frown"
]

let selfEasyrtcid = "";
let webodies = {};
let mousePosition = {}
let mouseDown = false;
let isSpeechBoxOff = true;

$(document).ready(() => {
    $(document).on('mousemove', function (e) {
        mousePosition = {x: e.clientX, y: e.clientY};
        $('#my-body').css({top: e.clientY, left: e.clientX});

        easyrtc.sendDataWS({targetRoom: "default"}, messageType.MOUSE_POSITION, JSON.stringify({
            clientX: e.clientX,
            clientY: e.clientY
        }), null);
        if (mouseDown) {
            $('#drawings').append(`<div class="pixel" style="background-color: #dede8a; left: ${mousePosition.x}px; top: ${mousePosition.y}px;">`)
            easyrtc.sendDataWS({targetRoom: "default"}, messageType.DRAWING, JSON.stringify(mousePosition), null);
        }
    });

    $(document).on('mousedown', function () {
        mouseDown = true;
    })

    $(document).on('mouseup', function () {
        mouseDown = false;
    })

    $(document).on('keyup', function (e) {
        if (e.which === 13 && e.ctrlKey) {
            if (isSpeechBoxOff) {
                $('#my-body').append('<textarea id="my-speech"  class="speech-area" rows="4" cols="50"></textarea>');
                $('#my-speech').focus();
            } else {
                let mySpeech = $('#my-speech');
                let myBodyPosition = $('#my-body').position();
                $('#speeches').append(`<p class="speech" style="color: #dede8a; top: ${myBodyPosition.top}px; left: ${myBodyPosition.left}px;">${mySpeech.val()}</p>`)
                mySpeech.remove();
                let data = {
                    position: myBodyPosition,
                    content: mySpeech.val()
                }
                easyrtc.sendDataWS({targetRoom: "default"}, messageType.MESSAGE, JSON.stringify(data), null);
            }
            isSpeechBoxOff = !isSpeechBoxOff;
        }
    })

    $(window).bind('mousewheel DOMMouseScroll', function (event) {
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            let smileyIcon = $('#my-body').find(".smiley");
            smileyIcon.removeClass(smileys[smileyIndex]).addClass(smileys[smileyIndex + 1])
            smileyIndex === smileys.length ? smileyIndex = 0 : smileyIndex += 1;
        } else {
            let smileyIcon = $('#my-body').find(".smiley");
            smileyIcon.removeClass(smileys[smileyIndex]).addClass(smileys[smileyIndex - 1]);
            smileyIndex === 0 ? smileyIndex = smileys.length : smileyIndex -= 1;
        }
        easyrtc.sendDataWS({targetRoom: "default"}, messageType.CHANGE_SMILEY, JSON.stringify({
            smileyIndex: smileyIndex
        }), null);
    });

    connect(true);

});

function userListener(who, msgType, content) {
    var data = JSON.parse(content);
    let whoDiv = $(`#${who}`);
    switch (msgType) {
        case messageType.MOUSE_POSITION:
            whoDiv.css({top: data.clientY, left: data.clientX});
            break;
        case messageType.CHANGE_SMILEY:
            let smileyIcon = whoDiv.find(".smiley");
            let smileyClass = smileyIcon.attr('class').split(/\s+/)[2];
            smileyIcon.removeClass(smileyClass).addClass(smileys[data.smileyIndex]);
            break;
        case  messageType.DRAWING:
            $('#drawings').append(`<div class="pixel" style="background-color: ${webodies[who].color}; left: ${data.x}px; top: ${data.y}px;">`);
            break;
        case messageType.MESSAGE:
            $('#speeches').append(`<p class="speech" style="color: ${webodies[who].color}; top: ${data.position.top}px; left: ${data.position.left}px;">${data.content}</p>`)
            break;
    }
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
    easyrtc.setPeerListener(userListener);
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
            webodies[key] = {color: "#" + intToRGB(occupants[key].roomJoinTime)};
            $('#webodies-div').append(
                `<span class="webody" style="font-size: 48px; color:  ${webodies[key].color}; position: absolute" id="${key}">
<i class="smiley far fa-smile"></i>
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
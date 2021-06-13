'use strict';

$(document).ready(() => {
    $(document).on('mousemove', function (e) {
        $('#my-body').css({top: e.clientY, left: e.clientX});

        easyrtc.sendDataWS({targetRoom: "default"}, messageType.MOUSE_POSITION, JSON.stringify({
            clientX: e.clientX,
            clientY: e.clientY
        }), null);
    });

    $(window).bind('mousewheel DOMMouseScroll', function(event){
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            let smileyIcon = $('#my-body').find(".smiley");
            smileyIcon.removeClass(smileys[smileyIndex]).addClass(smileys[smileyIndex +1] )
            smileyIndex === smileys.length ? smileyIndex = 0 : smileyIndex += 1;
        }
        else {
            let smileyIcon = $('#my-body').find(".smiley");
            smileyIcon.removeClass(smileys[smileyIndex]).addClass(smileys[smileyIndex-1] );
            smileyIndex === 0 ? smileyIndex = smileys.length : smileyIndex -= 1;
        }
        easyrtc.sendDataWS({targetRoom: "default"}, messageType.CHANGE_SMILEY, JSON.stringify({
            smileyIndex: smileyIndex
        }), null);
    });

    connect(true);

});

const messageType = {
    MOUSE_POSITION: "mousePosition",
    CHANGE_SMILEY: "changeSmiley",
    MESSAGE: "message"
}
let smileyIndex = 0;

const smileys = [
    "fa-smile", "fa-smile-beam", "fa-smile-wink", "fa-grin-squint-tears", "fa-grin-squint", "fa-grin-hearts", "fa-grin-beam-sweat", "fa-grin", "fa-laugh-wink", "fa-laugh-squint", "fa-sad-tear", "fa-sad-cry", "fa-frown"
]

let selfEasyrtcid = "";
let webodies = {};

function userListener(who, msgType, content) {
    // console.log(who + " " + msgType + " " + content);
    var data = JSON.parse(content);

    if (msgType === messageType.MOUSE_POSITION) {
        $('#' + who).css({top: data.clientY, left: data.clientX});
    }
    if (msgType === messageType.CHANGE_SMILEY) {
        let smileyIcon = $('#' + who).find(".smiley");
        let smileyClass = smileyIcon.attr('class').split(/\s+/)[2];
        smileyIcon.removeClass(smileyClass).addClass(smileys[data.smileyIndex])
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
            webodies[key] = '';
            $('#webodies-div').append(
                `<span class="webody" style="font-size: 48px; color: #${intToRGB(occupants[key].roomJoinTime)}; position: absolute" id="${key}">
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
//Not using this, want to use this to save new cutfiles
const url = chrome.runtime.getURL('data/cutsfile.txt');
var playerSessionId;
var player;

var videoElement;
var addonIntervalId;
var placeholder;

var cutsData;
var cutPoints;

readLocalStorage();

console.log("Sending Message!");
browser.runtime.sendMessage({content: "newTab"});

browser.runtime.onMessage.addListener(data => {
    console.log("Got a message. The data is:", data);
    if (data.message == "watching") {
        console.log("URL changed, restarting addon");
        restartAddon();
    }
    if (data.message == "NewCut") {
        console.log("User updated cut file. Reading.");
        readLocalStorage();
    }
});

if(window.location.pathname.startsWith('/watch')){
    setTimeout(getVideoElement, 100);
}

function readLocalStorage(){
    console.log("Reading the storage.");
    browser.storage.local.get('1', function(items) {
      cutsData = items[1].toSource()
    });
    setTimeout(function(){readCutsData()}, 2000);
}

function readCutsData(){
    cutsData = cutsData.replace(/\(/gi, '');
    cutsData = cutsData.replace(/\)/gi, '');
    cutsData = cutsData.replace(/\"/gi, '');
    cutsData = cutsData.replace(/ /gi, '');
    
    cutsData = cutsData.substr(9);
    console.log(cutsData);
    getCutPoints();
}

function getCutPoints(){
    console.log("Getting Cut Points");
    cutPoints = cutsData.split("\\r\\n");
    for (var i = 0; i < cutPoints.length; i++) {
        cutPoints[i] = cutPoints[i].split(',');
    }
    console.log(cutPoints[2][1]);
    console.log("Got cut points");
}

function startAddon (video) {
    console.log("Starting Addon");
    console.log("Setting sessionID");
    playerSessionId = XPCNativeWrapper(window.wrappedJSObject.netflix
        .appContext
        .state
        .playerApp
        .getAPI()
        .videoPlayer.getAllPlayerSessionIds()[0]);
    addonIntervalId = setInterval(checkTimeLoop, 100);
};

function restartAddon() {
    clearInterval(addonIntervalId);
    getVideoElement();
}

function getVideoElement () {
    console.log("Getting video element");
    var video = document.getElementsByTagName("video");
    if (video.length > 0) {
        videoElement = video[0];
        startAddon(videoElement);
    } else {
        setTimeout(getVideoElement, 100);
    }
};

function checkTimeLoop(){
    if(videoElement){
        var currentVideoTime = videoElement.currentTime;
        currentVideoTime = Math.round(currentVideoTime * 10);
        for(var i = 0; i < cutPoints.length; i++){
            var currentPoint = cutPoints[i];
            var cutTimeStamp = convertToTimestamp(currentPoint[0]) * 10;
            var destinationTimeStamp = convertToTimestamp(currentPoint[1]) * 1000;
            if(currentVideoTime != placeholder) {
                placeholder = 0;
                if(currentVideoTime >= cutTimeStamp - 5 && currentVideoTime <= cutTimeStamp + 5) {
                    placeholder = currentVideoTime;
                    skipToTime(destinationTimeStamp);
                }
            }
            
        }
    }
}

function skipToTime(seekTime) {
    console.log("SEEKING NOW");
    player = XPCNativeWrapper(window.wrappedJSObject.netflix
        .appContext
        .state
        .playerApp
        .getAPI()
        .videoPlayer
        .getVideoPlayerBySessionId(playerSessionId).seek(seekTime));
    console.log("SEEKING DONE");
}

function convertToTimestamp (customTimestamp) {
  var hours = parseInt(customTimestamp.substr(0,2));
  var minutes = parseInt(customTimestamp.substr(3,2));
  var seconds = parseInt(customTimestamp.substr(6,4));

  return seconds + 60*minutes + 60*60*hours;
}
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

if(window.location.pathname.startsWith('/player')){
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
    /*playerSessionId = XPCNativeWrapper(window.wrappedJSObject.viaplay
        .appContext
        .state
        .playerApp
        .getAPI()
        .videoPlayer.getAllPlayerSessionIds()[0]);
    console.log("The player session id is: ", playerSessionId);*/
    addonIntervalId = setInterval(checkTimeLoop, 100);
    addButtons();
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
        //console.log("Current video time: ",currentVideoTime);
        currentVideoTime = Math.round(currentVideoTime * 10);
        //console.log("Converted current video time: ",currentVideoTime);
        for(var i = 0; i < cutPoints.length; i++){
            var currentPoint = cutPoints[i];
            var cutTimeStamp = convertToTimestamp(currentPoint[0]) * 10;
            //console.log("Unconverted cut point: ",currentPoint[0]);
            //console.log("Converted cut point: ",cutTimeStamp);
            //console.log("Unconverted time = ", currentPoint[1]);
            //console.log("Converted time = ", convertToTimestamp(currentPoint[1]));
            var destinationTimeStamp = convertToTimestamp(currentPoint[1]);
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
    console.log(seekTime);
    videoElement.fastSeek(seekTime);
    console.log("SEEKING DONE");
}

function convertToTimestamp (customTimestamp) {
  var hours = parseInt(customTimestamp.substr(0,2));
  var minutes = parseInt(customTimestamp.substr(3,2));
  var seconds = parseInt(customTimestamp.substr(6,4));
  var centiseconds = parseInt(customTimestamp.substr(9,1));
  return .1*centiseconds + seconds + 60*minutes + 60*60*hours;
}


function addLeadingZero(number){
    return number < 10 ? "0" + number : number;
}

var timestampToTime = function (timestamp) {
    var centiseconds = parseInt((timestamp - parseInt(timestamp)) * 10);
    var date = new Date(timestamp * 1000);
    var hh = addLeadingZero(date.getUTCHours());
    var mm = addLeadingZero(date.getUTCMinutes());
    var ss = addLeadingZero(date.getSeconds());
    return hh + ":" + mm + ":" + ss + "." + centiseconds;
};

function addButtons(){
    var rootElement = document.querySelector('.content-wrapper');
    console.log(rootElement);
    var buttonsArea = document.createElement('div');
    buttonsArea.setAttribute('class', 'touchable_PlayerControls--control-element_nfp-popup-control');

    var addStartTimeButton = document.createElement('button');
    addStartTimeButton.innerHTML = "Add Start Timestamp"
    addStartTimeButton.setAttribute('style', 'color:black; width:150px; height:20px');
    addStartTimeButton.setAttribute('class', 'custom-js-button');
    addStartTimeButton.style.fontSize = "12px";
    addStartTimeButton.addEventListener('click', () => {
        var textarea = document.getElementById('cut-data');
        var lines = textarea.value.split("\n");
        var timestamp = videoElement.currentTime;
        lines[lines.length-1] = timestampToTime(timestamp) + ",";
        console.log(lines);
        textarea.value = lines.join("\n");
    });
    
    var addEndTimeButton = document.createElement('button');
    addEndTimeButton.innerHTML = "Add End Timestamp"
    addEndTimeButton.setAttribute('style', 'color:black; width:150px; height:20px');
    addEndTimeButton.setAttribute('class', 'custom-js-button');
    addEndTimeButton.style.fontSize = "12px";
    addEndTimeButton.addEventListener('click', () => {
        var textarea = document.getElementById('cut-data');
        var lines = textarea.value.split("\n");
        var str = lines[lines.length-1];
        if (str[str.length - 1] == ","){
            var timestamp = videoElement.currentTime;
            lines[lines.length-1] += timestampToTime(timestamp) + "\n";
            console.log(lines);
            textarea.value = lines.join("\n");
        }
    });
    
    var showCutsButton = document.createElement('button');
    showCutsButton.innerHTML = "Show Custom Cuts";
    showCutsButton.setAttribute('class', 'custom-js-button');
    showCutsButton.setAttribute('style', 'color:black; width:150px; height:20px');
    showCutsButton.style.fontSize = "12px";
    showCutsButton.addEventListener('click', function showModal() {
        console.log("Showing modal");
        modal.style.display = "block";
        console.log("Showed modal");
    });
    
    buttonsArea.appendChild(addStartTimeButton);
    buttonsArea.appendChild(addEndTimeButton);
    buttonsArea.appendChild(showCutsButton);
    rootElement.appendChild(buttonsArea);
    
    var cutsModal = `
    <div id="cutsModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <span class="close">&times;</span>
            <h2>Cut timestamps</h2>
          </div>
          <div class="modal-body">
            <textarea cols="100" rows="20" id="cut-data"></textarea>
          </div>
          <div class="modal-footer">
            <h3></h3>
          </div>
        </div>
    </div>`;
    
    var modalDiv = document.createElement('div');
    modalDiv.innerHTML = cutsModal;
    document.body.appendChild(modalDiv);

    var modal = document.getElementById('cutsModal');
    var span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
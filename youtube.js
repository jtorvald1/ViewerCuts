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
        currentVideoTime = Math.round(currentVideoTime * 10);
        for(var i = 0; i < cutPoints.length; i++){
            var currentPoint = cutPoints[i];
            var cutTimeStamp = convertToTimestamp(currentPoint[0]) * 10;
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
    videoElement.currentTime = seekTime;
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
    var rootElement = document.querySelector('.ytp-left-controls');
    var buttonsArea = document.createElement('div');
    buttonsArea.setAttribute('class', 'touchable_PlayerControls--control-element_nfp-popup-control');

    var addStartTimeButton = document.createElement('button');
    addStartTimeButton.innerHTML = "Add Start Cut"
    addStartTimeButton.setAttribute('style', 'color:black; text-align: center; height:20px');
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
    addEndTimeButton.innerHTML = "Add End Cut"
    addEndTimeButton.setAttribute('style', 'color:black; text-align: center; height:20px');
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
    showCutsButton.setAttribute('style', 'color:black; text-align: center; height:20px');
    showCutsButton.style.fontSize = "12px";
    showCutsButton.addEventListener('click', function showModal() {
        console.log("Showing modal");
        modal.style.display = "block";
        console.log("Showed modal");
    });
    
    var loadCutFileLabel = document.createElement('label');
    loadCutFileLabel.setAttribute('for', 'fileinput');
    loadCutFileLabel.setAttribute('class', 'btn');
    loadCutFileLabel.setAttribute('type', 'button')
    loadCutFileLabel.innerHTML = "Load Cut File";
    //#d4e4f7
    
    var loadCutFileButton = document.createElement('input');
    loadCutFileButton.innerHTML = "Load Cut File";
    loadCutFileButton.setAttribute('type', 'file');
    loadCutFileButton.setAttribute('class', 'custom-js-button');
    loadCutFileButton.setAttribute('id', 'fileinput');
    loadCutFileButton.setAttribute('style', 'visibility:hidden');
    loadCutFileButton.style.fontSize = "12px";
    loadCutFileButton.addEventListener("change", handleFileSelect);
    
    buttonsArea.appendChild(addStartTimeButton);
    buttonsArea.appendChild(addEndTimeButton);
    buttonsArea.appendChild(showCutsButton);
    buttonsArea.appendChild(loadCutFileLabel);
    buttonsArea.appendChild(loadCutFileButton);
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
    
    function handleFileSelect(){
    console.log("Handling!!!");
    var file = document.getElementById("fileinput").files[0];
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(e){
      console.log(e.target.result);
      console.log("SENDING the message!");
      var str = e.target.result;
      console.log("The string is: ", str);
      saveFile(str);
      }
    //window.close();
    }

    function saveFile(e){
        console.log("Saving file.");
        browser.storage.local.set({'1': e}, function() {
          console.log('Settings saved');
          notifyAddon();
        });
        console.log("Saved file.");
    }

    function readFile(){
        console.log("Reading the storage.");
        var stringy = ""

        browser.storage.local.get('1', function(items) {
          console.log('Settings retrieved', items[1].toSource());
        });

    }

    function notifyAddon() {
        console.log("Sending Message!");
        browser.runtime.sendMessage({content: "NewCut"});
    }
    
}
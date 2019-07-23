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

function jsfunction(e, seekTime){
    console.log("Got to jsfunction. The seektime is:");
    var seek = convertToTimestamp(seekTime) * 1000;
    console.log(seek);
    skipToTime(seek);
    var modal = document.getElementById('cutsModal');
    console.log(modal);
    modal.style.display = "none";
}

function getCall(fn, param) {
   return function(e) {
      e = e || window.event;
      e.preventDefault(); // this might let you use real URLs instead of void(0)
      fn(e, param);
   };
}

function sidebar_open() {
    console.log("Opening Sidebar!");
    document.getElementById("sidebar-closed").style.display = "none";
    document.getElementById("sidebar").style.display = "block";
}

function sidebar_close() {
    console.log("Closing Sidebar!");
    document.getElementById("sidebar").style.display = "none";
    document.getElementById("sidebar-closed").style.display = "block";
}

function makeTextFile(text) {
    var data = new Blob([text], {type: 'text/plain',endings:'native'});
    textFile = window.URL.createObjectURL(data);
    return textFile;
}

function addButtons(){
    var rootElement = document.querySelector('.controls-full-hit-zone');
    //rootElement.setAttribute('z-index', '1')
    var buttonsArea = document.createElement('div');
    buttonsArea.setAttribute('class', 'touchable_PlayerControls--control-element_nfp-popup-control');

    var sidebar = document.createElement('div');
    sidebar.setAttribute('class', 'sidebar-collapse');
    sidebar.setAttribute('id', 'sidebar');
    sidebar.setAttribute('style', 'width:150px;right:0');
    sidebar.setAttribute('display', 'inline-block');
    sidebar.setAttribute('z-index', '12');
    sidebar.setAttribute('pointer-events', 'none');
    sidebar.setAttribute('position', 'absolute');
    //sidebar.setAttribute('-webkit-user-select', ' ');
    sidebar.setAttribute('backgroundImage','img.jpg');
    var closebutton = document.createElement('button');
    closebutton.setAttribute('class', 'closebutton');
    //closebutton.setAttribute('img src', '\left_arrow.png');
    //closebutton.innerHTML = '<img src="\left_arrow.png" />';
    closebutton.onclick = getCall(sidebar_close, null);
    closebutton.value = "&times;"
    
    sidebar.appendChild(closebutton);
    
    var sidebaropener = document.createElement('div');
    sidebaropener.setAttribute('class', 'sidebar-closed');
    sidebaropener.setAttribute('id', 'sidebar-closed');
    sidebaropener.setAttribute('style', 'margin-right:0px');
    sidebaropener.setAttribute('display', 'inline-block');
    sidebaropener.setAttribute('z-index', '12')
    sidebaropener.setAttribute('pointer-events', 'none');
    sidebaropener.setAttribute('position', 'absolute');
    //sidebaropener.setAttribute('-webkit-user-select', ' ');
    var openbutton = document.createElement('button');
    openbutton.setAttribute('class', 'openbutton');
    //openbutton.setAttribute('img src', '\right_arrow.png');
    //openbutton.innerHTML = '<img src="images\ok.png" />';
    openbutton.onclick = getCall(sidebar_open, null);
    openbutton.value = "&#9776;"
    
    sidebaropener.appendChild(openbutton);
    
    var addStartTimeButton = document.createElement('button');
    //addStartTimeButton.innerHTML = "Add Start Timestamp"
    addStartTimeButton.setAttribute('title', 'Add start timestamp');
    //addStartTimeButton.setAttribute('type', 'button');
    //addStartTimeButton.setAttribute('style', 'color:black; width:150px; height:20px');
    addStartTimeButton.setAttribute('class', 'custom-js-button-start');
    //addStartTimeButton.style.fontSize = "12px";
    addStartTimeButton.addEventListener('click', () => {
        //var textarea = document.getElementById('cut-data');
        var mydiv = document.getElementById("cut-data");
        var lines = mydiv.textContent.split("\n");
        var timestamp = videoElement.currentTime;
        //lines[lines.length-1] = timestampToTime(timestamp) + ",";
        console.log(lines);
        //textarea.value = lines.join("\n");
        
        var aTag = document.createElement('a');
        //aTag.setAttribute('onclick',"jsfunction()");
        //aTag.onclick = function( hike_id )
        aTag.onclick = getCall(jsfunction, timestampToTime(timestamp));
        aTag.setAttribute('href',"#");
        aTag.innerHTML = timestampToTime(timestamp) + ",";
        if (lines[lines.length-1] == ""){
            mydiv.appendChild(aTag);
            console.log("APPENDING START TAG");
        }
        else {
            console.log("MADE IT HERE???");
            //mydiv.last-child.remove();
            mydiv.removeChild(mydiv.lastChild);
            console.log("REMOVED LAST CHILD!");
            mydiv.appendChild(aTag);
        }
        
        //var textarea = document.getElementById('cut-data');
        
        //var lines = textarea.value.split("\n");
        //var lines = mydiv.value.split("\n");
        //var str = lines[lines.length-1];
        //if (str[str.length - 1] == ","){
        //    var timestamp = videoElement.currentTime;
        //    //lines[lines.length-1] += timestampToTime(timestamp) + "\n";
        //    console.log(lines);
            //textarea.value = lines.join("\n");
            
            
            
        //}
    });
    
    var addEndTimeButton = document.createElement('button');
    //addEndTimeButton.innerHTML = "Add End Timestamp";
    addEndTimeButton.setAttribute('title', 'Add end timestamp');
    //addEndTimeButton.setAttribute('style', 'color:black; width:150px; height:20px');
    addEndTimeButton.setAttribute('class', 'custom-js-button-end');
    //addEndTimeButton.style.fontSize = "12px";
    addEndTimeButton.addEventListener('click', () => {
        //var textarea = document.getElementById('cut-data');
        var mydiv = document.getElementById("cut-data");
        //var lines = textarea.value.split("\n");
        var lines = mydiv.textContent.split("\n");
        //var str = lines[lines.length-1];
        //if (str[str.length - 1] == ","){
        
        console.log("It was NOT empty.");
        
        var timestamp = videoElement.currentTime;
        //lines[lines.length-1] += timestampToTime(timestamp) + "\n";
        console.log(lines);
        //textarea.value = lines.join("\n");
        
        
        var aTag = document.createElement('a');
        //aTag.setAttribute('onclick',"jsfunction()");
        //aTag.onclick = function( hike_id )
        aTag.onclick = getCall(jsfunction, timestampToTime(timestamp));
        aTag.setAttribute('href',"#");
        aTag.innerHTML = timestampToTime(timestamp) + "\n<br>";
        if (!lines[lines.length-1] == ""){
            mydiv.appendChild(aTag);
        //}
        }
        else {
            console.log("MADE IT HERE???");
            //mydiv.last-child.remove();
            mydiv.removeChild(mydiv.lastChild);
            console.log("REMOVED LAST CHILD!");
            mydiv.appendChild(aTag);
        }
    });
    
    var showCutsButton = document.createElement('button');
    //showCutsButton.innerHTML = "Show Custom Cuts";
    showCutsButton.setAttribute('title', 'Show custom cuts');
    showCutsButton.setAttribute('class', 'custom-js-button-show');
    //showCutsButton.setAttribute('style', 'color:black; width:150px; height:20px');
    //showCutsButton.style.fontSize = "12px";
    showCutsButton.addEventListener('click', function showModal() {
        modal.style.display = "block";
    });
    
    var clearCutsButton = document.createElement('button');
    clearCutsButton.setAttribute('title', 'Clear custom cuts');
    clearCutsButton.setAttribute('class', 'custom-js-button-clear');
    clearCutsButton.addEventListener('click', () => {
        console.log("Clearing cuts");
        var mydiv = document.getElementById("cut-data");
        if (confirm("Clear all custom cuts?")) {
            console.log("Confirmed.");
            while (mydiv.firstChild) {
                mydiv.removeChild(mydiv.firstChild);
            }
            console.log("Cleared cuts");
        }
    });
    
    var saveCutsButton = document.createElement('button');
    saveCutsButton.setAttribute('title', 'Save and download custom cuts');
    saveCutsButton.setAttribute('class', 'custom-js-button-save');
    saveCutsButton.addEventListener('click', () => {
        console.log("Saving cuts");
        var mydiv = document.getElementById("cut-data");
        //var lines = mydiv.children;
        var lines = mydiv.textContent
        console.log(lines);
        
        var link = document.createElement('a');
        link.setAttribute('download', 'custom_cut.txt');
        console.log("Made link. Now makeTextFile.");
        link.href = makeTextFile(lines);
        console.log("Made text file. Now append.");
        document.body.appendChild(link);
        console.log("Appended.");

        // wait for the link to be added to the document
        window.requestAnimationFrame(function () {
          var event = new MouseEvent('click');
          link.dispatchEvent(event);
          document.body.removeChild(link);
		});
        
        console.log("Wrote to file");
        /*var str = "";
        var i;
        for (i = 0; i < lines.length; i++) {
            str = str.concat(lines[i].innerHTML);
            str = str.concat(lines[i+1].innerHTML);
            str = str.concat("\n");
            //console.log("Iteration");
        }
        console.log(str);*/
        /*if (confirm("Clear all custom cuts?")) {
            console.log("Confirmed.");
            while (mydiv.firstChild) {
                mydiv.removeChild(mydiv.firstChild);
            }
            console.log("Cleared cuts");
        }*/
    });
    
    var loadCutFileLabel = document.createElement('label');
    loadCutFileLabel.setAttribute('for', 'fileinput');
    loadCutFileLabel.setAttribute('class', 'btn');
    loadCutFileLabel.setAttribute('type', 'button')
    //loadCutFileLabel.innerHTML = "Load Cut File";
    loadCutFileLabel.setAttribute('title', 'Load cut file');
    //#d4e4f7
    
    var loadCutFileButton = document.createElement('input');
    //loadCutFileButton.innerHTML = "Load Cut File";
    loadCutFileButton.setAttribute('title', 'Load cut file');
    loadCutFileButton.setAttribute('type', 'file');
    loadCutFileButton.setAttribute('class', 'custom-js-button');
    loadCutFileButton.setAttribute('id', 'fileinput');
    loadCutFileButton.setAttribute('style', 'visibility:hidden');
    //loadCutFileButton.style.fontSize = "12px";
    loadCutFileButton.addEventListener("change", handleFileSelect);
    
    sidebar.appendChild(addStartTimeButton);
    sidebar.appendChild(addEndTimeButton);
    sidebar.appendChild(showCutsButton);
    sidebar.appendChild(clearCutsButton);
    sidebar.appendChild(saveCutsButton);
    sidebar.appendChild(loadCutFileLabel);
    sidebar.appendChild(loadCutFileButton);
    //rootElement.insertAdjacentElement('afterbegin', sidebar);
    //rootElement.insertAdjacentElement('afterbegin', sidebaropener);
    document.body.appendChild(sidebar);
    document.body.appendChild(sidebaropener);
    
    var cutsModal = `
    <div id="cutsModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <span class="close">&times;</span>
            <h2>Cut timestamps</h2>
          </div>
          <div class="modal-body">
            <div id="div-text" class="div-text">
                <p id="cut-data">
            </div>
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
  
  
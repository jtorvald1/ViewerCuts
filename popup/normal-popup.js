async function SaveFile(e) 
{
    let formData = new FormData();
    let file = e.files[0];      
         
    formData.append("file", file);
    
    try {
       let r = await fetch('/data/', {method: "POST", body: formData}); 
       console.log('HTTP response code:',r.status); 
    } catch(e) {
       console.log('Huston we have problem...:', e);
    }
    
}

document.getElementById("fileinput").addEventListener("change", handleFileSelect);
function handleFileSelect(){
    console.log("Handling!!!");
    var file = document.getElementById("fileinput").files[0];
    var reader = new FileReader();
    reader.onload = function(e){
      console.log(e.target.result);
      console.log("SENDING the message!");
      var str = e.target.result;
      console.log("The string is: ", str);
      saveFile(str);
      //chrome.runtime.sendMessage({yourMsg: e.target.result});
      readFile();
    }
    reader.readAsText(file);
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

/*
function notifyAddon() {
    console.log("Sending Message!");
    var sending = browser.runtime.sendMessage({
    message: "New CutFile"
    });
    sending.then(handleResponse, handleError);  
}*/

function notifyAddon() {
    console.log("Sending Message!");
    //browser.tabs.sendMessage(tabId, {message: "NewCut"});
    browser.runtime.sendMessage({content: "NewCut"});
}
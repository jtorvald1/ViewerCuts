var tabID;

browser.browserAction.onClicked.addListener(function(tab){
    browser.tabs.create({
        'url': browser.runtime.getURL("/popup/normal_popup.html#window")
    });
});

browser.webNavigation.onHistoryStateUpdated.addListener(e => {
        console.log("Reloaded page");
        browser.tabs.sendMessage(e.tabId, {message: "watching"});
    }
    ,
    {
        url: [
            {hostSuffix: "netflix.com", pathPrefix: "/watch/"}
        ]
    }
);

browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {  
  console.log(`Background got a message: ${request.content}`);
    if (request.content == "newTab") {
        console.log("Getting the tabID.");
        console.log(sender.tab.id);
        tabID = sender.tab.id;
        saveToLocalStorage(tabID);
    }
    if (request.content == "NewCut") {
        console.log("User added a new cut");
        browser.tabs.remove(sender.tab.id);
        browser.tabs.sendMessage(tabID, {message: "NewCut"});
        
    }
}



function saveToLocalStorage(e){
    console.log("Saving data.");
    browser.storage.local.set({'tabID': e}, function() {
      console.log('Settings saved');
    });
    console.log("Saved data.");
}
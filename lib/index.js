var self = require('sdk/self');

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;


// DA Ghost by AdamL

var DAGhost_simpleStorage = require("sdk/simple-storage");
var DAGhost_contextMenu = require("sdk/context-menu");
var DAGhost_pb = require("sdk/private-browsing");
var DAGhost_pageMod = require("sdk/page-mod");
var DAGhost_data = require("sdk/self").data;
var DAGhost_workers = [];
var DAGhost_pbCategories;
var DAGhost_pbBlacklist;
var DAGhost_Data;

exports.main = function(){

    DAGhost_Data = [];

    // Make sure to initialize the ghost storage array if it's never been created.
    if(!DAGhost_simpleStorage.storage.blacklist)
    {
        DAGhost_simpleStorage.storage.blacklist = ["INITIALIZATION1", "INITIALIZATION2"];
    }

    // Make sure to initialize the link storage array if it's never been created.
    if(!DAGhost_simpleStorage.storage.categories)
    {
        DAGhost_simpleStorage.storage.categories = ["INITIALIZATION1", "INITIALIZATION2"];
    }

    // If private browsing is active right now, assign a temp array to use.
    if(DAGhost_pb.isActive) {
        DAGhost_pbCategories = ["INITIALIZATION1", "INITIALIZATION2"];
        DAGhost_pbBlacklist = ["INITIALIZATION1", "INITIALIZATION2"];
        DAGhost_Data[0] = DAGhost_pbBlacklist;
        DAGhost_Data[1] = DAGhost_pbCategories;
    }
    else {
        DAGhost_Data[0] = DAGhost_simpleStorage.storage.blacklist;
        DAGhost_Data[1] = DAGhost_simpleStorage.storage.categories;
    }

    // DAGhost_pb.on("start", function() {
    //     // When private browsing is started, always start with newly initialized and temporary arrays.
    //     DAGhost_pbCategories = ["INITIALIZATION1", "INITIALIZATION2"];
    //     DAGhost_pbBlacklist = ["INITIALIZATION1", "INITIALIZATION2"];
    //     DAGhost_Data[0] = DAGhost_pbBlacklist;
    //     DAGhost_Data[1] = DAGhost_pbCategories;
    // });
    //
    // DAGhost_pb.on("stop", function() {
    //     // When private browsing is disabled, revert to using the stored data.
    //     DAGhost_Data[0] = DAGhost_simpleStorage.storage.blacklist;
    //     DAGhost_Data[1] = DAGhost_simpleStorage.storage.categories;
    // });

    // Detaches workers as appropriate.
    function DAGhost_detachWorker(worker, workerArray) {
      var index = workerArray.indexOf(worker);
      if(index != -1) {
        workerArray.splice(index, 1);
      }
    }

    var showPanel = function(text){
        var panel = require("sdk/panel").Panel({
            width: 200,
            height: 300,
            contentScriptWhen: 'ready',
            contentURL: DAGhost_data.url("Panel.html"),
            contentScript:
            'var x=document.getElementById("text");' +
            'x.innerHTML+="' + text + '";' +
            'var panelBody = document.getElementById("panelBody");' +
            'panelBody.background="DAGhostBG.jpg";'
        });
        panel.show();
    };

    DAGhost_pageMod.PageMod({
        include: ["*.deviantart.com"],
        contentScriptWhen: 'ready',
        contentScript:
        'var pattern = / src=\\".*\\">/i;' +
        'var className;' +
        'var Category;' +
        'var ImgType;' +
        'var UserId;' +
        'var divs;' +
        'var div;' +
        '' +
        'self.on("message", function (DAGhost_Data){' +
            'var arrayBlacklist  = DAGhost_Data[0].toString().split(",");' +
            'var arrayCategories = DAGhost_Data[1].toString().split(",");' +
            'divs = document.getElementsByTagName("div");' +
            'if(null !== divs){' +
                'for(var i=0; i<divs.length; i++){' +
                    'div = divs[i];' +
                    'if(null !== div){' +
                        'className = div.getAttribute("class");' +
                        'if(null !== className){' +
                            'if(-1 !== className.indexOf("tt-a ")){' +
                                'UserId = div.getAttribute("userid");' +
                                'if(null !== UserId){' +
                                    'for(var y=0; y < arrayBlacklist.length; y++){' +
                                        'if(UserId === arrayBlacklist[y]){' +
                                            'div.innerHTML = div.innerHTML.replace(pattern, " src=\\"' + DAGhost_data.url('DAGhostSmallWi.jpg') + '\\">");' +
                                        '}' +
                                    '}' +
                                '}' +
                            '}' +
                            'Category = div.getAttribute("category");' +
                            'if(null !== Category){' +
                                'for(var y=0; y < arrayCategories.length; y++){' +
                                    'if(Category === arrayCategories[y]){' +
                                        'div.innerHTML = div.innerHTML.replace(pattern, " src=\\"' + DAGhost_data.url('DAGhostSmallWi.jpg') + '\\">");' +
                                    '}' +
                                '}' +
                            '}' +
                        '}' +
                    '}' +
                '}' +
            '}' +
        '})',
        onAttach: function onAttach(worker) {
            // Detach the applicable worker when a detach message is posted.
            worker.on('detach', function () {
              DAGhost_detachWorker(this, DAGhost_workers);
            });

            // Add the worker to the array.
            DAGhost_workers.push(worker);
            // Post the updated list to the event handler.
            worker.postMessage(DAGhost_Data);
        }
    });

    DAGhost_contextMenu.Item({
        label: "Ghost Or Ressurect This Artist",
        context: [
        DAGhost_contextMenu.URLContext("*.deviantart.com"),
        DAGhost_contextMenu.SelectorContext("img")
        ],
        contentScript:
        'var className;' +
        'var UserId;' +
        'var divs;' +
        'var div;' +
        'self.on("click", function (node, data) {' +
            'divs = document.getElementsByTagName("div");' +
            'for(var i=0; i<divs.length; i++){' +
                'div = divs[i];' +
                'className = div.getAttribute("class");' +
                'if(null !== className){' +
                    'if(-1 !== className.indexOf("tt-a ")){' +
                        'if(-1 !== div.innerHTML.indexOf(node.src)){' +
                            'UserId = div.getAttribute("userid");' +
                            'if(null !== UserId){' +
                                'self.postMessage(UserId);' +
                                'return;' +
                            '}' +
                        '}' +
                    '}' +
                '}' +
            '}' +
            'self.postMessage(-1);' +
        '});',
        onMessage: function (UserId) {
            var NumGhosted = 0;
            var index = -1;
            var info;

            // Get the index for this UserId, if it exists.
            index = DAGhost_Data[0].indexOf(UserId);

            // First see if a valid UserId was found when the user clicked the menu item.
            if(-1 == UserId)
            {
                info="Invalid image selected.";
                showPanel(info);
                return;
            }

            if(-1 == index)
            {
                // If the index doesn't exist, ghost this user.
                DAGhost_Data[0].push(UserId);
                NumGhosted = DAGhost_Data[0].length - 2; // Subtract 2 since the array is initialized with 2 items.

                // Set a string that contains some info about the action that was taken.
                info = "Ghosted user ID: " + UserId + "!<br><br>" + NumGhosted + " users Ghosted!";
            }
            else
            {
                // Index exists, so resurrect the user.
                DAGhost_Data[0].splice(index,1);
                NumGhosted = DAGhost_Data[0].length - 2; // Subtract 2 since the array is initialized with 2 items.

                // Set a string that contains some info about the action that was taken.
                info = "Resurrected user ID: " + UserId + "!<br>" +
                "Reload the web page (F5) for changes to take effect.<br><br>" +
                NumGhosted + " users Ghosted!";
            }

            // Update the list with the changes made.
            for(var i=0; i<DAGhost_workers.length;i++)
            {
                DAGhost_workers[i].postMessage(DAGhost_Data);
            }

            showPanel(info);
        }
    });

    DAGhost_contextMenu.Item({
        label: "Ghost Or Ressurect This Category",
        context: [
        DAGhost_contextMenu.URLContext("*.deviantart.com"),
        DAGhost_contextMenu.SelectorContext("img")
        ],
        contentScript:
        'var className;' +
        'var Category;' +
        'var divs;' +
        'var div;' +
        'self.on("click", function (node, data) {' +
            'divs = document.getElementsByTagName("div");' +
            'for(var i=0; i<divs.length; i++){' +
                'div = divs[i];' +
                'className = div.getAttribute("class");' +
                'if(null !== className){' +
                    'if(-1 !== className.indexOf("tt-a ")){' +
                        'if(-1 !== div.innerHTML.indexOf(node.src)){' +
                            'Category = div.getAttribute("category");' +
                            'if(null !== Category){' +
                                'self.postMessage(Category);' +
                                'return;' +
                            '}' +
                        '}' +
                    '}' +
                '}' +
            '}' +
            'self.postMessage(-1);' +
        '});',
        onMessage: function (Category) {
            var NumGhosted = 0;
            var index = -1;
            var info;

            // Get the index for this category, if it exists.
            index = DAGhost_Data[1].indexOf(Category);

            // First see if a valid Category was found when the user clicked the menu item.
            if(-1 == Category)
            {
                info="Invalid category selected.";
                showPanel(info);
                return;
            }

            if(-1 == index)
            {
                // If the index doesn't exist, ghost this user.
                DAGhost_Data[1].push(Category);
                NumGhosted = DAGhost_Data[1].length - 2; // Subtract 2 since the array is initialized with 2 items.

                // Set a string that contains some info about the action that was taken.
                info = "Ghosted category: " + Category + "!<br><br>" + NumGhosted + " categories Ghosted!";
            }
            else
            {
                // Index exists, so resurrect the category.
                DAGhost_Data[1].splice(index,1);
                NumGhosted = DAGhost_Data[1].length - 2; // Subtract 2 since the array is initialized with 2 items.

                // Set a string that contains some info about the action that was taken.
                info = "Resurrected category: " + Category + "!<br>" +
                "Reload the web page (F5) for changes to take effect.<br><br>" +
                NumGhosted + " categories Ghosted!";
            }

            // Update the list with the changes made.
            for(var i=0; i<DAGhost_workers.length;i++)
            {
                DAGhost_workers[i].postMessage(DAGhost_Data);
            }

            showPanel(info);
        }
    });
};

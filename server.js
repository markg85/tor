"use strict";

let fs = require("fs"),
    path = require("path"),
    async = require("async"),
    http = require('http'),
    classifier = require('./classifier.js'),
    latest = require('./latest.js')

let indexersDir = path.dirname(require.main.filename) + "/indexers"
let indexerObjects = {}

/*
  TODO!
  - Use express.js for some sligltly neater URL handling.
  - Add a main search page (just one search box in the middle) using bootstrap
  - Add output compression (comes with express.js)
  - Allow json output fields to be managed by the request side (in the url).
    <url>/search/<some query>/fields:name,url,size
    An url like that should only add the fields name, url and size to the output,
    the others (sizeHumanReadable and classification) won't be printed.
  - Allow requesting the avaliable indexers. Could be done via the url:
    <url>/indexers
  - Allow the request to not use certain indexers, could be an url like:
    <url>/search/<some query>/skipIndexers:kickass.js,rarbg.js,...
  - Describe the API usage on some page. <url>/documentation seems ok.
*/

// Crazy code..
// "stolen" from http://stackoverflow.com/a/20463021
function fileSizeIEC(a,b,c,d,e){
 return (b=Math,c=b.log,d=1024,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)
 +' '+(e?'KMGTPEZY'[--e]+'iB':'Bytes')
}

fs.readdir(indexersDir, function (err, files) {
    if (err) {
        throw err;
    }

    console.log("Loading indexers:")

    for(let file of files) {
        let indexerFile = indexersDir + "/" + file
        console.log(" - " + file)
        indexerObjects[file] = require(indexerFile)
    }

    // 2 is the fist argument after "node server.js"
    if (process.argv[2]) {
        handleRequest(0, 0, process.argv[2])
    }
});

function queryIndexers(keyword, callback) {

    async.forEachOf(indexerObjects, function (value, key, callback) {
//        console.log("------------- " + key)
        value.fetch(keyword, callback)

    }, function (err) {

        // Define the output arrays. This is also the order in which they will appear on the screen.
        let outputData = { "2160p" : [], "1080p": [], "720p" : [], "sd" : [] }

        for (let obj in indexerObjects) {
          for (let item of indexerObjects[obj].returnData) {
            // Get the classification of this item.
            let classification = classifier.classify(item.name)
            item.sizeHumanReadable = fileSizeIEC(item.size)
            item.classification = classification

            // Add it to the output data.
            outputData[classification.resolution].push(item)
          }
        }

        // Sort grouped objects by size in descending order
        for (let obj in outputData) {
          // Delete empty objects.
          if (outputData[obj].length === 0) {
            delete outputData[obj];
            continue;
          }

          // Now we start sorting for those that did not get deleted
          outputData[obj].sort(function(a, b) {
            return parseFloat(b.size) - parseFloat(a.size);
          });
        }

        return callback(outputData);
    })
}

function handleResponse(response, data) {
    // If we have a response object (we probably have an http request) so return to that.
    // If we don't the nwe're on the console.
    if (response) {
        // We send our content as application/json
        response.writeHead(200, {'Content-Type': 'application/json'});

        // null, 4 -- this is to have nice json formatting.
        response.end(JSON.stringify(data, null, 4))
    } else {
        console.log(data)
    }
}

//We need a function which handles requests and send response
function handleRequest(request, response, commandlineKeyword){
    if (request.url === '/favicon.ico') {
        response.writeHead(200, {'Content-Type': 'image/x-icon'} );
        response.end();
        return;
    }

    let keyword = commandlineKeyword;

    if (!commandlineKeyword) {
        let searchPos = request.url.search(/\/search\//i)

        if (searchPos > -1) {
            keyword = decodeURIComponent(request.url.substring(8)).trim()
        }
    }

    let latestKeyword = "latest:";
    let searchForLatest = false;

    if (keyword && keyword.toLowerCase().indexOf(latestKeyword) === 0) {
        keyword = keyword.substring(latestKeyword.length).trim();
        searchForLatest = true;
        console.log("We want to search for the latest episode of: " + keyword)
    } else {
        console.log(`We tried to search for: ${keyword}`)
    }

    if (searchForLatest) {
        async.series([
            function(callback) {
                // do some stuff ...
                latest.fetch(keyword, callback)
            },
            function(callback) {
                if (latest.returnData.episodeSuffix) {
                    keyword += " " + latest.returnData.episodeSuffix
                    console.log("Keyword suffix added: " + latest.returnData.episodeSuffix + ". The full keyword is now: " + keyword)

                    queryIndexers(keyword, function (outputData){
                        handleResponse(response, outputData);

                        // Call the callback so that this async thing ends.
                        callback();
                    });
                } else {
                    handleResponse(response, latest.returnData);

                    // Call the callback so that this async thing ends.
                    callback();
                }
            }
        ],
        function(err, results){
            if (commandlineKeyword) {
                // Exit gravefully. No need to keep running and start the server.
                process.exit(0);
            }
        });
    } else {
        queryIndexers(keyword, function (outputData){
            handleResponse(response, outputData);

            if (commandlineKeyword) {
                // Exit gravefully. No need to keep running and start the server.
                process.exit(0);
            }
        });
    }
}

//Create a server
let port = 3020
let server = http.createServer(handleRequest);

//Lets start our server
server.listen(port, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", port);
});

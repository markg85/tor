"use strict";

let fs = require("fs"),
    path = require("path"),
    async = require("async"),
    http = require('http'),
    classifier = require('./classifier.js')

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
        queryIndexers(process.argv[2], function (outputData){
          console.log(outputData)
        });
    }

});

function queryIndexers(keyword, callback) {

    async.forEachOf(indexerObjects, function (value, key, callback) {
//        console.log("------------- " + key)
        value.fetch(keyword, callback)

    }, function (err) {

        let outputData = {}
        for (let obj in indexerObjects) {
          for (let item of indexerObjects[obj].returnData) {
            // Get the classification of this item.
            let classification = classifier.classify(item.name)
            item.sizeHumanReadable = fileSizeIEC(item.size)
            item.classification = classification

            // If the current resulotion isn't in the output data yet, make a new array for it.
            if (!outputData[classification.resolution]) {
              outputData[classification.resolution] = []
            }

            // Add it to the output data.
            outputData[classification.resolution].push(item)
          }
        }

        // Sort grouped objects by size in descending order
        for (let obj in outputData) {
          outputData[obj].sort(function(a, b) {
            return parseFloat(b.size) - parseFloat(a.size);
          });
        }

        return callback(outputData);
    })
}

//We need a function which handles requests and send response
function handleRequest(request, response){
    let searchPos = request.url.search(/\/search\//i)

    if (searchPos > -1) {
      let keyword = decodeURIComponent(request.url.substring(8))
      console.log(`We tried to search for: ${keyword}`)

      queryIndexers(keyword, function (outputData){
        // We send our content as application/json
        response.writeHead(200, {'Content-Type': 'application/json'});

        // null, 4 -- this is to have nice json formatting.
        response.end(JSON.stringify(outputData, null, 4))
      });
    } else {
      response.end();
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

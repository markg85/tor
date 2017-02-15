"use strict";

let fs = require("fs"),
    path = require("path"),
    http = require('http'),
    classifier = require('./classifier.js'),
    latest = require('./latest.js')

let indexersDir = path.dirname(require.main.filename) + "/indexers"
let indexerObjects = []

/*
  TODO!
  - Use express.js for some sligltly neater URL handling.
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
    indexerObjects.push(require(indexerFile))
  }

  // 2 is the fist argument after "node server.js"
  if (process.argv[2]) {
    handleRequest(0, 0, process.argv[2])
  }
});

// From: http://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises
Promise.allSettled = function (promises) {
  return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
    state: 'fulfilled',
    value: v,
  }), r => ({
    state: 'rejected',
    reason: r,
  }))));
};

function handleRequest(request, response, commandlineKeyword = null) {
  let keyword = (commandlineKeyword != null) ? commandlineKeyword : request.url;

  let res = keyword.search(/search:/i) ;
  if (res > -1) {
    keyword = decodeURIComponent(keyword.substring(7)).trim()
  }

  // Handle empty search keyword. Return if empty.
  if (!keyword || keyword.length === 0) {
    handleResponse(response, {error: "Empty search keyword. Please type in a search keyword!"});
    return;
  }

  let latestKeyword = "latest:"
  if (keyword.toLowerCase().indexOf(latestKeyword) === 0) {
    keyword = keyword.substring(latestKeyword.length).trim();
    latest.searchString = keyword;

    latest.execute().then((data) => {
      if (data.episodeSuffix) {
        keyword += " " + data.episodeSuffix
        console.log("Keyword suffix added: " + data.episodeSuffix + ". The full keyword is now: " + keyword)
      }

      fetchDataAndSendRequest(response, keyword);
    })
    .catch((err) => {
      console.log(err)
    });
  } else {
    console.log(`We tried to search for: ${keyword}`)
    fetchDataAndSendRequest(response, keyword);
  }
}

function fetchDataAndSendRequest(response, keyword) {
  // Tell the indexers which thing to look for.
  let indexerPromises = []
  for (let indexer of indexerObjects) {
    indexer.searchString = keyword
    indexerPromises.push(indexer.execute())
  }

  Promise.allSettled(indexerPromises)
  .then((data) => {
    handleResponse(response, prepareOutputData(data));
  })
  .catch((err) => {
    console.log(err);
  });
}


function handleResponse(response, data) {
  // If we have a response object (we probably have an http request) so return to that.
  // If we don't then we're on the console.
  if (response) {
    // We send our content as application/json
    response.writeHead(200, {'Content-Type': 'application/json'});

    // null, 4 -- this is to have nice json formatting.
    response.end(JSON.stringify(data, null, 4))
  } else {
    console.log(data)
    process.exit(0);
  }
}

function prepareOutputData(data) {
  // First filter the objects to only get the data of those that have values.
  let filteredData = []
  for (let objData of data) {
    if (objData.state = "filfilled") {
      if (objData.value.length > 0) {
        filteredData.push(...objData.value)
      }
    }
  }

  // Sort the filteredData by size. This also makes it sorted in the outputData list.
  filteredData.sort(function(a, b) {
    return parseFloat(b.size) - parseFloat(a.size);
  });

  // Define the output arrays. This is also the order in which they will appear on the screen.
  let outputData = { "2160p" : [], "1080p": [], "720p" : [], "sd" : [] }

  for (let item of filteredData) {
    // Get the classification of this item.
    let classification = classifier.classify(item.name)
    item.sizeHumanReadable = fileSizeIEC(item.size)
    item.classification = classification

    // Add it to the output data.
    outputData[classification.resolution].push(item)
  }

  // Lastly, remove empty elements
  for (let item in outputData) {
    if (outputData[item].length === 0) {
      delete outputData[item];
    }
  }

  return outputData;
}

//Create a server
let port = 3020
let server = http.createServer(function(request, response) {
  // Handle favicon.ico
  if (request.url === '/favicon.ico') {
    response.writeHead(200, {'Content-Type': 'image/x-icon'} );
    response.end();
  } else {
    // Allow javascript sites to request this API.
    if (response)
    {
      response.setHeader("Access-Control-Allow-Origin", "*");
    }
    
    // Handle the request.
    handleRequest(request, response);
  }
});

//Lets start our server
server.listen(port, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", port);
});

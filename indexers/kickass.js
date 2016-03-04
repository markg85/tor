"use strict";

let curl = require('curlrequest');
let parseString = require('fast-xml2js').parseString


module.exports = {

  hasDirectMagnetLink: true,
  returnData: [],

  fetch: function(searchString, callback){
    let options = {
      url: `https://kat.cr/usearch/${encodeURIComponent(searchString)}/?rss=1`,
      useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36',
      compressed: true,
      insecure: true,
      timeout: 5,
      retries: 3
    };

    curl.request(options, function (err, data, meta) {
        // This log prints the curl command line. Good for debugging purposes.
        //console.log('%s %s', meta.cmd, meta.args.join(' '));

        if (data) {
          module.exports.parseHtml(data, callback)
        } else {
          callback()
        }
    });
  },

  parseHtml: function(html, callback){

    let returnData = []

    parseString(html, function (err, result) {
        if (result && result.rss)
        {
            for (let item of result.rss.channel[0].item)
            {
                returnData.push({name:item.title[0], url:item["torrent:magnetURI"][0], size:parseInt(item["torrent:contentLength"])})
            }
        }
    });

    module.exports.returnData = returnData;
    callback()
  },
};

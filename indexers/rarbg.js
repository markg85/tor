"use strict";

let curl = require('curlrequest');

module.exports = {

  hasDirectMagnetLink: true,
  returnData: [],

  fetch: function(searchString, callback){
    let options = {
      url: `https://torrentapi.org/pubapi_v2.php?get_token=get_token`,
      useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36',
      insecure: true,
      timeout: 5,
      retries: 3
    };

    curl.request(options, function (err, data, meta) {
        // This log prints the curl command line. Good for debugging purposes.
        //console.log('%s %s', meta.cmd, meta.args.join(' '));

        data = JSON.parse(data)

        if (data && data.token) {
          options.url = `https://torrentapi.org/pubapi_v2.php?mode=search&search_string=${encodeURIComponent(searchString)}&token=${data.token}&format=json_extended&ranked=0`

          curl.request(options, function (err, data, meta) {
            if (data) {
              module.exports.parseHtml(data, callback)
            } else {
              callback()
            }
          });

        } else {
          callback()
        }
    });
  },

  parseHtml: function(html, callback){

    let returnData = []

    let data = JSON.parse(html)
    if (data && data.torrent_results) {
      for (let item of data.torrent_results) {
        returnData.push({name:item.title, url:item.download, size:item.size})
      }
    }

    module.exports.returnData = returnData;
    callback()
  },
};

"use strict";

let curl = require('curlrequest');

module.exports = {
  execute: function() {
    return new Promise((resolve, reject) => {
      let options = {
        url: `https://torrentapi.org/pubapi_v2.php?get_token=get_token`,
        useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        insecure: true,
        timeout: 5,
        retries: 3
      };

      curl.request(options, function (err, data, meta) {
        // This log prints the curl command line. Good for debugging purposes.
        //console.log('%s %s', meta.cmd, meta.args.join(' '));
        let searchString = module.exports.searchString

        data = JSON.parse(data)

        if (data && data.token) {
          options.url = `https://torrentapi.org/pubapi_v2.php?mode=search&search_string=${encodeURIComponent(searchString)}&token=${data.token}&format=json_extended&ranked=0`

          curl.request(options, function (err, data, meta) {
            console.log(err)
            console.log(data)

            if (data) {
              resolve(parseHtml(data))
            } else {
              reject(err)
            }
          });

        } else {
          reject(err)
        }
      });

      function parseHtml(html){

        let returnData = []

        let data = JSON.parse(html)
        if (data && data.torrent_results) {
          for (let item of data.torrent_results) {
            returnData.push({name:item.title, url:item.download, size:item.size})
          }
        }

        return returnData;
      }
    });
  },
  searchString: ""
}

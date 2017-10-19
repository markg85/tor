"use strict";

let curl = require('curlrequest');
let parseString = require('fast-xml2js').parseString

module.exports = {
  execute: function() {
    return new Promise((resolve, reject) => {
      let searchString = module.exports.searchString

      let options = {
        url: `http://extra.to/rss.xml?type=search&search=${encodeURIComponent(searchString)}`,
        useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        compressed: true,
        insecure: true,
        timeout: 5,
        retries: 3
      };

      console.log(options.url)

      curl.request(options, function (err, data, meta) {
        if (data) {
          resolve(parseHtml(data))
        } else {
          reject(err)
        }
      });

      function parseHtml(html){
        let returnData = [];

        parseString(html, function (err, result) {
          if (result && result.rss && result.rss.channel[0].item) {
            for (let item of result.rss.channel[0].item) {
              let name = item.title[0];
              let url = item.magnetURI[0];
              let size = item.size[0];
              returnData.push({name:name, url:url, size:size})
            }
          }
        });

        return returnData;
      }
    });
  },
  searchString: ""
}

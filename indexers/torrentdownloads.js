"use strict";

let curl = require('curlrequest');
let parseString = require('xml2js').parseString

module.exports = {
  execute: function() {
    return new Promise((resolve, reject) => {
      let searchString = module.exports.searchString

      let options = {
        url: `https://www.torrentdownloads.me/rss.xml?type=search&search=${encodeURIComponent(searchString)}`,
        useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        compressed: true,
        insecure: true,
        timeout: 5,
        retries: 3
      };

      console.log(options.url)

      curl.request(options, function (err, data, meta) {
        // This log prints the curl command line. Good for debugging purposes.
        //console.log('%s %s', meta.cmd, meta.args.join(' '));

        if (data && data.length > 0) {
          resolve(parseHtml(data))
        } else {
          reject(err)
        }
      });

      function parseHtml(html){

        let returnData = []

        parseString(html, function (err, result) {
          if (!result.rss.channel.item === undefined) {
            return returnData;
          }

          for (let item of result.rss.channel[0].item) {
            // console.log(item)
            // let url = item.enclosure[0][Object.keys(item.enclosure[0])[0]].url
            let infoHashRegex = /([A-F\d]{40})/i
            let infoHash = infoHashRegex.exec(item.info_hash[0])[0]
            let title = item.title[0]
            let url = ''

            if (infoHash.length > 1) {
              url = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title).replace(/%20/g, '+')}&tr=${encodeURIComponent(`udp://tracker.publicbt.com/announce`)}`
            }

            returnData.push({name:title, url:url, size:parseInt(item.size[0])})
          }
        });

        return returnData;
      }
    });
  },
  searchString: ""
}

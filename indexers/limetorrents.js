"use strict";

let curl = require('curlrequest');
let parseString = require('fast-xml2js').parseString

function encode(str) {
    let result = "";

    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) == " ") result += "+";
        else result += str.charAt(i);
    }
    return result;
}

module.exports = {
  execute: function() {
    return new Promise((resolve, reject) => {
      let searchString = module.exports.searchString

      let options = {
        url: `https://www.limetorrents.cc/searchrss/${encodeURIComponent(searchString)}/?rss=1`,
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

      //console.log(module.parent.exports)

      function parseHtml(html){

        let returnData = []

        parseString(html, function (err, result) {

          if (!result.rss.channel[0].item) {
            return returnData;
          }

          // TODO: Add additional parsing rules here. Limetorrents is a bit nasty and just searches for "related" words if it doesn't find any matches.
          // so we should add some logic here that filters out what Limetorrents adds in.. Yay... Or we can drop limetorrents alltogether?
          for (let item of result.rss.channel[0].item) {
            let url = item.enclosure[0][Object.keys(item.enclosure[0])[0]].url
            let infoHashRegex = /([A-F\d]{40})/i
            let infoHash = infoHashRegex.exec(url)[0]

            if (infoHash.length > 1) {
              url = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(item.title[0]).replace(/%20/g, '+')}&tr=${encodeURIComponent(`udp://tracker.publicbt.com/announce`)}`
            }

            returnData.push({name:item.title[0], url:url, size:parseInt(item.size[0])})
          }
        });

        return returnData;
      }
    });
  },
  searchString: ""


}

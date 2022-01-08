"use strict";

let curl = require('curlrequest');
let parseString = require('xml2js').parseString

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
        url: `https://torrent-paradise.ml/api/search?q=${encodeURIComponent(searchString)}`,
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
          resolve(parse(data))
        } else {
          reject(err)
        }
      });

      //console.log(module.parent.exports)

      function parse(data){

        let returnData = []
        let jsonData = JSON.parse(data);

        for (let obj of jsonData) {
            if (obj.len > 1000) {
                let magnet = `magnet:?xt=urn:btih:${obj.id}&dn=${encodeURIComponent(obj.text).replace(/%20/g, '+')}&tr=${encodeURIComponent(`udp://tracker.publicbt.com/announce`)}`
                returnData.push({name:obj.text, url:magnet, size:parseInt(obj.len)})
            }
        }

        return returnData;
      }
    });
  },
  searchString: ""


}

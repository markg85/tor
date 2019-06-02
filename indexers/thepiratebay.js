"use strict";

let curl = require('curlrequest');
let cheerio = require('cheerio')

module.exports = {
  execute: function() {
    return new Promise((resolve, reject) => {
      let searchString = module.exports.searchString

      let options = {
        url: `https://pirateproxy.lat/search/${encodeURIComponent(searchString)}/0/99/0`,
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
        let $ = cheerio.load(html)

        let returnData = []

        $('#searchResult').children().each(function(i, elem) {
          let childs = $('td', this);
          let name = $('a', childs.eq(1)).eq(0).text();

          if (name) {
            let url = $('a', childs.eq(1)).eq(1).attr('href');
            let hrSize = $(childs).find('font').text().match(/Size (.+?),/)[1];

            let sizeTag = ['MiB', 'GiB']
            let newSize = 0

            for (let i = 0; i < 2; i++) {
             if (hrSize.endsWith(sizeTag[i])) {
               newSize = parseInt(parseFloat(hrSize.replace(sizeTag[i], "").trim()) * Math.pow(1000, 2 + i))
             }
            }

            if (newSize > 0) {
              returnData.push({name:name, url:url, size:newSize})
            }
          }
        });

        return returnData;
      }
    });
  },
  searchString: ""
}

"use strict";

let curl = require('curlrequest');
let cheerio = require('cheerio')

module.exports = {
  execute: function() {
    return new Promise((resolve, reject) => {
      let searchString = module.exports.searchString

      let options = {
        url: `https://kickasstor.ws/search/${encodeURIComponent(searchString)}/`,
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

        $('tr').each(function(i, elem) {
          let childs = $('a', this);
          let name = childs.eq(0).attr('title');

          if (name) {
            let hrSize = $('td', this).eq(1).text();
            let url = childs.eq(3).attr('href');
            let sizeTag = ['MB', 'GB']
            let newSize = 0

            for (let i = 0; i < 2; i++) {
             if (hrSize.endsWith(sizeTag[i])) {
               newSize = parseInt(parseFloat(hrSize.replace(sizeTag[i], "").trim()) * Math.pow(1024, 2 + i))
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

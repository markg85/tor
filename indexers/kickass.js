"use strict";

let curl = require('curlrequest');
let cheerio = require('cheerio')

module.exports = {
  execute: function() {
    return new Promise((resolve, reject) => {
      let searchString = module.exports.searchString

      let options = {
        url: `https://katcr.co/katsearch/page/1/${encodeURIComponent(searchString)}`,
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
          let name = $('a.torrents_table__torrent_title', this).text().replace(/^\s*[\r\n]/gm, '').trim();

          if (name) {
            let hrSize = $('td', this).eq(1).text();
            let url = $('.kf__magnet', this).parent().attr('href');
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

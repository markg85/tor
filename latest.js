"use strict";

/**
 * "latest" uses the tvmaze api (http://www.tvmaze.com/api) to get the latest information about airing dates for
 * any particular series. It ONLY works on series!
 *
 * The API works by making two calls.
 * 1. to find the series ID on tvmaze
 * 2. to get the series details with the last aired episode data
 *
 * If both requests work and there is data to return then it will be used!
 * If it failes in any step some json error data will be returned.
 */


let curl = require('curlrequest');

module.exports = {
  returnData: [],

  zeroPad: function(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
  },

  fetch: function(searchString, callback){
    let options = {
      url: `http://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(searchString)}&embed=previousepisode`,
      useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36',
      insecure: true,
      timeout: 5,
      retries: 3
    };

    curl.request(options, function (err, data, meta) {
        module.exports.returnData = {error: "No valid episode information found in tvmaze. We used url: " + options.url}

        if (data) {
            let obj = JSON.parse(data)

            if (obj && obj._embedded && obj._embedded.previousepisode) {
                let previousEpisodeData = obj._embedded.previousepisode;
                module.exports.returnData = {episodeSuffix: `S${module.exports.zeroPad(previousEpisodeData.season, 2)}E${module.exports.zeroPad(previousEpisodeData.number, 2)}`, episodeName: previousEpisodeData.name}
            }
        }

        callback()
    });
  }
};

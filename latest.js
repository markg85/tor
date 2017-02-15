"use strict";

/**
 * "latest" uses the tvmaze api (http://www.tvmaze.com/api) to get the latest information about airing dates for
 * any particular series. It ONLY works on series!
 *
 * The API works by doing a "single search" to their api. That allows us to:
 * - get the shows information
 * - get the previous episode air date
 * - get the next episode air date
 * All with just one API call on a rather fast service!
 *
 * TODO:
 * 1. Change the embed query part to: embed[]=previousepisode&embed[]=nextepisode, that fetches the last aired episode and the next airdate.
 * 2. Once we have that data, save it locally as a cache (to minimize api call usage). Store it for at most 1 week or till the next air data,
 *    which ever one is the shortest!
 * 3. Periodically re-evaluate those cached results to update the cache. This should reduce API usage to the bare minimum where a call is only
 *    done if there was no cache or if the cache expired.
 */


let curl = require('curlrequest');

module.exports = {
  zeroPad: function(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
  },

  execute: function() {
    return new Promise((resolve, reject) => {
      let searchString = module.exports.searchString
      let options = {
        url: `http://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(searchString)}&embed=previousepisode`,
        useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        insecure: true,
        timeout: 5,
        retries: 3
      };

      curl.request(options, function (err, data, meta) {

        if (data) {
          let obj = JSON.parse(data)
          if (obj && obj._embedded && obj._embedded.previousepisode) {
            let previousEpisodeData = obj._embedded.previousepisode;
            resolve({episodeSuffix: `S${module.exports.zeroPad(previousEpisodeData.season, 2)}E${module.exports.zeroPad(previousEpisodeData.number, 2)}`, episodeName: previousEpisodeData.name, rawData: obj})
          }
        } else {
          reject(err)
        }

        resolve({error: "No valid episode information found in tvmaze. We used url: " + options.url})
      });

    })
  },
  searchString: ""
};

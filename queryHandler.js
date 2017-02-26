'use strict';

const curl = require('curlrequest');

module.exports = class QueryHandler {
  constructor() {

  }
  
  zeroPadding(num, size = 2){
    var st = num+""; var sl = size - st.length - 1;
    for (; sl >= 0; sl--) st = "0" + st;
    return st;    
  }
  
  handleImdb(id) {
    this.apiResult = null;
    this.searchMode = "IMDB"
    // With IMDb, we only need the OMDb api, that seems to be handling series just fine.
    // Even though it claims to be for movies...
    let omdb = `http://www.omdbapi.com/?i=tt${id}&plot=short&r=json`
//    let tvmaze = `http://api.tvmaze.com/lookup/shows?imdb=tt${id}`
//    let promises = [this.queryApiService(tvmaze), this.queryApiService(omdb)]

    return new Promise((resolve, reject) => {
      this.queryApiService(omdb).then(values => {
        this.apiType = "OMDb"
        this.apiResult = JSON.parse(values)
        resolve(this.apiResult.Title)
      }, reason => {
        reject(reason)
      });
    });

//    return [this.queryApiService(omdb)];
  }

  handleSeriesEpisode(series, episode) {
    this.apiResult = null;
    this.searchMode = "SeriesEpisode"
    return new Promise((resolve, reject) => {
      resolve(series + " " + episode);
      reject(); // It will never come here.
    });
  }

  handleSeriesLatestEpisode(series) {
    this.apiResult = null;
    this.searchMode = "LatestEpisode"
    let tvmaze = `http://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(series)}&embed=previousepisode`;
    
    return new Promise((resolve, reject) => {
      this.queryApiService(tvmaze).then(values => {

        if (values) {
          this.apiType = "TVMaze"
          this.apiResult = JSON.parse(values)
          let obj = this.apiResult
          if (obj && obj._embedded && obj._embedded.previousepisode) {
            let previousEpisodeData = obj._embedded.previousepisode;
            resolve(`${series} S${this.zeroPadding(previousEpisodeData.season, 2)}E${this.zeroPadding(previousEpisodeData.number, 2)}`)
          }
        }

        reject({error: "No valid episode information found on tvmaze. URL used was:" + tvmaze})

      }, reason => {
        reject({error: "You were probably looking for a movie while using the latest: prefix. That is wrong!", reason: reason})
      }).catch (reason => {
        reject(reason);
      });
    });
  }

  handleWildSearch(query) {
    this.apiResult = null;
    this.searchMode = "WildcardSearch"
    return new Promise((resolve, reject) => {
      resolve(query);
      reject("Wild search rejected."); // It will never come here.
    });
  }

  queryApiService(url) {
    return new Promise((resolve, reject) => {
      let options = {
        url: url,
        useragent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        insecure: true,
        timeout: 5,
        retries: 3
      };

      console.log(options.url)

      curl.request(options, function (err, data, meta) {
        if (err) {
          reject({error: "No valid information found in api service. We used url: " + url})
        } else {
          resolve(data);
        }
        reject("Unable to contact API. Url used:" + url);
      });
    });
  }

  parse(data) {
    let promises = []

    // Determine what we are trying to parse.
    let matchResult = data.match(/^((t{2})?(\d{7}))$/i);
    if (matchResult) {
      promises.push(this.handleImdb(matchResult[3])); // 3 = the 7 digit imdb id.
    } else if (matchResult = data.match(/(.+) (s[0-9]{1,2}e[0-9]{1,2})/i)) {
      promises.push(this.handleSeriesEpisode(matchResult[1].trim(), matchResult[2].trim()));
    } else if (matchResult = data.match(/latest: ?(.*)/i)) {
      // Handle the latest. Meaning we want to know when the last apisode of a serie aired.
      promises.push(this.handleSeriesLatestEpisode(matchResult[1].trim()));
    } else {
      // It can be a serie or a movie at this point. We just don't know since just a "name" is provided.
      promises.push(this.handleWildSearch(data));
    }

    // Wrapping the promises from above in another promise allows us to enrich the return data
    // with some valuable metadata (poster, summary, etc..)
    let returnPromise = new Promise((resolve, reject) => {
      let genericMeta = {name: data, keyword: data, searchMode: this.searchMode}
      
      Promise.all(promises).then(values => { 
       let apiData = this.apiResult;

//        console.log(apiData._embedded.previousepisode)
        let meta = {}
        if (this.apiResult != null) {
          if (this.apiType == "TVMaze") {
            let episodeData = apiData._embedded.previousepisode
            meta = {image: apiData.image.original, 
                    summary: apiData.summary, 
                    keyword: data, 
                    name: apiData.name, 
                    season: this.zeroPadding(episodeData.season, 2),
                    episode: this.zeroPadding(episodeData.number, 2)}
          } else if (this.apiType == "OMDb") {
            meta = {image: apiData.Poster, 
                    summary: apiData.Plot, 
                    keyword: data, 
                    name: apiData.Title}
          }
        }
        
        resolve({searchString: values[0], meta: Object.assign(genericMeta, mata)});
      }, reason => {
        reason['meta'] = genericMeta;
        reject(reason);
      });
    });

    return returnPromise;
  }

};

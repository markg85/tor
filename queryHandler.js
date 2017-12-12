'use strict';

const seriesmeta = require('seriesmeta');

class QueryHandler {
  constructor(queryType) {
    this.queryType = 'NONE';
  }
  
  zeroPadding(num, size = 2){
    let st = num+"";
    let sl = size - st.length - 1;
    for (; sl >= 0; sl--) st = "0" + st;
    return st;
  }

  async apiWrapper(apiFunctionData, series) {
    let one = await apiFunctionData;
    let two = await seriesmeta.metadata(series);
    return [one, two];
  }

  parse(data) {
    // Determine what we are trying to parse.
    let matchResult = data.match(/^((t{2})?(\d{7}))$/i);
    
    if (matchResult) {
      this.queryType = 'IMDB_SEARCH' // Could be a while series, a specific episode or a movie...
      // matchResult[3] // the 7 digit imdb code
      // To be re-implemented
      return Promise.reject(`To be re-implemented: ${this.queryType}`);
    } else if (matchResult = data.match(/(.+) s([0-9]{1,2})e([0-9]{1,2})/i)) {
      this.queryType = 'SERIES_EXACT'
      let series = matchResult[1].trim()
      let season = matchResult[2].trim()
      let episode = matchResult[3].trim()

      return this.apiWrapper(seriesmeta.isEpisodeAired(season, episode, series), series);
    } else if (matchResult = data.match(/latest: ?(.*)/i)) {
      // Handle the latest. Meaning we want to know when the last apisode of a serie aired.
      this.queryType = 'SERIES_LATEST'
      let series = matchResult[1].trim()
      return this.apiWrapper(seriesmeta.whenIsPrevious(series), series);
    } else {
      this.queryType = 'WILDCARD_SEARCH' // Could be any of the above.
      // It can be a serie or a movie at this point. We just don't know since just a "name" is provided.
      // To be re-implemented
      //promises.push(this.handleWildSearch(data));
      return Promise.reject(`To be re-implemented: ${this.queryType}`);
    }
  }

  // The data is whatever comes from parse.
  // We assume that if you end up in this function, there is data! The input object will be enriched by 
  // adding search string to each entry.
  // It does use the internally set qeuryType to determine how the search query must look like.
  composeSearchString(data) {
    if (this.queryType == 'SERIES_LATEST') {
      for (let episode of data) {
        episode.searchQuery = `${episode.series} S${this.zeroPadding(episode.season)}E${this.zeroPadding(episode.episode)}`
      }
    } else if (this.queryType == 'SERIES_EXACT') {
      // Our input is not an array because we we were searching for 1 exact episode. Thus we have an object containing the data.
      data.searchQuery = `${data.series} S${this.zeroPadding(data.season)}E${this.zeroPadding(data.episode)}`
    }
  }

};

module.exports = new QueryHandler();

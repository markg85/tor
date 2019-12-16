'use strict';
const crypto = require('crypto')
const seriesmeta = require('seriesmeta');
const fs = require('fs');
const https = require('https');

function saveImageToDisk(url, localPath) {
  return new Promise((resolve, reject) => {
    let file = fs.createWriteStream(localPath);
    https.get(url, function(response) {
      response.pipe(file);
    });
    resolve();
  });
}

seriesmeta.imageObjectHandler = (images) => {
  for (let obj in images) {
    images[obj] = images[obj].replace(/http:/i, "https:")
  }

  let hash = crypto.createHash('md5').update(images['original']).digest("hex")
  let ext = images['original'].split('.').pop();
  let file = `${hash}.${ext}`

  // Here it stores the source file, likely a jpg one.
  if (!fs.existsSync(`./imagecache/${file}`)) {
    saveImageToDisk(images['original'], `./imagecache/${file}`)
  }

  // ... internally on the server we're monitoring for new files being writtenbundleRenderer.
  // if that new file is not a webp file, we convert the input to webp.
  // thus here we use .webp even though at this very moment we don't have that file yet.
  // We well in about half a second after this call though.
  images['original'] = `https://i.sc2.nl/${hash}.webp`
  images['medium'] = `https://i.sc2.nl/210x295/${hash}.webp`
  return images;
}

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
    return { results: one, meta: two};
  }

  parse(data) {
    // Determine what we are trying to parse.
    let newData = data.replace(/\./g, ' ')
    let matchResult = newData.match(/^((t{2})?(\d{7}))$/i);

    if (matchResult) {
      this.queryType = 'IMDB_SEARCH' // Could be a while series, a specific episode or a movie...
      // matchResult[3] // the 7 digit imdb code
      // To be re-implemented
      return Promise.reject(`To be re-implemented: ${this.queryType}`);
    } else if (matchResult = newData.match(/(.+) s([0-9]{1,2})e([0-9]{1,2})/i)) {
      this.queryType = 'SERIES_EXACT'
      let series = matchResult[1].trim()
      let season = matchResult[2].trim()
      let episode = matchResult[3].trim()

      return this.apiWrapper(seriesmeta.isEpisodeAired(season, episode, series), series);
    } else if (matchResult = newData.match(/latest: ?(.*)/i)) {
      // Handle the latest. Meaning we want to know when the last apisode of a serie aired.
      this.queryType = 'SERIES_LATEST'
      let series = matchResult[1].trim()
      return this.apiWrapper(seriesmeta.whenIsPrevious(series), series);
    } else {
      this.queryType = 'WILDCARD_SEARCH' // Could be any of the above.
      // It can be a serie or a movie at this point. We just don't know since just a "name" is provided.
      // To be re-implemented
      //promises.push(this.handleWildSearch(newData));
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

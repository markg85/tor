"use strict";

module.exports = {
  classify: function(input) {
    let codec = `x264`
    let bitdepth = 8 // 8 bit, 10 bit...

    // If we have x256/hevc content
    if (input.search(/x265|h265|h\.265|hevc/i) > 0) {
      codec = 'x265'
    }

    let resolution = 'sd'

    if (input.search(/720p/i) > 0) {
      resolution = '720p'
    }
    if (input.search(/1080p/i) > 0) {
      resolution = '1080p'
    }
    if (input.search(/2160p/i) > 0) {
      resolution = '2160p'
    }

    let source = 'hdtv'

    if (input.search(/WEB-DL|WEB_DL|WEB\.DL/i) > 0) {
      source = 'web-dl'
    }
    if (input.search(/WEBRIP/i) > 0) {
      source = 'webrip'
    }
    if (input.search(/BRRIP|BDRIP|BluRay/i) > 0) {
      source = 'brrip'
    }
    if (input.search(/DVDRip|DVD-Rip/i) > 0) {
      source = 'dvdrip'
    }
    if (input.search(/BluRay(.*)REMUX/i) > 0) {
      source = 'bluray-remux'
    }
    if (input.search(/BluRay(.*)\.(AVC|VC-1)/i) > 0) {
      source = 'bluray-full'
    }

    if (input.search(/10-bit|10 bit|10bit/i) > 0) {
      bitdepth = 10
    }

    return {codec: codec, resolution: resolution, source: source, bitdepth: bitdepth}
  }
};

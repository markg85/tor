#!/bin/sh

DIR=/home/docker-data/tor/imagecache
inotifywait -e CLOSE_WRITE -m -r $DIR --format %f |
while read RES
   do
      filename="${RES%%.*}"
      extension="${RES#*.}"
      if [ "$extension" != "webp" ]; then
         cwebp -q 85 $DIR/$RES -o $DIR/$filename.webp -quiet
      fi
      ln $DIR/$RES /home/docker-data/static_sites/i/$RES;
   done


#!/bin/sh

DIR=/home/docker-data/tor/imagecache
inotifywait -e CLOSE_WRITE -m -r $DIR --format %f |
while read RES
   do ln $DIR/$RES /home/docker-data/static_sites/i/$RES; done


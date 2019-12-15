# TOR
As for "Torrent", not the TOR network.

## Inotifywait
TOR needs the `inotifywait` command to exists. Install this via your distribution packages. It's usually in something names `inotify-tools`.

## Imagecache
Tor is using TVMaze in the background (via the SeriesMeta NPN package). The TOR code tries to download the images. But as TOR is only an API, it's not it's place to server static images. It merely hosts an API and should output API data. To get around this, TOR does in fact download the full resolution image as it's available in the TVMaze API, but it doesn't provide any way for you to use it from it's API. Instead, it tries to put it in a folder that is used by `i.sc2.nl` (which is fully dedicated to hosting images) so that images can be fetched from there. 

### monitor-imagecache.sh
This file `copies` images from the TOR imagecache folter to the `i.sc2.nl` static folder by means of making a hard link. So it does not copy at all! The files that get linked simply exist in 2 places under 1 inode.

In TOR, the `imagecache` folder is where images will be stored. You should change the paths in `monitor-imagecache.sh` accordingly if you change them from what they are by default. You should also change the static_sites folder according to your static sites location.

### Startup script (systemd)
The file `monitor-imagecache.service` is the startup script for systemd. Edit it to make sure the path to `monitor-imagecache.sh` is set appropriately. Then copy this file to `/etc/systemd/system/`.
 
Then enable + start this script:

    systemctl enable monitor-imagecache
    systemctl start monitor-imagecache

It should now be all set and working. Start Tor and the image hosting service.

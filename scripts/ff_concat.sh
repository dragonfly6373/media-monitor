#!/bin/bash

# input example: ./ff_concat.sh '/tmp/live-streaming/records/demo' '/tmp/live-streaming/records/demo.mp4'
# with a bash for loop
for f in $1/*.mkv; do echo "file '$f'" >> $1/_filelist; done
ffmpeg -f concat -safe 0 -i $1/_filelist -c copy $2
rm $1/_filelist

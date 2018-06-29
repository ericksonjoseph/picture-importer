#!/bin/bash
set -eu

artistId=$1
folder=$2
basepath=/Users/destinie/Clients/DJoseph/Images

#mkdir -p tmp/
ls $basepath/$folder/ > tmp/$folder && node src/index.js $artistId tmp/$folder $basepath/$folder

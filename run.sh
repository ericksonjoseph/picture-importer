#!/bin/bash
set -eu

ls ~/Desktop/itfu/$2/ > tmp/$2 && node src/index.js $1 tmp/$2 $2

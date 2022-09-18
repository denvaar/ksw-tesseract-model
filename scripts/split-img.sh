#!/bin/bash

INPUT_IMG_PATH=$1
OUTPUT_DIR=./output
THRESHHOLD=150

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)

$SCRIPT_DIR/croptxt $INPUT_IMG_PATH $OUTPUT_DIR $THRESHHOLD --debug

# ls $OUTPUT_DIR/*.tiff | \
# 	xargs -P4 -L1 -I{} convert {} -strip -type palette {}
# ls $OUTPUT_DIR/*.tiff | \
# 	xargs -P4 -L1 -I{} basename {} .tiff | \
# 	xargs -P4 -L1 -Ibasefile touch $OUTPUT_DIR/basefile.gt.txt

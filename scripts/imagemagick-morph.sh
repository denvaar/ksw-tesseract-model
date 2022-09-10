#!/bin/bash

OUTPUT_DIR=./output
INPUT_IMG_PATH=$1
DIMENSION=$2
EXT=${INPUT_IMG_PATH##*.}
INPUT_FILE=$(basename $INPUT_IMG_PATH .$EXT)

OLDIFS=$IFS
IFS=$'\n'
bboxArr=(`convert $INPUT_IMG_PATH +repage \
-morphology erode rectangle:$DIMENSION +repage \
-threshold 0 -type bilevel \
-define connected-components:exclude-header=true \
-define connected-components:verbose=true \
-define connected-components:mean-color=true \
-connected-components 8 null: | grep "gray(0)" | awk '{print $2}'`)
IFS=$OLDIFS
num=${#bboxArr[*]}
echo $num
for ((i=0; i<num; i++)); do
bbox=${bboxArr[$i]}
echo "$i $bbox"
convert $INPUT_IMG_PATH +repage -crop $bbox +repage $OUTPUT_DIR/${INPUT_FILE}_word_${i}.${EXT}
done

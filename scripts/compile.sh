#!/bin/bash

OPENCV_PC_PATH=/usr/local/Cellar/opencv/4.6.0/lib/pkgconfig/opencv4.pc

g++ `pkg-config --cflags --libs $OPENCV_PC_PATH` -std=c++11 src/croptxt.cpp -o scripts/croptxt

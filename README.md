# S'gaw Karen Language Model for Tesseract

### Tools to help

0. (Initial setup) Compile cpp program using `sh scripts/compile.sh` replacing `OPENCV_PC_PATH` accordingly.
0. Split image based on lines of text using either `sh scripts/split-img.sh /path/to/input/image.png` or `sh scripts/imagemagick-morph.sh /path/to/input/image.png 7x7`. to populate the `/output` directory with images to be processed.
0. Use the web app `node scripts/server.js` to generate .gt.txt and .tiff files in `/ground-truth`.

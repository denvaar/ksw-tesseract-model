#include <opencv2/opencv.hpp>
#include <unistd.h>
#include <ctime>
#include <filesystem>

using namespace cv;
using namespace std;

std::string gen_random(const int len) {
    static const char alphanum[] =
        "0123456789"
        "abcdefghijklmnopqrstuvwxyz";
    std::string tmp_s;
    tmp_s.reserve(len);

    for (int i = 0; i < len; ++i) {
        tmp_s += alphanum[rand() % (sizeof(alphanum) - 1)];
    }

    return tmp_s;
}

/*
 * ARGS
 * ------
 *  1 - source image path
 *  2 - output path
 *  3 - threshhold to determine white vs black
 *  4 - --debug to output png file with lines
 *
 */
int main(int argc, char** argv) {
    srand((unsigned)time(NULL) * getpid());

    bool debug_flag = false;

    if (argv[4] != NULL && strcmp(argv[4], "--debug") == 0) {
        debug_flag = true;
    }

    std::string input_path = argv[1];


    std::string input_file_name = input_path.substr(input_path.rfind("/") + 1);

    Mat3b src = imread(input_path);
    std::string output_path = argv[2];
    int thresh = stoi(argv[3]);

    Mat3b img;
    GaussianBlur(src, img, Size(3, 3), 0);

    // Binarize image. Text is white, background is black
    Mat1b bin;
    cvtColor(img, bin, COLOR_BGR2GRAY);
    bin = bin < thresh;

    // Find all white pixels
    vector<Point> pts;
    findNonZero(bin, pts);

    // Get rotated rect of white pixels
    RotatedRect box = minAreaRect(pts);
    // if (box.size.width < box.size.height)
    // {
    //     // swap(box.size.width, box.size.height);
    //     box.angle += 90.f;
    // }

    Point2f vertices[4];
    box.points(vertices);

    for (int i = 0; i < 4; ++i) {
        line(img,
                vertices[i],
                vertices[(i + 1) % 4],
                Scalar(0, 255, 0));
    }

    // Rotate the image according to the found angle
    Mat1b rotated;
    Mat M = getRotationMatrix2D(box.center, box.angle - 90.f, 1.0);
    warpAffine(bin,
            rotated,
            M,
            bin.size(),
            INTER_CUBIC,
            BORDER_REPLICATE);


    // Compute horizontal projections
    Mat1f horProj;
    reduce(rotated, horProj, 1, REDUCE_AVG);

    // Remove noise in histogram. White bins identify space lines, black bins identify text lines
    float th = 0;
    Mat1b hist = horProj <= th;

    // Get mean coordinate of white white pixels groups
    vector<int> ycoords;
    int y = 0;
    int count = 0;
    bool isSpace = false;
    for (int i = 0; i < rotated.rows; ++i) {
        if (!isSpace) {
            if (hist(i)) {
                isSpace = true;
                count = 1;
                y = i;
            }
        }
        else {
            if (!hist(i)) {
                isSpace = false;
                ycoords.push_back(y / count);
            }
            else {
                y += i;
                count++;
            }
        }

    }

    Mat3b result;
    cvtColor(rotated, result, COLOR_GRAY2BGR);
    int prev_y = 0;
    for (int i = 0; i < ycoords.size(); ++i) {

        if (ycoords[i] - prev_y > 10) {
            std::string basename = output_path + "/" + gen_random(25);

            imwrite(basename + ".png",
                    ~result(Rect(
                            Point(0, prev_y),
                            Point(result.cols, ycoords[i]))));
        }

        prev_y = ycoords[i];
    }

    if (debug_flag == true) {
        for (int i = 0; i < ycoords.size(); ++i) {

            line(result,
                    Point(0, ycoords[i]),
                    Point(result.cols, ycoords[i]),
                    Scalar(0, 255, 0));

        }


        imwrite(output_path +
                "/debug-" +
                input_file_name,
                result);
    }

    return 0;
}

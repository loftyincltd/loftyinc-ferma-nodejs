# Python Fingerprint Recognition
Fingerprint recognition with SKimage and OpenCV

Requirements:
- NumPy
- SKimage
- OpenCV2


Works by extracting minutiae points using harris corner detection.

Uses SIFT (ORB) go get formal descriptors around the keypoints with brute-force hamming distance and then analyzes the returned matches using thresholds.

Usage:

1. Place 2 fingerprint images that you want to compare inside the database folder
2. Pass the names of the images as arguments in the console

sudo yum install python37
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py

pip3 install --trusted-host pypi.python.org -r requirements.txt
sudo yum install mesa-libGL

pip install numpy==1.17.5

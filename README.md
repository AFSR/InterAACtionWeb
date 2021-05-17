# InterAACtionBox

This repo contains the Materials used to build and generate a custom ISO file for the InterAACtionBox device using Cubic. 

## 0) Install Cubic and Download ISO
### Cubic
```
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 081525E2B4F1283B
sudo apt-add-repository ppa:cubic-wizard/release
sudo apt update
sudo apt install cubic
```
### ISO
Download "ubuntu-20.04.2.0-desktop-amd64.iso" on https://releases.ubuntu.com/20.04/

### Add resources to cubic
After these 2 steps you then need to open the iso file with cubic, and you need to copy/past the folders of this repository at the root of the opened iso file system (cd ~ before copying if needed)
You can then execute the script (for now line by line is safer) to install all the dependencies of the project.


## 1) Libs

Contains the .deb files that will be installed before the execution of the main script.

## 2) Scripts

Contains all the scripts needed to update the ubuntu 20.04 ISO file (for now using Cubic)

## 3) Ressources

Some usefull ressources for the creation of the ISO

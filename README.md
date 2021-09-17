# InterAACtionBox
## The first open source integrated device allowing Alternative and Augmented Communication for all

This repo contains the Materials used to build and generate a custom ISO file for the InterAACtionBox device using Cubic. 

## 0) Selected Hardware for the project
Inspiron 14 5000 2-in-1
### why ?
- Suitable dimensions ( 14' )
- Convertible ( pc, tablet, reversible, easel )
- multi-touch
- eye-tracker compatible
- HD webcam
- decent performances/price ratio

## 1) Generate the operating system

### Install Cubic and Download ISO

#### ISO
For this project we decided to use the last Long-Term support version of Ubuntu as basis for our OS.
Download "ubuntu-20.04.2.0-desktop-amd64.iso" on https://releases.ubuntu.com/20.04/


#### Cubic
In order to modify the previously downloaded Ubuntu OS you need to install a software like Cubic

Copy/Past the following lines in order to download and install Cubic on your computer
```
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 081525E2B4F1283B
sudo apt-add-repository ppa:cubic-wizard/release
sudo apt update
sudo apt install cubic
```

### Update Ubuntu with our ressources
After these 2 steps you then need to start Cubic and open the Ubuntu 20.04 iso with it.
You now have to copy/paste the folders contained in this repo at the root of the opened iso file system (cd ~ before copying if needed).
Execute the Script/Final_script.sh (for now line by line is safer as there are some non automatic requests) to install all the dependencies of the project.

### 2) Materials

#### Libs

Contains the .deb files needed for the execution of the main script.

#### Scripts

Contains the main script needed to update the ubuntu 20.04 ISO file (for now using Cubic) with our project

#### Ressources

Some usefull ressources for the creation of the ISO

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

## 1) Prepare the ISO

### Download ISO
For this project we decided to use the last Long-Term support version of Ubuntu as basis for our OS.<br>
Download "ubuntu-20.04.3.0-desktop-amd64.iso" on https://releases.ubuntu.com/20.04/

### Download script
You need to download the script called "install.sh" of this repository.

### Install Cubic
In order to modify the previously downloaded Ubuntu OS you need to install a software like Cubic

Copy/Past the following lines in order to download and install Cubic on your computer
```
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 081525E2B4F1283B
sudo apt-add-repository ppa:cubic-wizard/release
sudo apt update
sudo apt install cubic
```

## 3) Create the ISO

Before starting, make sure you have all the necessary files on the computer and not on a key in order to have better stability when using the files.

### Start Cubic
You need to start Cubic, then :
* select a folder that will contain your future iso 
* Give the Ubuntu 20.04 iso.
* Change the name of the future iso for InterAACtionBox

### Install all files
After a few seconds, you enter on the iso in command line.<br>
Now do a ``` cd ~/ ``` in the terminal.<br>
Now copy the script "install.sh" in the iso with Cubic using the button at the top left<br>
Execute the script to install all the files needed for the iso. ``` sh install.sh ```<br>
After a few minutes, normally you have finished the installation, and you can click in the green button "Next" at the top right

### Generate the ISO
At this step, all you have to do is click continuously on the Next button until you reach the moment of creating the iso.<br>
Congratulations your iso has been created in the folder chosen at the beginning !

### Use the ISO
To use the iso, that we created, you have to burn the iso on an usb key.<br>
For this, we use BalenaEtcher -> https://www.balena.io/etcher/ <br>
This application work on Windows and Linux.

### Burn the ISO
Before using BalenaEtcher, make sure you have started it as an administrator.<br>
Now, select the iso you have created recently then the usb key you want to use.<br>
Be careful !!!, the usb key you are going to use will have this data deleted because the key will be reformatted !!!<br>
If you ever later want to use the key for something else, just reformat it to FAT-32 (basic formatting).<br>
After several minutes, if all went well, BalenaEtcher must tell you that the burn was successful !<br>
Congratulation, you can now use this key to install the iso.

## 3) Materials

### Libs

Contains the .deb files needed for the execution of the main script.

### ISOScripts and Script

Contains the main script needed to update the ubuntu 20.04 ISO file (for now using Cubic) with our project

### Ressources and slides

Some useful resources for customize our ISO

### InterAACtionBox Interface Linux

Contains th files needed for the execution of our interface for InterAACtionBox

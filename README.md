# InterAACtionBox
## The first open source integrated device allowing Alternative and Augmented Communication for all

This repo contains the Materials used to build and generate a custom ISO file for the InterAACtionBox device using Cubic. 

## 0) Selected Hardware for the project
Dell Inspiron 14 5000 2-in-1
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
Download "ubuntu-20.04.3-desktop-amd64.iso" on https://releases.ubuntu.com/20.04/

### Download script
You need to download the script called ``` install.sh ``` of this repository.<br>
You can also find it here -> https://github.com/AFSR/InterAACtionBox/releases

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

Before starting, make sure you have :
* All the necessary files on the computer and not on a key in order to have better stability when using the files
* Create a folder with the name of your choice. This folder will contain the iso you are going to create 

### Start Cubic
You need to start Cubic, then :
* Select the folder you created especially for the ISO
* Give the Ubuntu 20.04.03 iso

### Have interAACtionBox as name for the iso
You need to change some lines :
* <b>Version</b> -> Put the version of your choice. <br> 
  In our case, it will be a date : "2022.01.13".
* <b>Filename</b> -> The name of the generated iso. <br> 
  In our case, it will be : "interAACtionBox-2022.01.13-LTS.iso" (2022.01.13 correspond to the actuel value of Version)
* <b>Directory</b> -> Generated automatically, we don't need to touch it
* <b>VolumeID</b> -> The name of the volumeID. <br> 
  In our case, it will be : "InterAACtionBox 2022.01.13 LTS" (2022.01.13 correspond to the actuel value of Version)
* <b>Release</b> -> The release name of our iso. <br>
  In our case, it will be : "InterAACtionBox"
* <b>Disk name</b> -> The disk name of our iso. <br> 
  In our case, it will be : "InterAACtionBox 2022.01.13 LTS 'InterAACtionBox' "
* <b>Release Url</b> -> The url of our release. <br>
  Leave as it is
* <b>OS Release</b> -> Leave the button checked.

### Install all files
After a few seconds, you enter on the iso in command line.<br>
Now do a ``` cd ~/ ``` in the terminal. (Just to make sure you're in the right place) <br>
Now copy the script ``` install.sh ``` in the iso with Cubic using the clipboard button at the top left. <br>
Once the script is in cubic, click on the green button "copy" at the top right. <br>
Now execute the script ``` install.sh ``` to install all the files needed for the iso with this command : ``` sh install.sh ``` <br>
After a few minutes, normally you have finished the installation, and you can click on the green button "Next" at the top right.

### Set French language to default
At this step, all you have to do is click continuously on the Next button until you reach the page who contains three tabs : "Kernel, Preseed and Boot". <br>
Click on the Preseed tab, then click on the file called "ubuntu.seed". <br>
Now copy and paste the code written below at the end of the file. <br>
```
#Set language, country and locale.
d-i debian-installer/language string fr
d-i debian-installer/country string FR
d-i debian-installer/local string fr_FR.UTF-8
```
After that, you can click on the green button "Next" at the top right to continue to generate the iso.

### Generate the ISO
At this step, all you have to do is click continuously on the Next button until you reach the moment of creating the iso.<br>
Congratulations your iso has been created in the folder chosen at the beginning ! <br>
You can also for security test the integrity of your iso :
* With the "Test" button in Cubic. <br>
  This button allows you to test the iso in a virtual box made by Cubic. <br>
  This test only checks the iso files to see if there is an error. <br>
  If your Iso do not contain error, he will display : "no error found !".
* Or with this command in the directory where your iso is located -> ``` md5sum --check yourIsoName.md5  ```<br>
Example :<br>
``` md5sum --check ubuntu-20.04.3-desktop-amd64.md5 ``` <br>
And the answer : <br>
``` ubuntu-20.04.3-desktop-amd64.iso: OK ``` <br>
In this example, the iso is fine !

### Use the ISO
To use the iso, that we created, you have to burn the iso on an usb key.<br>
For this, we use BalenaEtcher -> https://www.balena.io/etcher/ <br>
This application work on Windows and Linux.

### Burn the ISO
Before using BalenaEtcher, make sure you have started it as an administrator. ``` sudo ./balenaEtcher ```<br>
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

#!/bin/bash
# -- WARNING -- This is an example file. Change this according to your needs.

#This is where you put the directory of your JS files.
files_root_directory="..";
linker_files=(
    #Libraries
    "libraries/p5.js"
    #Kernel
    "kernel/octane.js"
    "kernel/graphite.js"
    "kernel/tools.js"
    #Game
    "desktop/jtk.js"
    "game/sotf.js"
)

# The name of the HTML file you want
file_output_name="index.html"
# Title of the website
website_title="Survival of the Fittest"
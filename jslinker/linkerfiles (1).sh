#!/bin/bash
# -- This is an example file. Use this as a template for your config file.

#This is where you put the directory of your JS files.
files_root_directory="/home/user/projects/js-program/";

# These are the files you want to merge together
linker_files=(
    #Libraries
    "libraries/library.js"
    #App
    "app/users.js"
    "feelings/happy.js"
    "feelings/sad.js"
    "app/appy.js"
    #Desktop
    "desktop/shell.js"
    "desktop/window-manager.js"
    #Game
    "game/player.js"
    "game/game.js"
)
# The end result HTML file will be a combination of all of these files in the order they are specified.

# The name of the HTML file you want
file_output_name="index.html"
# Title of the website
website_title="Example Title"
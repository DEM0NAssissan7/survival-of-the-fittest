#!/bin/bash

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

file_output_name="sotf.html"
website_title="Survival of the Fittest"
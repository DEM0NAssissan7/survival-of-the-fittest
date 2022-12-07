#!/bin/bash

# Use specified config file, otherwise return error and exit
if [[ $1 ]]; then 
    linker_config=$1;
else
    echo No config file was specified to the program.
    echo Syntax: ./jslinker.sh my_config_file.sh
    echo Exiting.
    exit
fi

# Make sure the config file exists.
if [ -e $linker_config ]; then
    source $linker_config
else
    echo Invalid config file name. Exiting.
    exit
fi

#Check to make sure all variables are specified
error_message_append="not specified. Exiting."
if [[ ! $files_root_directory ]]; then
    echo Directory $error_message_append.
    exit
fi
if [[ ! $linker_files ]]; then
    echo Linker files $error_message_append.
    exit
fi
if [[ ! $file_output_name ]]; then
    echo HTML name $error_message_append.
    exit
fi
if [[ ! $website_title ]]; then
    echo Website title $error_message_append.
    exit
fi

#Check if the files root directory exists
if [ ! -e "$files_root_directory" ]; then
    echo The files root directory does not exist. Exiting.
    exit
fi


execution_root_directory=`pwd`
cd "$files_root_directory"

cat "$execution_root_directory/templates/template-1.html" > $file_output_name

#Website title
echo >> $file_output_name
echo Setting website name to $website_title
echo $website_title >> $file_output_name
echo
echo >> $file_output_name

cat "$execution_root_directory/templates/template-2.html" >> $file_output_name

#Javascript code
echo >> $file_output_name
for js_file in "${linker_files[@]}"; do
    if [ ! -e "$js_file" ]; then
        echo The file `pwd`/$js_file does not exist. Exiting.
        rm $file_output_name
        exit
    fi
    echo Linking $js_file;
    cat "$js_file" >> $file_output_name
done
echo >> $file_output_name
cat "$execution_root_directory/templates/template-3.html" >> $file_output_name
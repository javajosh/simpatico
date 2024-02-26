#!/bin/bash
set -e

# Included purely for fun - a simplified blog entry creator done in bash

# Define parameters - todo support command line override
authorName='Josh'
authorLocation='the East Coast of USA'
directoryPath='.'
preferredEditor=''
currentDate=$(date +"%m-%d-%Y")
noteTitle="# ${authorName} from ${authorLocation} on ${currentDate}\n\n"
NOTE_FILE_PATTERN="^([0-9]*)(?:-(?:.*))?\.md$" #capture the number prefix, ignore stub after optional dash

peek() {
    local arr=("$@")
    local fallback=$1
    if [[ ${#arr[@]} -gt 0 ]]; then
        echo "${arr[${#arr[@]}-1]}"
    else
        echo "$fallback"
    fi
}

getMaxValue() {
    local max=$1
    local num=$2
    if [[ $num -gt $max ]]; then
        echo $num
    else
        echo $max
    fi
}

extractNoteNumber() {
    local filename=$1
    local notePattern=$2
    local result=$(echo "$filename" | grep -oE "$notePattern" | cut -d'-' -f1)
    echo ${result:-0}
}

findGreatestNoteNumber() {
    local fileNames=("$@")
    local notePattern=$1
    local greatestNoteNumber=0

    for nn in "${fileNames[@]}"; do
        local noteNumber=$(extractNoteNumber "$nn" "$notePattern")
        greatestNoteNumber=$(getMaxValue $greatestNoteNumber $noteNumber)
    done

    echo $((greatestNoteNumber + 1))
}

fileNames=($(ls "$directoryPath"))
noteId=$(findGreatestNoteNumber "${fileNames[@]}" "$NOTE_FILE_PATTERN")
fileName="${noteId}.md"
echo -e "${noteTitle}" > "${directoryPath}/${fileName}"
if [[ -n $preferredEditor ]]; then
    $preferredEditor "${directoryPath}/${fileName}"
fi

echo "created ${fileName}"

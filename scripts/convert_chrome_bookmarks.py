"""
This script is meant for converting exported Chrome bookmarks to TextData submissions.
Once the script is ran, the output file can be uploaded as a batch submission on TextData.

Instructions
1. Export chrome bookmarks (see https://support.google.com/chrome/answer/96816?hl=en, under "Move or export bookmarks to another browser")
2. Move the file to this directory, and rename to chrome.html
3. Run this script (will create textdata_batch_<folder name>.json)
4. Navigate to textdata.org, click the "+" button in the header, and select batch upload
5. Choose textdata_batch_<folder_name>.json, select the desired community, and click Submit

    Note that this uploading process may take a few minutes depending on the number of bookmarks
    because TextData attempts to scrape each webpage.

    You can repeat this process for each folder_name, selecting the respective community to which you'd like to upload the bookmarks.

6. Once finished, all of your bookmarks will be available in TextData!
"""

import json

def find_target_idx(line, char, start_idx, step):
    target_idx = start_idx
    iters = 0
    while line[target_idx] != char:
        iters += 1
        target_idx += step
        if iters == 10000:
            print("Something has gone wrong, unexpected file format")
            exit()
    # will be off by one if going left to right
    if step > 0:
        return target_idx
    else:
        return target_idx - step


with open("chrome.html") as f:
    all_bookmarks = {}
    current_folder_name = ""
    for line in f:
        line = line.strip()
        # found a new folder
        if "<DT><H3 ADD_DATE=" in line:
            fn_end_idx = -5
            fn_start_idx = find_target_idx(line, ">", -6, -1)
            current_folder_name = line[fn_start_idx:fn_end_idx]
            all_bookmarks[current_folder_name] = []
        # found a new bookmark URL/name
        if "<DT><A HREF=" in line:
            url_start_idx = 13
            url_end_idx = find_target_idx(line, '"', 14, 1)
            url = line[url_start_idx:url_end_idx]

            bmn_end_idx = -4
            bmn_start_idx = find_target_idx(line, ">", -6, -1)
            bookmark_name = line[bmn_start_idx:bmn_end_idx]

            all_bookmarks[current_folder_name].append({"source_url": url, "title": bookmark_name, "description": ""})

for folder in all_bookmarks:
    json.dump({"data": all_bookmarks[folder]}, open("textdata_batch_"+ folder + ".json", "w"))



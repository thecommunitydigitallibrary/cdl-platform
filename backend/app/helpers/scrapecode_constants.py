CONNECTION_READ_TIMEOUT = 1
RESPONSE_TIMEOUT = 3
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36",
}

# Status codes and Code to Message map
CODE_SCRAPE_ALREADY_ATTEMPTED = -1
CODE_SUCCESS = 1
CODE_INVALID_FILE_ENDING_FOR_URL = 2
CODE_TIMEOUT = 3
CODE_INVALID_STATUS_CODE = 4
CODE_UNABLE_TO_PARSE = 5
CODE_URL_NAME_TOO_LONG = 6
CODE_URL_NOT_PUBLICILY_ACCESSIBLE = 7

SCRAPECODE_TO_MESSAGE_MAP = {
    CODE_SCRAPE_ALREADY_ATTEMPTED: "Scrape has already been attempted for the given URL",
    CODE_SUCCESS: "Scrape is successful",
    CODE_INVALID_FILE_ENDING_FOR_URL: "Invalid file ending for the given URL",
    CODE_TIMEOUT: "Scrape request has timed out",
    CODE_INVALID_STATUS_CODE: "Scrape response returned an invalid status code",
    CODE_UNABLE_TO_PARSE: "Unable to parse the given URL",
    CODE_URL_NAME_TOO_LONG: "The given URL name is too long to store",
    CODE_URL_NOT_PUBLICILY_ACCESSIBLE: "The given URL is not publicly accessible",
}

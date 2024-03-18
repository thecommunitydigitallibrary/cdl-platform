# Scraper Constants
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

# Visualize Map Constants
RE_URL_DESC = "\[[a-zA-Z0-9 ]+\]\((.*?)\)"
RE_LECTURE_TAG = "[#][\w]*[\d.\d]*[,]*[1-9]*[.\d]*"
RE_LECTURE_WITHOUT_TAG = "[Ll][\w ]*[1-9][\d.\d]*[,]*[1-9]*[.\d]*"
RE_LECTURE_NUM = "[1-9][\d.]*\d*"
TOP_N_SUBMISSIONS = 5
TOP_N_HASHTAGS = 15
META_DESCRIPTOR = {
    "Description": ["describe", "overview", "explanation", "introduce", "discuss", "explain", "introduction", "description"],
    "Comparison": ["difference", "comparison", "vs", "versus", "between"],
    "Articles/Papers": ["paper", "conference", "research", "survey", "reading", "article"],
    "Examples": ["examples", "applications", "exemplar", "instance", "case study", "application"],
    "Intuition": ["intuitive", "understanding"],
    "Tutorial": ["tutorial", "class", "lesson", "demo", "demonstration", "guide", "implementation"],
    "Theory": ["theorem", "proof", "theory"],
    "Videos": ["video"],
    "Miscellaneous" : ["miscellaneous"]
}
KEYWORDS_IGNORE = ["related", "gives", "towards", "deep", ]
import re
import json
import requests
import time
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import os
from urllib.parse import urljoin
from app.helpers.scrapecode_constants import CODE_SCRAPE_ALREADY_ATTEMPTED, CODE_SUCCESS, CODE_INVALID_FILE_ENDING_FOR_URL, CODE_TIMEOUT, CODE_INVALID_STATUS_CODE, CODE_UNABLE_TO_PARSE, CODE_URL_NAME_TOO_LONG, CODE_URL_NOT_PUBLICILY_ACCESSIBLE, CONNECTION_READ_TIMEOUT, RESPONSE_TIMEOUT, HEADERS, SCRAPECODE_TO_MESSAGE_MAP
import sys

from app.models.webpages import Webpages


class ScrapeWorker:
    start_time = None
    end_time = None

    def trace_function(self, frame, event, arg):
        if time.time() - self.start_time > RESPONSE_TIMEOUT:
            raise Exception(CODE_TIMEOUT)
        return self.trace_function

    def scrape(self, url) -> dict:
        """

        returns: {
            url,
            scrape_initiation_time,
            scrape_status {
                code,
                message,
                resp_status_code
            }
            webpage {
                metadata
                paragraphs
                outgoing_urls
            }
            scrape_time
        }
        """
        data = {"url": url, "scrape_initiation_time": time.time()}

        url, url_path = self.format_url_to_path(url)

        if len(url_path) > 255:
            data["scrape_status"] = {
                "code": CODE_URL_NAME_TOO_LONG, "message": SCRAPECODE_TO_MESSAGE_MAP[CODE_URL_NAME_TOO_LONG]}
            return data

        if url.split(".")[-1] in ["bz2", "zip", "csv", "sqlite3", "exe", "mp3", "mp4", "pdf", "gz", "png", "jpg"]:
            data["scrape_status"] = {"code": CODE_INVALID_FILE_ENDING_FOR_URL,
                                     "message": SCRAPECODE_TO_MESSAGE_MAP[CODE_INVALID_FILE_ENDING_FOR_URL]}
            return data

        self.start_time = time.time()
        sys.settrace(self.trace_function)
        try:
            resp = requests.get(
                url, timeout=CONNECTION_READ_TIMEOUT, headers=HEADERS)
            self.end_time = time.time()
        except:
            data["scrape_status"] = {
                "code": CODE_TIMEOUT, "message": SCRAPECODE_TO_MESSAGE_MAP[CODE_TIMEOUT]}
            return data
        finally:
            sys.settrace(None)

        # print("\t Page acquired")

        # For the case where the response code is Unauthorized, Forbidden, Method Not Allowed, Not Acceptable or Proxy Authentication Required
        if resp.status_code in [401, 403, 405, 406, 407]:
            data["scrape_status"] = {
                "code": CODE_URL_NOT_PUBLICILY_ACCESSIBLE, "message": SCRAPECODE_TO_MESSAGE_MAP[CODE_URL_NOT_PUBLICILY_ACCESSIBLE], "resp_status_code": resp.status_code
            }
            return data

        # If response code is anything but 200, assign the appropriate status code and return JSON object
        if resp.status_code != 200:
            data["scrape_status"] = {
                "code": CODE_INVALID_STATUS_CODE, "message": SCRAPECODE_TO_MESSAGE_MAP[CODE_INVALID_STATUS_CODE], "resp_status_code": resp.status_code}
            return data

        if resp.status_code == 200:
            try:
                len_text = len(resp.text)
                print("\tLen of text: ", len_text)
                if len_text > 9731000:  # 50000000:
                    raise Exception("too long!")
                metadata, paragraphs, outgoing_urls = self.parse_html(
                    resp.text, url)
            except Exception as e:
                print(e)
                data["scrape_status"] = {"code": CODE_UNABLE_TO_PARSE,
                                         "message": SCRAPECODE_TO_MESSAGE_MAP[CODE_UNABLE_TO_PARSE]}
                return data

        # Add the metadata, paragraphs and all the outgoing URLs to the `data` JSON
        data["webpage"] = {"metadata": metadata,
                           "paragraphs": paragraphs,
                           "outgoing_urls": outgoing_urls}
        data["scrape_status"] = {"code": CODE_SUCCESS,
                                 "message": SCRAPECODE_TO_MESSAGE_MAP[CODE_SUCCESS],
                                 "resp_status_code": resp.status_code}
        all_outgoing = [x["url"] for x in outgoing_urls]

        # Add the amount of time taken for scraping the webpage
        data["scrape_time"] = None
        if self.start_time is not None and self.end_time is not None:
            data["scrape_time"] = self.end_time - self.start_time

        return data

    def parse_html(self, html, page_url) -> tuple:
        html_no_script = re.sub(r"<script.*?</script>", "", str(html))
        metadata = {}
        all_paragraphs_text = []
        all_outgoing_urls = []

        if html_no_script:
            soup = BeautifulSoup(html_no_script, 'html.parser')
            title = ""
            h1 = ""
            description = ""

            # for title
            if soup.title and soup.title.text:
                title = soup.title.text
            if soup.h1 and soup.h1.text:
                h1 = soup.h1.text

            # for description
            meta = soup.find("meta", attrs={"name": "description"})
            if meta and meta.has_attr("content"):
                description = meta["content"]
            if not description:
                first_h1 = soup.find("h1")
                if first_h1:
                    first_p = first_h1.find_next("p")
                    if first_p and first_p.string:
                        description = first_p.text
            if not description:
                first_p = soup.find("p")
                if first_p and first_p.string:
                    description = first_p.string

            metadata = {
                "title": self.clean_text(title),
                "h1": self.clean_text(h1),
                "description": self.clean_text(description)
            }

            all_paragraphs = soup.find_all("p")
            all_urls = soup.find_all("a")

            for outgoing_url in all_urls:
                hyperlink_url = outgoing_url.get("href", "")

                isValidURL, hyperlink_url = self.test_fix_relative_url(
                    hyperlink_url, page_url)

                hyperlink_text = self.clean_text(outgoing_url.text)
                if isValidURL:
                    all_outgoing_urls.append({
                        "url": hyperlink_url,
                        "anchor_text": hyperlink_text,
                        "paragraph_index": -1
                    })

            j = 0
            for paragraph in all_paragraphs:
                paragraph_text = self.clean_text(paragraph.text)
                if self.measure_string_quality(paragraph_text):
                    all_paragraphs_text.append(paragraph.text)
                    all_hyperlinks = paragraph.find_all("a")
                    for h in all_hyperlinks:
                        hyperlink_text = self.clean_text(h.text)
                        hyperlink_url = h.get("href", "")

                        isValidURL, hyperlink_url = self.test_fix_relative_url(
                            hyperlink_url, page_url)
                        if isValidURL:
                            all_outgoing_urls.append({
                                "url": hyperlink_url,
                                "anchor_text": hyperlink_text,
                                "paragraph_index": j
                            })
                    j += 1

        return metadata, all_paragraphs_text, all_outgoing_urls

    def clean_text(self, text) -> str:
        if not text or len(text) == 0:
            return ""
        text = text.replace("\\r\\n", " ")
        text = text.replace("\\n", " ")
        text = text.replace("\\t", " ")
        text = " ".join(text.split())
        return text

    def test_fix_relative_url(self, url, base_url):
        if len(url) == 0:
            return False, url
        elif url[0] == "#":
            return False, url
        elif url[0] == "/":
            url = urljoin(base_url, url)
            return True, url
        if url[:4] != "http":
            return False, url
        else:
            return True, url

    def measure_string_quality(self, string, type="paragraph") -> bool:
        if not string:
            return False
        num_words = len(string.split(" "))
        num_sentences = len(string.split(". "))

        letter_ratio = len(re.sub("[^a-z ]", "", string.lower())) / \
            max(len(re.sub("[a-z ]", "", string.lower())), 1)
        avg_word_length = sum([len(x) for x in string.split(" ")]) / num_words

        if type == "paragraph":
            if avg_word_length < 10 and letter_ratio > 5 and num_words > 5 and num_sentences >= 1:
                return True
            else:
                return False
        if type == "title":
            if avg_word_length < 10 and letter_ratio > 10 and num_words > 3 and num_words < 50:
                return True
            else:
                return False

    def remove_links(self, anchor):
        if not anchor:
            return

        replacements = [
            r'\S+\.\w{2,3}\/\S+',
            r'\S+\.[a-z]{2,3}\s'
        ]

        return re.sub("|".join(replacements), " ", anchor)

    def remove_long_words(self, word):
        if not word:
            return
        return re.sub(r'\w{20,}[^\.]', '', word)

    def measure_anchor_quality(self, anchor):
        if not anchor:
            return False
        return len(anchor) >= 5

    def format_url_to_path(self, url) -> str:
        # for webarchive, get actual url
        if "://web.archive.org/web/" in url:
            url = url.split("://web.archive.org/web/")[1]
            url = "http" + "".join(url.split("http")[1:])

        parsed_url = urlparse(url)

        # remove www if present
        new_netloc = parsed_url.netloc
        if new_netloc[:4] == "www.":
            new_netloc = new_netloc[4:]

        full_path = new_netloc + parsed_url.path

        # for youtube only, add the query in the path
        if "youtube" in parsed_url.netloc or "youtu" in parsed_url.netloc:
            full_path = full_path + parsed_url.query
        # otherwise, remove query from url
        else:
            if "?" in url:
                url = url.split("?")[0]

        # always remove fragment from query
        if "#" in url:
            url = url.split("#")[0]
        if len(full_path) == 0:
            return url, ""
        if full_path[-1] != "/":
            full_path += "/"

        return url, full_path
    
    def is_scraped_before(self, source_url):
        webpages = Webpages()
        webpage = webpages.find({"url": source_url})
        
        return True if webpage else False
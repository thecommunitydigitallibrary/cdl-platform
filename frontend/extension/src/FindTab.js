/*global chrome*/

import React, { useEffect } from "react";
import SearchResult from "./searchresult";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import axios from "axios";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from "@mui/material";
import SearchBar from "./SearchBar";

let show_relevant = false;

export default function FindTab() {
  const [comparisonResults, setComparisonResults] = React.useState(false);


  const [comparisonSpinner, setComparisonSpinner] = React.useState(false);
  const [generationSpinner, setGenerationSpinner] = React.useState(false);


  const baseURL = localStorage.getItem('backendSource') + "api/";
  const searchEndpoint = baseURL + "search/extension"

  const [text, setText] = React.useState("");
  const [searchResults, setSearchResults] = React.useState();
  const [question, setQuestion] = React.useState();
  const [searchStart, setSearchStart] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [highlightedText, setHighlightedText] = React.useState();
  const [isUserQueried, setUserQueried] = React.useState(false);

  const [alsoAsked, setAlsoAsked] = React.useState([]);

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("");



  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  
  let getQueryText = () => {
    // This function concatenates and returns highlighted text with website description and title.
    let query = "";

    // Highlighted Text
    let selection = getSelection().toString();
    if (selection !== undefined) {
      query += selection;
      if (query) {
        return query
      }
    }

    // Description
    let metas = document.getElementsByTagName('meta');
    for (let i in metas) {
      if (typeof (metas[i].name) != 'undefined' && metas[i].name.toLowerCase().includes("description")) {
        query += " " + metas[i].content;
        break;
      }
    }
    // Title
    query += " " + document.querySelector('title').innerHTML;


    return query;
  }

  let getSearchSelectionText = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      var url = tabs[0].url;
      window.source_url = url;
      setUrl(url);
      var hasHttp = url.includes("http") || url.includes("https");
      if (!hasHttp) {
        setSeverity("info");
        setMessage("The extension may not work on this URL.");
        handleClick();
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: () => getQueryText(),
        },
        (result) => {
          if (result === undefined || !result[0].result) {
            return;
          } else {
            setHighlightedText(result[0].result)
            setUrl(url);
            search("", result[0].result, url);
          }
        });
    });
  };

  let search = async (query, highlighted_text, url) => {
    setSearchStart(true);
    setUserQueried(true);
    try {
      var config = {
        method: "get",
        url:
          searchEndpoint +
          "?partial_intent=" +
          encodeURIComponent(query) +
          "&highlighted_text=" +
          encodeURIComponent(highlighted_text) +
          "&url=" +
          encodeURIComponent(url),
        headers: {
          Authorization: localStorage.getItem("authToken"),
        },
      };

      let searchResult = await axios(config);
      setSearchResults(searchResult.data.web_results);
      setQuestion(searchResult.data.predicted_intent)
      setSearchStart(false);
      setAlsoAsked(searchResult.data.users_also_ask)

    } catch (error) {
      setSeverity("error");
      setMessage("Error handling your search request.");
      handleClick();
      return;
    }
  };

  useEffect(() => {
    getSearchSelectionText();
  }, []);

  const onSearch = (query) => {
    setText(query.searchText);
    search(query.searchText, highlightedText, url);
  }

  const setTextChanged = (data) => {
    setText(data);
  }
  
  return (
    <div>
      <SearchBar
        onSearch={onSearch}
        searchBarTextChanged={setTextChanged}
      ></SearchBar>
      <p>{question}</p>
      {!searchStart && searchResults && (
        <div>
          {searchResults.length == 0 && (
            <p style={{ textAlign: "left" }}>No results found.</p>
          )}
        </div>
      )}
      {searchStart && (
        <CircularProgress style={{ marginTop: "70px" }} color="success" />
      )}
      {!searchStart && (
        <Box style={{ bgcolor: "background.paper" }}>
          {searchResults &&
            searchResults.map((d, idx) => (
              <div key={idx} style={{ width: "100%", textAlign: "left" }}>
                <SearchResult
                  search_idx={idx}
                  redirect_url={d.redirect_url}
                  display_url={d.display_url}
                  submission_id={d.submission_id}
                  result_hash={d.result_hash}
                  description={d.description}
                  title={d.title}
                  hashtags={d.hashtags}
                  communities_part_of={d.communities_part_of}
                  auth_token={localStorage.getItem("authToken")}
                  show_relevant={show_relevant}
                />
              </div>
            ))
          }
          {alsoAsked.length > 0 && <p style={{ width: "100%", textAlign: "left" }}>People also asked:</p>}
          {alsoAsked &&
              alsoAsked.map((d, idx) => (
                <div style={{ width: "100%", textAlign: "left" }}>
                  <Button style={{textAlign: "left"}} onClick={()=>search(d, highlightedText, url)}>{d}</Button>
                </div>
              ))
          }
          
        </Box>
      )}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>

    </div>
  );
}

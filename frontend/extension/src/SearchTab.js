/*global chrome*/

import React, { useEffect } from "react";
import SearchResult from "./searchresult";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import axios from "axios";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import {FormControl, MenuItem, Select } from "@mui/material";

let show_relevant = true;

export default function Search() {
  const [currentPageResults, setCurrentPageResults] = React.useState([]);
  const [currentPageResultSpinner, setCurrentPageResultSpinner] = React.useState(false);
  const baseURL = localStorage.getItem('backendSource') + "api/";

  const [text, setText] = React.useState("");
  const [searchResults, setSearchResults] = React.useState();
  const [searchStart, setSearchStart] = React.useState(false);
  const [url, setUrl] = React.useState();
  const [highlightedText, setHighlightedText] = React.useState();
  const [isUserQueried, setUserQueried] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("");
  const [allCommunities, setAllCommunities] = React.useState([]);


  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  let getCurrentPageSubmissions = async (current_url, current_ht) => {
    setCurrentPageResultSpinner(true);
    try {
      var config = {
        method: "get",
        url:
          baseURL +
          "search?query=&highlighted_text=" +
          encodeURIComponent(current_ht) +
          "&url=" +
          encodeURIComponent(current_url) +
          "&source=extension_open&page=0&community=all",
        headers: {
          Authorization: localStorage.getItem("authToken"),
        },
      };
      let searchResult = await axios(config);
      setCurrentPageResults(searchResult.data.search_results_page);
      setCurrentPageResultSpinner(false);
    } catch (error) {
      setCurrentPageResultSpinner(false);
      console.log(error);
    }
  };
  
  let getQueryText = () => {
    // This function concatenates and returns highlighted text with website description and title.
    let query = "";

    // Highlighted Text
    let selection = getSelection().toString();
    if (selection !== undefined) {
      query += selection;
      if(query){
        return query
      }
    }

    // Description
    let metas = document.getElementsByTagName('meta');
      for(let i in metas) {
        if (typeof(metas[i].name) != 'undefined' && metas[i].name.toLowerCase().includes("description")) {
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
            setHighlightedText("");
            getCurrentPageSubmissions(url, "");
          } else {
            setHighlightedText(result[0].result);
            setUrl(url);
            getCurrentPageSubmissions(url, result[0].result);
          }
        });
      });
  };

  let search = async (e) => {
    setSearchStart(true);
    setUserQueried(true);
    var hasHttp = url.includes("http") || url.includes("https");
    if (!hasHttp) {
      setUrl("");
    }
    e.preventDefault();
    try {
      var config = {
        method: "get",
        url:
          baseURL +
          "search?query=" +
          encodeURIComponent(text) +
          "&highlighted_text=" +
          encodeURIComponent(highlightedText) +
          "&url=" +
          encodeURIComponent(url) +
          "&source=extension_search&page=0&community="+ e.target.community.value,
        headers: {
          Authorization: localStorage.getItem("authToken"),
        },
      };

      let searchResult = await axios(config);
      setSearchResults(searchResult.data.search_results_page);
      setSearchStart(false);

    } catch (error) {
      setSeverity("error");
      setMessage("Error handling your search request.");
      handleClick();
      return;
    }
  };

  let getCommunities = async () => {
    try {
      var config = await fetch(baseURL + "getCommunities", {
        method: "get",
        headers: {
          Authorization: localStorage.getItem("authToken"),
          "Content-Type": "application/json",
        },
      });

      let response = await config.json();
      if(response.status === "ok"){
        setAllCommunities(response.community_info);
      }else{
        setSeverity("error")
        setMessage(response.message);
        handleClick();
      }
    } catch (error) {
        setSeverity("error");
        setMessage("Unable to fetch your communities, Please try again.");
        handleClick();    
      }
  };

  useEffect(() => {
    getCommunities();
    getSearchSelectionText();
  }, []);

  const onChange = (e) => setText(e.target.value);

  
  return (
    <div>
      <form onSubmit={search} sx={{ mt: 1 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            sx={{ ml: 1, flex: 1 }}
            value={text}
            onChange={onChange}
            placeholder="Search your communities"
            id="margin-none"
            required
            InputProps={{endAdornment: 
              <IconButton type="submit" variant="contained" >
              <SearchIcon />
              </IconButton>}}
          />
          <FormControl style={{maxWidth: 100}}>
            <Select
                style={{ backgroundColor: "white" }}
                name="community"
                defaultValue={"all"}
            >
              <MenuItem value="all">All</MenuItem>
              {allCommunities.length > 0 &&
              allCommunities.map(function(community, idx) {
                return (
                <MenuItem
                  key={community.community_id}
                  value={community.community_id}
                >
                  {community.name}
                </MenuItem>);
              })}
            </Select>
          </FormControl>
        
        </Stack>
      </form>

      {!searchStart && searchResults && (
        <div>
          {searchResults.length !== 0 ? (
            <p style={{ textAlign: "left" }}>Search results displayed below:</p>
          ) : (
            <p style={{ textAlign: "left" }}>No results found within the selected community.</p>
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
                  highlighted_text={d.highlighted_text}
                  explanation={d.explanation}
                  hashtags = {d.hashtags}
                  communities_part_of={d.communities_part_of}
                  auth_token={localStorage.getItem("authToken")}
                  show_relevant={show_relevant}
                />
              </div>
            ))}
        </Box>
      )}

        {!isUserQueried && !currentPageResultSpinner && currentPageResults.length !== 0 && (
                <div style={{ textAlign: "left", width: "90%" }}>
                  <p>Related to the webpage and highlighted text:</p>
                </div>
        )}
        {!isUserQueried && currentPageResultSpinner && (
          <CircularProgress style={{ marginTop: "70px" }} color="success" />
        )}
        {!isUserQueried && !currentPageResultSpinner && (
          <Box style={{ bgcolor: "background.paper" }}>
            {currentPageResults.length !== 0 &&
              currentPageResults.map((d, idx) => (
                <div key={idx} style={{ width: "100%", textAlign: "left" }}>
                  <SearchResult
                    search_idx={idx}
                    redirect_url={d.redirect_url}
                    display_url={d.display_url}
                    submission_id={d.submission_id}
                    result_hash={d.result_hash}
                    highlighted_text={d.highlighted_text}
                    explanation={d.explanation}
                    hashtags = {d.hashtags}
                    communities_part_of={d.communities_part_of}
                    auth_token={localStorage.getItem("authToken")}
                    show_relevant={show_relevant}
                  />
                </div>
              ))}
            {currentPageResults.length === 0 && (
              <div>
                <p>No results found within the communities.</p>
              </div>
            )}
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
  
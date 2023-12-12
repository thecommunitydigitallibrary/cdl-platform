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

export default function FindTab() {
  const [comparisonResults, setComparisonResults] = React.useState(false);
  

  const [comparisonSpinner, setComparisonSpinner] = React.useState(false);
  const [generationSpinner, setGenerationSpinner] = React.useState(false);


  const baseURL = localStorage.getItem('backendSource') + "api/";

  const [text, setText] = React.useState("");
  const [searchResults, setSearchResults] = React.useState();
  const [searchStart, setSearchStart] = React.useState(false);
  const [url, setUrl] = React.useState();
  const [highlightedText, setHighlightedText] = React.useState();
  const [isUserQueried, setUserQueried] = React.useState(false);

  const [generationResults, setGenerationResults] = React.useState();

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("");
  const [allCommunities, setAllCommunities] = React.useState([]);


  const onQA = async () => {
    onGenerate("qa")
  }
  const onCQA = async () => {
    onGenerate("contextual_qa")
  }
  const onQG = async () => {
    onGenerate("gen_questions")
  }
  const onS = async () => {
    onGenerate("summarize")
  }
  
  


  const onGenerate = async (mode) => {
    setGenerationSpinner(true)
    if (mode == "qa" || mode == "contextual_qa") {
      if (text === undefined || text.length == 0) {
        setSeverity("error");
        setMessage("Search bar cannot be empty for this feature.");
        handleClick();
        return;
      }
    }
    
    //        "comparison": comparisonResults,

    let res = await fetch(baseURL + "generate", {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("authToken"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        "context": highlightedText,
        "query": text,
        "mode": mode
      }),
    });

    let response = await res.json();
    setGenerationSpinner(false)
    setGenerationResults(response.output)
    getComparison(url, response.output)
  };

  function editWebpage(response) {
    var response = response["annotated_paragraphs"]
    console.log(response)
    var bod = document.body.getElementsByTagName("p")
    for (let i=0; i < bod.length; i++) {
      if (i in response) {
        if (response[i]["indexed_cdl"]["results"].length > 0) {
          var html = '<div style="background-color: #FF0000;"><h4>CDL - Indexed by the CDL</h4>Keywords: ' + response[i]["indexed_cdl"]["keywords"].join(", ") + '<ul>'
          for (let k=0; k < response[i]["indexed_cdl"]["results"].length; k++) {
            var url = response[i]["indexed_cdl"]["results"][k]["url"]
            var title = response[i]["indexed_cdl"]["results"][k]["title"]
            html = html + '<li><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + title + "</a></li>"
          }
          html = html + "</ul></div>"
          bod[i].insertAdjacentHTML("afterend", html)
        }

        if (response[i]["submitted_community"]["results"].length > 0) {
          var html = '<div style="background-color: #FFEA00;"><h4>CDL - Submitted by Other Community Members</h4>Keywords: ' + response[i]["submitted_community"]["keywords"].join(", ") + '<ul>'
          for (let k=0; k < response[i]["submitted_community"]["results"].length; k++) {
            var url = response[i]["submitted_community"]["results"][k]["url"]
            var title = response[i]["submitted_community"]["results"][k]["title"]
            html = html + '<li><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + title + "</a></li>"
          }
          html = html + "</ul></div>"
          bod[i].insertAdjacentHTML("afterend", html)
        }

        if (response[i]["submitted_you"]["results"].length > 0) {
          var html = '<div style="background-color: #00FF00;"><h4>CDL - Submitted by You</h4>Keywords: ' + response[i]["submitted_you"]["keywords"].join(", ") + '<ul>'
          for (let k=0; k < response[i]["submitted_you"]["results"].length; k++) {
            var url = response[i]["submitted_you"]["results"][k]["url"]
            var title = response[i]["submitted_you"]["results"][k]["title"]
            html = html + '<li><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + title + "</a></li>"
          }
          html = html + "</ul></div>"
          bod[i].insertAdjacentHTML("afterend", html)
        }
      }
    }
  }

  const analyzeParagraphs = async (paragraphs) => {
    chrome.runtime.onMessage.removeListener(listener)
    let res = await fetch(baseURL + "annotate", {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("authToken"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        "paragraphs": paragraphs, 
        "url": url, 
        "highlighted_text": highlightedText 
      }),
    });

    let response = await res.json();
    

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: editWebpage,
        args: [response]
      });
    });
  }

  function annotate() {
    var bod = document.body.getElementsByTagName("p")
    var paragraphs = {}

    for (let i=0; i < bod.length; i++) {
      paragraphs[i] = bod[i].innerHTML
    }
    chrome.runtime.sendMessage({ paragraphs });
  }

  function listener(message, sender, sendResponse) {
    var paragraphs = message;
    analyzeParagraphs(paragraphs)
  }


  const onAnnotate = async () => {
    chrome.runtime.onMessage.addListener(listener)

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: annotate,
      });
    });

  };



  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  let getComparison = async (current_url, current_ht) => {
    setComparisonSpinner(true);
    try {

      let res = await fetch(baseURL + "compare", {
        method: "POST",
        headers: {
          Authorization: localStorage.getItem("authToken"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          "url": current_url, 
          "highlighted_text": current_ht 
        }),
      });
  
      let response = await res.json();

      setComparisonResults(response.analyzed_ht);
      setComparisonSpinner(false);
    } catch (error) {
      setComparisonSpinner(false);
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
            getComparison(url, "");
          } else {
            setHighlightedText(result[0].result);
            setUrl(url);
            getComparison(url, result[0].result);
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

        {!isUserQueried && highlightedText && (
                <div style={{ textAlign: "left", width: "90%" }}>
                  <p>{highlightedText.substring(0,100)}...</p>
                </div>
        )}

        {!isUserQueried && comparisonResults && (
            <div>
              <Button variant="contained" style={{padding: 14, width: "22%", marginRight: "5px"}} onClick={onQA}>
                  Ask a Question
              </Button>
              <Button variant="contained" style={{padding: 14, width: "22%", marginRight: "5px"}} onClick={onCQA}>
                  Ask in Context
              </Button>
              <Button variant="contained" style={{padding: 14, width: "22%", marginRight: "5px"}} onClick={onQG}>
                  Generate Questions
              </Button>
              <Button variant="contained" style={{padding: 14, width: "22%", marginRight: "5px"}} onClick={onS}>
                  Summarize Selection
              </Button>
            </div>
        )}


        {!isUserQueried && !generationSpinner && generationResults && (
            <div style={{ textAlign: "left", width: "90%" }}>
              <p>{generationResults}</p>
            </div>
        )}

        {!isUserQueried && generationSpinner && (
          <CircularProgress style={{ marginTop: "70px" }} color="success" />
        )}

        {!isUserQueried && comparisonSpinner && (
          <CircularProgress style={{ marginTop: "70px" }} color="success" />
        )}
        {!isUserQueried && !comparisonSpinner && comparisonResults && (
          
          <Box style={{ bgcolor: "background.paper" }}>
            <div>
            {comparisonResults.submitted_you.results.length !== 0 && (<div><h4>Submitted by You</h4><p>Keywords: {comparisonResults.submitted_you.keywords}</p></div>)}
            {comparisonResults.submitted_you.results.length !== 0 && (
              comparisonResults.submitted_you.results.map((d, idx) => (
                <div key={idx} style={{ width: "100%", textAlign: "left" }}>
                  <SearchResult
                    search_idx={idx}
                    redirect_url={d.redirect_url}
                    display_url={d.display_url}
                    submission_id={d.submission_id}
                    result_hash={d.result_hash}
                    highlighted_text={d.highlighted_text}
                    explanation={d.explanation}
                    hashtags={d.hashtags}
                    communities_part_of={d.communities_part_of}
                    auth_token={localStorage.getItem("authToken")}
                    show_relevant={show_relevant}
                  />
                </div>
              )))}

            {comparisonResults.submitted_community.results.length !== 0 && (<div><h4>Submitted by Other Community Members</h4><p>Keywords: {comparisonResults.submitted_community.keywords}</p></div>)}
            {comparisonResults.submitted_community.results.length !== 0 && (
              comparisonResults.submitted_community.results.map((d, idx) => (
                <div key={idx} style={{ width: "100%", textAlign: "left" }}>
                  <SearchResult
                    search_idx={idx}
                    redirect_url={d.redirect_url}
                    display_url={d.display_url}
                    submission_id={d.submission_id}
                    result_hash={d.result_hash}
                    highlighted_text={d.highlighted_text}
                    explanation={d.explanation}
                    hashtags={d.hashtags}
                    communities_part_of={d.communities_part_of}
                    auth_token={localStorage.getItem("authToken")}
                    show_relevant={show_relevant}
                  />
                </div>
              )))}

            {comparisonResults.indexed_cdl.results.length !== 0 && (<div><h4>Indexed by the CDL</h4><p>Keywords: {comparisonResults.indexed_cdl.keywords}</p></div>)}
            {comparisonResults.indexed_cdl.results.length !== 0 && (
              comparisonResults.indexed_cdl.results.map((d, idx) => (
                <div key={idx} style={{ width: "100%", textAlign: "left" }}>
                  <SearchResult
                    search_idx={idx}
                    redirect_url={d.redirect_url}
                    display_url={d.display_url}
                    submission_id={d.submission_id}
                    result_hash={d.result_hash}
                    highlighted_text={d.highlighted_text}
                    explanation={d.explanation}
                    hashtags={d.hashtags}
                    communities_part_of={d.communities_part_of}
                    auth_token={localStorage.getItem("authToken")}
                    show_relevant={show_relevant}
                  />
                </div>
              )))}
            </div>

          </Box>
        )}
        {!isUserQueried && !comparisonSpinner && !comparisonResults && <p>No results found.</p>}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>

    </div>
  );
}
  
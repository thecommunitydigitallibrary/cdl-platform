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
import { FormControl, MenuItem, Select } from "@mui/material";

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


  const onAskWeb = async (question) => {
    let res = await fetch(baseURL + "generate", {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("authToken"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "context": highlightedText,
        "query": question,
        "mode": "web",
        "url": url
      }),
    });
    let response = await res.json();
    window.open(response.output, "_blank", "noopener noreferrer");
  }

  const onAskLLM = async (question) => {
    setGenerationSpinner(true)
    setText(question)
    let res = await fetch(baseURL + "generate", {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("authToken"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "context": highlightedText,
        "query": question,
        "mode": "qa",
        "url": url
      }),
    });
    let response = await res.json();
    let output = <p>{response.output}</p>
    setGenerationSpinner(false)
    setGenerationResults(output)
    getComparison(url, response.output)
  }



  const onGenerate = async (mode, ht) => {
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

    var context = ""
    if (ht === null || ht === undefined) {
      context = highlightedText
    } else {
      context = ht
    }

    let res = await fetch(baseURL + "generate", {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("authToken"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "context": context,
        "query": text,
        "mode": mode,
        "url": url
      }),
    });

    let response = await res.json();

    var output = ""

    if (mode == "contextual_qa" || mode == "gen_questions") {
      let resultArray = response.output.split('\n');
      output = resultArray.map((item, index) => <div>
                                                  <p key={index}>
                                                    {item}
                                                  </p>
                                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <Button style={{ marginRight: '10px' }} 
                                                            onClick={() => onAskWeb(item)}
                                                    >Search the Web</Button>
                                                    <Button style={{ marginRight: '10px' }} 
                                                            onClick={() => onAskLLM(item)}
                                                    >Generate Answer</Button>
                                                  </div>
                                                </div>
                              );

    } else {
      output = <p>{response.output}</p>
      getComparison(url, response.output)
    }
    setGenerationSpinner(false)
    setGenerationResults(output)
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
    //setComparisonSpinner(true);
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
            setHighlightedText("");
            getComparison(url, "");
          } else {
            setHighlightedText(result[0].result);
            setUrl(url);
            getComparison(url, result[0].result);
            onGenerate("gen_questions", result[0].result)
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
          "&source=extension_search&page=0&community=" + e.target.community.value,
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
      if (response.status === "ok") {
        setAllCommunities(response.community_info);
      } else {
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
            InputProps={{
              endAdornment:
                <IconButton type="submit" variant="contained" >
                  <SearchIcon />
                </IconButton>
            }}
            autoFocus
          />
          <FormControl style={{ maxWidth: 100 }}>
            <Select
              style={{ backgroundColor: "white" }}
              name="community"
              defaultValue={"all"}
            >
              <MenuItem value="all">All</MenuItem>
              {allCommunities.length > 0 &&
                allCommunities.map(function (community, idx) {
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
                  hashtags={d.hashtags}
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
          <p>{highlightedText.substring(0, 100)}...</p>
        </div>
      )}

      

      {!isUserQueried && comparisonResults && (
        <div>
          <Button variant="contained" style={{ padding: 14, width: "22%", marginRight: "5px" }} onClick={() => onAskWeb(text)}>
            Search the Web
          </Button>
          <Button variant="contained" style={{ padding: 14, width: "22%", marginRight: "5px" }} onClick={onQA}>
            Generate Answer
          </Button>
          <Button variant="contained" style={{ padding: 14, width: "22%", marginRight: "5px" }} onClick={onCQA}>
            Ask in Context
          </Button>
          <Button variant="contained" style={{ padding: 14, width: "22%", marginRight: "5px" }} onClick={onQG}>
            Regenerate Questions
          </Button>
        </div>
      )}

      


      {!isUserQueried && !generationSpinner && generationResults && (
        <div style={{ textAlign: "left", width: "90%" }}>
          {generationResults}
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
            {comparisonResults.submitted_you.results.length !== 0 && (<div><h4>Saved by You</h4><p>Keywords: {comparisonResults.submitted_you.keywords}</p></div>)}
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

            {comparisonResults.submitted_community.results.length !== 0 && (<div><h4>Saved by Other Community Members</h4><p>Keywords: {comparisonResults.submitted_community.keywords}</p></div>)}
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

            {comparisonResults.indexed_cdl.results.length !== 0 && (<div><h4>Indexed by TextData</h4><p>Keywords: {comparisonResults.indexed_cdl.keywords}</p></div>)}
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
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>

    </div>
  );
}

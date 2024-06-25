import "bootstrap/dist/css/bootstrap.min.css";
import jsCookie from "js-cookie";
import React, { useEffect } from "react";
import SearchResult from "../components/searchresult";
import Head from "next/head";
import InfiniteScroll from "react-infinite-scroll-component";
import { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Fab from "@mui/material/Fab";
import CommunityDisplay from "../components/communityDisplay";
import CircularProgress from "@mui/material/CircularProgress";
import { Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { BASE_URL_CLIENT, BASE_URL_SERVER, WEBSITE_SEARCH_ENDPOINT, SUMMARIZE_ENDPOINT} from "../static/constants";

// Relevant Flag here for now
//let show_relevant = true;

function SearchResults({ data, show_relevance_judgment, own_submissions, community }) {
  console.log(data)
  console.log(show_relevance_judgment)
  console.log(own_submissions)
  console.log(community)


  const [items, setItems] = useState(data.search_results_page);
  const [page, setPage] = useState(parseInt(data.current_page) + 1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(Math.ceil(data.total_num_results / 10));
  const [searchedCommunity, setSearchedCommunity] = useState("all")
  const [selectedSortByOption, setSelectedSortByOption] = useState("relevance")


  const [searchSummary, setSearchSummary] = useState();
  const [generationSpinner, setGenerationSpinner] = React.useState(false);
  const [isSearchSummaryClicked, setIsSearchSummaryClicked] = useState(false);
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  useEffect(() => {
    setItems(data.search_results_page);
    setPage(parseInt(data.current_page) + 1);
    setLoading(false);
    setTotalPages(Math.ceil(data.total_num_results / 10));
    setSelectedSortByOption("relevance");
    setSearchedCommunity(findCommunityName(community))
    setSearchSummary(false);
    setIsSearchSummaryClicked(false);
    setGenerationSpinner(false);
    setExpanded(false);
  }, [data])

  const handleSearchSummary = async () => {
    setGenerationSpinner(true)
    const summarizeURL = BASE_URL_CLIENT + SUMMARIZE_ENDPOINT + "?search_id=" + data.search_id
    try {
      const searchSummaryApi = await fetch(summarizeURL, {
        method: "GET",
        headers: {
          Authorization: jsCookie.get("token"),
          "Content-Type": "application/json",
        }
      })
      const search_summary = await searchSummaryApi.json()
      if (searchSummaryApi.ok) {
        setGenerationSpinner(false)
        setSearchSummary(search_summary.output);
        setIsSearchSummaryClicked(true);
      } else {
        setGenerationSpinner(false)
        setSearchSummary("Not generated")
        setErrorMessage(search_summary.message)
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const loadMoreResults = async () => {

    try {
      const response = await fetch(BASE_URL_CLIENT + WEBSITE_SEARCH_ENDPOINT + '?search_id=' + data.search_id + '&page=' + page, {
        headers: new Headers({
          Authorization: jsCookie.get("token"),
        }),
      });
      const content = await response.json();
      setItems([...items, ...content.search_results_page]);

      if ((page + 1) % 5 === 0) {
        setLoading(true);
      } else {
        setLoading(false);
      }

      if (page !== totalPages) {
        setPage(page + 1);
      }

    } catch (error) {
      console.log(error);
    }
  };
  const handleSortByOption = async (event) => {
    setSelectedSortByOption(event.target.value);
    //setItems([]);
    setLoading(true);
    const response = await fetch(BASE_URL_CLIENT + WEBSITE_SEARCH_ENDPOINT + '?search_id=' + data.search_id + '&page=0' + '&sort_by=' + event.target.value, {
      headers: new Headers({
        Authorization: jsCookie.get("token"),
      }),
    });
    const content = await response.json();
    setItems(content.search_results_page);
    setLoading(false);
  };


  function findCommunityName(community_id) {
    if (community_id == "all") return community_id + " of your communities"

    // instead, parse the data obj returned by API
    // to get names of public communities, if present
    // name is value of id
    //return data.requested_communities[community_id]

    const commArray = JSON.parse(window.localStorage.getItem('dropdowndata')).community_info
    var name;
    for (let i = 0; i < commArray.length; i++) {
      if (commArray[i].community_id === community_id) {
        name = commArray[i].name;
      }
    }
    return name;
  }

  const scrollToTop = () => {
    var innerDiv = document.querySelector('#searchResultsBlock');
    innerDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

  };


  if (
    data.search_results_page === undefined ||
    data.search_results_page.length == 0
  ) {
    return (
      <div className="allResults">
        <Head>
          <title>
            {data.query !== "" ? data.query : "Search"} - TextData
          </title>
          <link rel="icon" href="/images/tree32.png" />
        </Head>

        <div id="searchResultsBlock" className="px-4">
          <h4 className="text-center">Search Results (0) </h4>
          {own_submissions && <p className="text-center text-sm">Filtered by your own submissions</p>}

          <div className="flex items-center justify-center">
            <Typography variant="subtitle2">
              Community: <CommunityDisplay k={community} name={data.requested_communities[community]} />
            </Typography>
            <div >
            </div>

          </div>
        </div>

        <hr className="border-t border-black my-3 mx-3" />

        <div className="mx-auto px-4 text-center">
          <p>No results found for your search query.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="allResults ml-5">
      <Head>
        <title>{data.query !== "" ? data.query : "Search"} - TextData</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>

      <div id="searchResultsBlock" className="px-4 justify-center">
        <h4 className="text-center">Search Results ({data.total_num_results}) 
          <span>
            <a
              href={"/export?search_id=" + data.search_id}
              className="inline-block py-1 px-3 text-sm border border-blue-500 rounded hover:bg-blue-200 hover:text-black"
              target="_blank"
              rel="noopener noreferrer"
            >
              Export
            </a>

          </span>
        </h4>
        <div  style={{display: 'flex', justifyContent: 'center'}}>
              <FormControl className="w-24 h-18" size="small">
                  <Select
                    labelId="select-sortBy-type"
                    id="select-sortBy-type"
                    name="method"selectedSortByOption
                    value={selectedSortByOption}
                    onChange={handleSortByOption}
                  className="text-xs"  
                  >
                    <MenuItem value="popularity">Popularity</MenuItem>
                    <MenuItem value="date">Most Recent</MenuItem>
                    <MenuItem value="relevance">Relevant</MenuItem>
                  </Select>
                </FormControl>
            </div>
      
          
          
          <div className="text-center py-1">
            
          
            {own_submissions && <p className="text-center text-xs">Filtered by your own submissions</p>}
            <Typography variant="subtitle2">
              Community: <CommunityDisplay k={community} name={data.requested_communities[community]} />
            </Typography>
          </div>
      </div>

      <div className="lg:max-w-[960px] lg:mx-auto">
        <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >

            <div className="flex justify-between items-center">
              <Typography variant="title" className="text-sm font-bold">
                Summary of search results
              </Typography>
              <div className="ml-5">
                <Button
                  className={!isSearchSummaryClicked ? "bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded cursor-pointer"
                    :
                    "bg-gray-500 text-white py-2 px-4 rounded cursor-not-allowed"
                  }
                  disabled={isSearchSummaryClicked}
                  variant="contained"
                  onClick={!isSearchSummaryClicked ? handleSearchSummary : () => console.log('asking for summary again')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Summarize
                </Button>
              </div>
            </div>

          </AccordionSummary>
          <AccordionDetails>
            {searchSummary && !generationSpinner && (
              <Typography variant="subtitle2">
                {searchSummary && searchSummary !== "" ? searchSummary : 'Not generated'}
              </Typography>
            )}
            {generationSpinner && (
              <div className="m-auto">
                <CircularProgress color="success" />
              </div>
            )}
          </AccordionDetails>
        </Accordion>

        <div className="">
          <InfiniteScroll
            dataLength={items.length}
            next={loadMoreResults}
            hasMore={page % 5 == 0 ? false : true}
            loader=""
          >
            {items.map((d, idx) => (
              <div key={idx}>
                <SearchResult
                  search_idx={idx}
                  redirect_url={d.redirect_url}
                  display_url={d.display_url}
                  submission_id={d.submission_id}
                  hashtags={d.hashtags}
                  description={d.description}
                  title={d.title}
                  time={d.time}
                  communities_part_of={d.communities_part_of}
                  auth_token={jsCookie.get("token")}
                  username={d.username}
                />
              </div>
            ))}
          </InfiniteScroll>

          <div className="px-4 py-6 text-center">
            {totalPages !== page && loading && (
              <div>
                <Fab
                  variant="extended"
                  className="my-1 bg-blue-500 hover:bg-blue-700 cursor-pointer"
                  onClick={loadMoreResults}
                  sx={{ color: "white", backgroundColor: "#1976d2" }}
                >
                  Load More
                </Fab>
              </div>
            )}

            {totalPages === page && (

              <div className="text-center">
                <p className="text-base">You've reached the end of your search results.</p>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded cursor-pointer"
                  onClick={scrollToTop}
                >
                  Back to top
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

// This gets called on every request
export async function getServerSideProps(context) {
  var show_relevance_judgment = true
  var own_submissions = false

  // Fetch data from external API
  if (
    context.req.cookies.token === "" ||
    context.req.cookies.token === undefined
  ) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  } else {
    var searchURL = BASE_URL_SERVER + WEBSITE_SEARCH_ENDPOINT + "?";
    if (context.query.search_id != undefined) {
      searchURL += "search_id=" + context.query.search_id;
    } else {
      searchURL += "community=" + context.query.community;
      searchURL += "&source=website_searchbar"

      if (context.query.query != undefined) {
        searchURL += "&query=" + encodeURIComponent(context.query.query);
      } else {
        context.query.query = "";
        show_relevance_judgment = false
      }

      if (context.query.own_submissions != undefined) {
        searchURL += "&own_submissions=True"
        own_submissions = true;
      }
    }

    if (context.query.page != undefined) {
      searchURL += "&page=" + context.query.page;
    } else {
      searchURL += "&page=0";
    }

    const res = await fetch(searchURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });

    const data = await res.json();
    const community = context.query.community

    if (res.status == 200) {
      // Pass data to the page via props
      if (context.query.page == undefined) {
        data.current_page = "0";
      } else {
        data.current_page = context.query.page;
      }
      return { props: { data, show_relevance_judgment, own_submissions, community } };
    } else {
      data.query = "";
      return { props: { data, show_relevance_judgment, own_submissions, community } };
    }
  }
}

export default SearchResults;
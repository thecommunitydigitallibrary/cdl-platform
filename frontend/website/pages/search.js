import "bootstrap/dist/css/bootstrap.min.css";
import jsCookie from "js-cookie";
import Router, { useRouter } from "next/router";
import React, { useEffect } from "react";
import SearchResult from "../components/searchresult";
import Header from "../components/header";
import Head from "next/head";
import InfiniteScroll from "react-infinite-scroll-component";
import { useState } from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Fab from "@mui/material/Fab";
import Divider from "@mui/material/Divider";
import Footer from "../components/footer";
import CommunityDisplay from "../components/communityDisplay";



const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const websiteURL = process.env.NEXT_PUBLIC_FROM_CLIENT;
const searchEndpoint = "search?";
var searchURL = baseURL_client + searchEndpoint;


// Relevant Flag here for now
//let show_relevant = true;

function SearchResults({ data, show_relevance_judgment, own_submissions, community }) {

  const [items, setItems] = useState(data.search_results_page);
  const [page, setPage] = useState(parseInt(data.current_page) + 1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(Math.ceil(data.total_num_results / 10));
  const [searchedCommunity, setSearchedCommunity] = useState("all")


  useEffect(() => {
    setItems(data.search_results_page);
    setPage(parseInt(data.current_page) + 1);
    setLoading(false);
    setTotalPages(Math.ceil(data.total_num_results / 10));
    setSearchedCommunity(findCommunityName(community))
  }, [data])

  const loadMoreResults = async () => {

    // console.log("search URL:", searchURL + 'search_id=' + data.search_id + '&page=' + page);

    try {
      const response = await fetch(searchURL + 'search_id=' + data.search_id + '&page=' + page, {
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

      // console.log(content.search_results_page);

    } catch (error) {
      console.log(error);
    }
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
            {data.query != "" ? data.query : "Search"} - TextData
          </title>
          <link rel="icon" href="/images/tree32.png" />
        </Head>
        <div className="searchR">

        </div>

        <div style={{ textAlign: 'center', height: '300px' }}>
          <div>
            <Grid item sx={{ textAlign: 'center' }}>
              <h4>Search Results</h4>{" "}
              {own_submissions && <Typography textAlign={'center'} variant="caption">Filtered by your own submissions</Typography>}

              <Typography>
                Community: <CommunityDisplay k={community} name={data.requested_communities[community]} communities_part_of={Object} />
              </Typography>

            </Grid>
            <hr />
            <h5>No results found.</h5>
          </div>
        </div>
        {/* <Footer alt={true} /> */}
      </div>
    );
  }

  return (
    <div className="allResults">
      <Head>
        <title>{data.query != "" ? data.query : "Search"} - TextData</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>


      <Grid id={'searchResultsBlock'} container display={"flex"} direction={"column"} justifyContent={"center"} alignItems={"center"}>

        <Grid container sx={{ position: 'relative' }} justifyContent={'center'}>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <h4>Search Results (Total: {data.total_num_results})</h4>
            {own_submissions && <Typography textAlign={'center'} variant="caption">Filtered by your own submissions</Typography>}
          </Grid>
          <Grid item>

            <Typography variant="subtitle2">
            Community: <CommunityDisplay k={community} name={data.requested_communities[community]} />
            </Typography>

          </Grid>
          <Grid item sx={{ position: 'absolute', top: 0, right: 5 }}>
            <a
              style={{
                border: '1px solid #1976d2',
                padding: '5px 10px',
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block',
                margin: '5px',
                fontSize: '14px',
              }}
              target="_blank"
              rel="noopener noreferrer"
              href={"/export?search_id=" + data.search_id}

            >
              Export Search Results
            </a>
          </Grid>
        </Grid>

        <Grid item sx={{ textAlign: 'center' }}>
        </Grid>

        <Grid container
          minWidth={'600px'}
          width={'100ch'}
          direction={'column'}
          borderTop={"1px solid lightgray"}
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}>
          <InfiniteScroll
            dataLength={items.length}
            next={loadMoreResults}
            hasMore={page % 5 == 0 ? false : true}
            loader="" >
            <Grid item margin={'auto'}>
              {items !== undefined && items.length !== 0 &&
                items.map(function (d, idx) {
                  return (
                    <div key={idx}>
                      <SearchResult
                        search_idx={idx}
                        redirect_url={d.redirect_url}
                        display_url={d.display_url}
                        submission_id={d.submission_id}
                        result_hash={d.result_hash}
                        hashtags={d.hashtags}
                        highlighted_text={d.highlighted_text}
                        explanation={d.explanation}
                        time={d.time}
                        communities_part_of={d.communities_part_of}
                        auth_token={jsCookie.get("token")}
                        show_relevant={show_relevance_judgment}
                        username={d.username}
                      ></SearchResult>
                    </div>
                  );
                })}
            </Grid>
          </InfiniteScroll>
        </Grid>

        <Grid item sx={{ textAlign: 'center' }}>
          {totalPages !== page && loading &&
            <div style={{
              textAlign: 'center'
            }}>
              <Fab variant="extended"
                className="my-1 bg-blue-500 hover:bg-blue-700 cursor-pointer"
                sx={{ color: 'white', backgroundColor: '#1976d2' }} onClick={loadMoreResults}> Load More
              </Fab>
            </div>}

          {totalPages === page &&
            <div
              style={{
                textAlign: 'center'
              }}
            >
              <div>
                <Typography>
                  You've reached the end of your search results.
                </Typography>

                <h1>
                  <Fab
                    className='my-1 bg-blue-500 hover:bg-blue-700 cursor-pointer' variant="extended" onClick={scrollToTop} sx={{ backgroundColor: '#1976d2' }} >
                    <Typography color={"white"}>
                      Back to top
                    </Typography>
                  </Fab>
                </h1>
              </div>
            </div>}
        </Grid>

      </Grid>
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
    var searchURL = baseURL_server + searchEndpoint;
    if (context.query.search_id != undefined) {
      searchURL += "search_id=" + context.query.search_id;
    } else {
      if (context.query.query != undefined) {
        searchURL += "query=" + encodeURIComponent(context.query.query);
      } else {
        context.query.query = "";
        show_relevance_judgment = false
      }
      searchURL += "&community=" + context.query.community;

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
import Head from "next/head";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../components/header";
import SearchResult from "../components/searchresult";
import jsCookie from "js-cookie";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import Footer from "../components/footer";
import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import { ArrowUpwardOutlined } from "@mui/icons-material";

const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const recommendationsEndPoint = "recommend";

function Home({ data }) {

  const [items, setItems] = useState(data.recommendation_results_page);
  const [page, setPage] = useState(parseInt(data.current_page) + 1);
  const [latestRecommendationId, setLatestRecommendationId] = useState(data.recommendation_id)
  const [endOfRecommendations, setEndOfRecommendations] = useState(false)
  // set 'explore_user_submissions' as default method
  const [selectedRecOption, setSelectedRecOption] = useState("explore_user_submissions");

  const fetchNextPage = async () => {
    let pg = page
    var recommendationURLClient = baseURL_client + recommendationsEndPoint;
    try {
      const response = await fetch(
        `${recommendationURLClient}?recommendation_id=${latestRecommendationId}&page=${page}`,
        {
          headers: new Headers({
            Authorization: jsCookie.get("token"),
          }),
        }
      );
      const content = await response.json();
      var tempItems = content.recommendation_results_page
      if( tempItems < 10){
        setEndOfRecommendations(true)
      }
      setItems([...items, ...tempItems]);
      pg += 1
      setPage(pg)
    } catch (error) {
      console.log(error);
    }
  };

  const handleRecTypeChange = async (event) => {
    let pg = 0
    const value = event.target.value;
    setSelectedRecOption(value);
    setEndOfRecommendations(true)
    var recommendationURLClient = baseURL_client + recommendationsEndPoint;
    const response = await fetch(`${recommendationURLClient}?method=${value}&page=${'0'}`,
      {
        headers: new Headers({
          Authorization: jsCookie.get("token"),
        }),
      });

    const content = await response.json();
    let response_rec_id = content.recommendation_id
    setLatestRecommendationId(response_rec_id);
    setItems(content.recommendation_results_page);
    pg += 1
    setPage(pg)
  }

  useEffect(() => {
    if (page) {
      console.log("Updated page no:", page);
    }
  }, [page])

  useEffect(() => {
    if (latestRecommendationId) {
      console.log("Updated latestRecommendationId no:", latestRecommendationId);
    }
  }, [latestRecommendationId])

  // code to add a 'scroll to top of page' sticky button that is visible once user scrolls down
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const buffer = 250
      if (scrollTop > buffer && !visible) {
        setVisible(true);
      } else if (scrollTop < buffer && visible) {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visible]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="allResults">

        <Head>
          <title>The CDL</title>
          <link rel="icon" href="/images/tree32.png" />
        </Head>

        <Header />
        <Grid
          container
          display={"flex"}
          direction="column"
          justifyContent={"center"}
          alignItems={"center"}
          // width={"100%"}
        >
          <Grid item>
            <div style={{ textAlign: 'center' }}>
              <h1>The Community Digital Library</h1>
            </div>
          </Grid>
          <br/>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            width="57%">
            <Grid item width={'50%'}>
              <h4>Recommended for you</h4>
            </Grid>
            <Grid item>
              <FormControl
                sx={{ m: 1, minWidth: 120 }}
                size="small"
                margintop={0}
              >
                <Select
                  labelId="select-small"
                  id="select-recommendation-type"
                  name="method"
                  defaultValue={"explore_user_submissions"}
                  value={selectedRecOption}
                  onChange={handleRecTypeChange}
                >
                  {/* Currently is : User Submission History */}
                  <MenuItem value="explore_user_submissions">Explore</MenuItem>
                  <MenuItem value="recent">Most Recent</MenuItem>
                  {/* <MenuItem value="explore_similar_extension" disabled>Explore More</MenuItem> */}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

        </Grid>

        <Grid item marginX="20%">
          <Divider sx={{ border: 0.5}} />
        </Grid>
        <br/>
        <Grid
          container
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          >
          <InfiniteScroll
            dataLength={items.length}
            next={fetchNextPage}
            // currently doing only 5 page loads so setting condition to pg <= 5
            // hasMore={page<6}
            hasMore={!endOfRecommendations}
            loader={<h6 style={{ textAlign: 'center' }} >Loading...</h6>}
            endMessage={<h4 style={{ textAlign: 'center' }} >You've reached the end of your recommendations.</h4>}
          >
            <Grid item>
              {(items !== undefined && items.length > 0) ?
                items.map(function (d, idx) {
                  return (
                    <div key={idx}>
                      <SearchResult
                        search_idx={idx}
                        redirect_url={d.redirect_url}
                        display_url={d.display_url}
                        submission_id={d.submission_id}
                        result_hash={d.result_hash}
                        highlighted_text={d.highlighted_text}
                        explanation={d.explanation}
                        time={d.time}
                        communities_part_of={d.communities_part_of}
                        auth_token={jsCookie.get("token")}
                        show_relevant={true}
                        hashtags={d.hashtags}
                      ></SearchResult>
                    </div>

                  );
                })
                :
                <Typography style={{ textAlign: 'center'}}>
                  There are no new recommendations to show you from your
                  communities.
                </Typography>}
            </Grid>
          </InfiniteScroll>
        </Grid>
    
                {visible && <IconButton
                  variant="extended"
                  onClick={scrollToTop}
                  sx={{ width: '50px', height: '50px', ml: "85%", position: 'sticky', border: 'solid', bottom: '10px', "&:hover": {
                    backgroundColor: "#1976d2", color: 'white'} }}>
                  <ArrowUpwardOutlined color="white"></ArrowUpwardOutlined>
                </IconButton>}
        <Footer alt={true} />
      </div>
    </>
  );
}
export async function getServerSideProps(context) {
  // Fetch data from external API
  if (
    context.req.cookies.token === "" ||
    context.req.cookies.token === undefined
  ) {
    return {
      redirect: {
        destination: "/about",
        permanent: false,
      },
    };
  } else {
    var recommendationURL = baseURL_server + recommendationsEndPoint;

    recommendationURL += "?method=" + "explore_user_submissions" + "&page=0";
    
    const res = await fetch(recommendationURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });

    const data = await res.json();
    if (res.status == 200) {
      // Pass data to the page via props
      if (context.query.page == undefined) {
        data.current_page = "0";
      } else {
        data.current_page = context.query.page;
      }
      return { props: { data } };
    } else if (res.status == 404) {
      return {
        redirect: {
          destination: "/auth",
          permanent: false,
        },
      };
    } else {
      return { props: { error: "error" } };
    }
  }
}

export default Home;

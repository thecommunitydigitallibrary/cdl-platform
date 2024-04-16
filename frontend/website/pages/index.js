import Head from "next/head";
import "bootstrap/dist/css/bootstrap.min.css";
import SearchResult from "../components/searchresult";
import jsCookie from "js-cookie";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InfiniteScroll from "react-infinite-scroll-component";
import React, { useEffect, useState } from "react";
import { Paper, Button, IconButton, Skeleton, Tooltip, Typography } from "@mui/material";
import { ArrowUpwardOutlined } from "@mui/icons-material";
import { Router, useRouter } from "next/router";
import QuickSubmissionBox from "../components/quickSubmissionBox";
import Setup from "./setup";
import dynamic from "next/dynamic";

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatWindow from "../components/chatwindow";
import useUserDataStore from "../store/userData";
import { BASE_URL_CLIENT, SEARCH_ENDPOINT } from "../static/constants";

const HomeConnections = dynamic(() => import("./homeconnections"), {
  ssr: false,
});
const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const recommendationsEndPoint = "recommend";
const recentlyAccessedSubmissionsEndpoint = "submission/recentlyaccessed";
const getCommunitiesEndpoint = "getCommunities";
const searchEndpoint = "search?";

function Home({ data, community_joined_data, recently_accessed_submissions }) {
  const router = useRouter();
  const [items, setItems] = useState(data.recommendation_results_page);
  const [page, setPage] = useState(parseInt(data.current_page) + 1);
  const [latestRecommendationId, setLatestRecommendationId] = useState(data.recommendation_id)
  const [endOfRecommendations, setEndOfRecommendations] = useState((data.recommendation_results_page.length) < 10)
  const [userOwnSubmissions, setUserOwnSubmissions] = useState(null);

  // set 'explore_similar_extension' as default method
  const [selectedRecOption, setSelectedRecOption] = useState("recent");
  const [onboardingStep, setOnboardingStep] = useState(0);
  let extensionId = "aafcjihpcjlagambenogkhobogekppgp";
  let imgSrc = "/tree48.png";

  const { userCommunities, user_id, setUserDataStoreProps } = useUserDataStore();

  let homePageContent = <Setup head="Onboarding" updateStep={onboardingStep}></Setup>;

  function checkExtension() {
    const isImagePresent = new Promise((resolve, _) => {
      const img = new Image();
      img.src = "chrome-extension://" + extensionId + imgSrc;
      img.onload = () => {
        resolve(true);
      }
      img.onerror = () => {
        resolve(false);
      }
    });
    return isImagePresent;
  }

  async function checkOnboarding() {
    const img = await checkExtension();
    if (!img) {
      if (community_joined_data.community_info.length > 0 || community_joined_data.followed_community_info.length > 0) {
        if (recently_accessed_submissions && recently_accessed_submissions.length >= 1) {
          setOnboardingStep(0);
        } else {
          setOnboardingStep(3);
        }
      }
      else {
        setOnboardingStep(1);
      }
    } else {
      if (community_joined_data.community_info.length > 0 || community_joined_data.followed_community_info.length > 0) {
        if (!(endOfRecommendations && items.length > 0)) {
          //if user has created community but no submission
          setOnboardingStep(3);
        }
      } else {
        setOnboardingStep(2);
      }
    }
  }

  async function getVizData() {
    var searchURL = BASE_URL_CLIENT + searchEndpoint;
    searchURL += "own_submissions=True" + "&community=all&source=visualizeConnections";
    const users_submissions = await fetch(searchURL, {
      headers: new Headers({
        Authorization: jsCookie.get("token"),
      }),
    });

    if (users_submissions.status == 200) {
      const user_own_submissions = await users_submissions.json();
      setUserOwnSubmissions(user_own_submissions);
      return user_own_submissions
    }
    else {
      setUserOwnSubmissions(null);
      return null;
    }

  }

  useEffect(async () => {
    await checkOnboarding();
    setUserDataStoreProps({ userCommunities: community_joined_data.community_info });

    // get viz data
    var temp = await getVizData();
    console.log('received vizdata!');

  }, []);

  const handleIndexFinish = (data) => {
    window.location.reload();
  }

  if (onboardingStep > 0) {
    homePageContent = <Setup head="Onboarding" updateStep={onboardingStep} setupFinish={handleIndexFinish}></Setup>;
  }

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
      if (tempItems < 10) {
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
    setItems([])
    setEndOfRecommendations(false)
    var recommendationURLClient = baseURL_client + recommendationsEndPoint;
    const response = await fetch(`${recommendationURLClient}?method=${value}&page=${'0'}`,
      {
        headers: new Headers({
          Authorization: jsCookie.get("token"),
        }),
      });
    const content = await response.json();
    let response_rec_id = content.recommendation_id;
    if (content.recommendation_results_page < 10) { //0 to 10
      setEndOfRecommendations(true)
    }
    setLatestRecommendationId(response_rec_id);
    setItems(content.recommendation_results_page);
    pg += 1
    setPage(pg)
  }

  useEffect(() => {
    if (page) {
      console.log("On page no:", page);
    }
  }, [page])

  useEffect(() => {
  }, [latestRecommendationId])


  useEffect(() => {
  }, [endOfRecommendations])

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

  if (onboardingStep == 0) {
    homePageContent = (
      <div>
        <Grid
          container
          display={"flex"}
          direction="column"
          justifyContent={"center"}
          alignItems={"center"}
        >
          <Grid item marginTop={'1%'}>
            <div style={{ textAlign: 'center' }}>
              <h1>TextData</h1>
            </div>
          </Grid>

          <Grid item style={{ width: '100ch' }} >
            <Divider sx={{ border: '1.5px solid', borderColor: 'black', marginY: '20px' }} />
          </Grid>

          <Grid
            style={{ display: "flex", width: "100ch", flexDirection: "column" }}>
            <h4>Recently Accessed Submissions</h4>
          </Grid>
          <Grid item width={'100ch'}>
            <QuickSubmissionBox submissionData={recently_accessed_submissions} />
          </Grid>


          <Grid item style={{ width: '100ch' }} >
            <Divider sx={{ border: '1.5px solid', borderColor: 'black', marginY: '20px' }} />
          </Grid>

          <Grid
            style={{ display: "flex", width: "100ch", height: "500px", flexDirection: "column" }}>
            <Grid item >
              <h4 >Visualizing Your Submissions</h4>
            </Grid>
            {!userOwnSubmissions ?
              <Tooltip title={<Typography>Loading</Typography>} placement="top">
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  width={"100ch"}
                  height={"100vh"}
                />
              </Tooltip>
              :
              <HomeConnections nds={userOwnSubmissions && userOwnSubmissions['nodes']}
                eds={userOwnSubmissions && userOwnSubmissions['edges']} />
            }
          </Grid>
          <Grid item style={{ width: '100ch', marginTop: '10px' }} >
            <Divider sx={{ border: '1.5px solid', borderColor: 'black' }} />
          </Grid>
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
                  defaultValue={"recent"}
                  value={selectedRecOption}
                  onChange={handleRecTypeChange}
                >
                  {/* Currently is : User Submission History + Extension opens searches*/}
                  <MenuItem value="explore_similar_extension">Explore</MenuItem>
                  <MenuItem value="recent">New Submissions</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          container
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          minWidth={'600px'}
          margin={'auto'}
          width={'100ch'}
          direction={'column'}
          borderTop={"1px solid lightgray"}
        >
          <InfiniteScroll
            dataLength={items.length}
            next={fetchNextPage}
            hasMore={!endOfRecommendations}
            loader={!endOfRecommendations && <h6 style={{ textAlign: 'center' }} >Loading...</h6>}
            endMessage={endOfRecommendations && items.length > 0 ?
              <h4 style={{ textAlign: 'center', marginTop: '15px' }} > You've reached the end of your recommendations.</h4>
              :
              <>
                <br />
                <h6 style={{ textAlign: 'center' }}> No recommendations to display. <br /> <br />
                  {/* Currently is : href needs to be updated to make new submission model open*/}
                  <a variant="outline" href={"/community"}>{" Click here to create or join a community!"}</a></h6>
              </>}
          >
            <Grid item margin={'auto'}>
              {(items !== undefined && items.length > 0) &&
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
                })}
            </Grid>
          </InfiniteScroll>
        </Grid>

        {visible && <IconButton
          variant="extended"
          onClick={scrollToTop}
          sx={{
            width: '50px', height: '50px', ml: "85%", position: 'sticky', border: 'solid', bottom: '10px', "&:hover": {
              backgroundColor: "#1976d2", color: 'white'
            }
          }}>
          <ArrowUpwardOutlined color="white"></ArrowUpwardOutlined>
        </IconButton>}
      </div>
    );
  }

  return (
    <>
      <div className="allResults">

        <Head>
          <title>TextData</title>
          <link rel="icon" href="/images/tree32.png" />
        </Head>
        {homePageContent}
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
    recommendationURL += "?method=" + "recent" + "&page=0";
    const res = await fetch(recommendationURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });
    var recentlyAccessedSubmissionsURL = baseURL_server + recentlyAccessedSubmissionsEndpoint;
    const recentlyAccessedSubmissions = await fetch(recentlyAccessedSubmissionsURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });

    var communityURL = baseURL_server + getCommunitiesEndpoint;
    const fetchCommunities = await fetch(communityURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });

    var searchURL = baseURL_server + searchEndpoint;
    searchURL += "own_submissions=True" + "&community=all&source=visualizeConnections";

    const data = await res.json();
    const recently_accessed_submissions = await recentlyAccessedSubmissions.json();
    const community_joined_data = await fetchCommunities.json();
    if (fetchCommunities.status == 200) {
      if (res.status == 200) {
        if (recentlyAccessedSubmissions.status == 200) {
          if (context.query.page == undefined) {
            data.current_page = "0";
          } else {
            data.current_page = context.query.page;
          }
          return {
            props: {
              data, community_joined_data,
              recently_accessed_submissions
            }
          };
        }
        // }
      }
    } else if (res.status == 404) {
      return {
        redirect: {
          destination: "/auth",
          permanent: false,
        },
      };
    } else {
      const error_data = { error: "Something went wrong. Please try again later" };
      return { props: { error: { error_data } } };
    }
  }
}

export default Home;

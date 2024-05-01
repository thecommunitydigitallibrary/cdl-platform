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
import RecommendedCommunityBox from "../components/recommendedCommunityBox";

const HomeConnections = dynamic(() => import("./homeconnections"), {
  ssr: false,
});
const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const recommendationsEndPoint = "recommend";
const recentlyAccessedSubmissionsEndpoint = "submission/recentlyaccessed";
const getCommunitiesEndpoint = "getCommunities";
const searchEndpoint = "search?";

function Home({ data, community_joined_data, recently_accessed_submissions, recommendedCommunitiesData }) {
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
      <div className="px-4 sm:mx-6">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-600">TextData</h1>
        </div>
        <Divider className="my-2" />

        {/* <div className="mb-4 flex flex-col lg:flex-row"> */}
        {/* Recently Accessed Submissions */}
        <div className="mb-4 lg:mb-0 lg:mx-60">
          <h2 className="text-xl font-semibold mb-4">Recently Accessed Submissions</h2>
          <QuickSubmissionBox className="mt-2" submissionData={recently_accessed_submissions} />
        </div>

        {/* Recommended Communities */}
        <div className="mb-4 lg:mb-0 lg:mx-60">
          <h2 className="text-xl font-semibold mb-4">Recommended Commmunities</h2>
          <RecommendedCommunityBox className="mt-2" recommendedCommunitiesData={recommendedCommunitiesData.recommended_communities} />
        </div>

        <Divider className="mb-4" />

        {/* Submission Graph */}
        <div className="mb-8 lg:mx-60">
          <h2 className="text-xl font-semibold mb-4">Visualizing Your Submissions</h2>
          {!userOwnSubmissions ? (
            <div className="text-center">
              <Tooltip title="Loading" placement="top">
                <Skeleton animation="wave" variant="rectangular" width={300} height={5000} />
              </Tooltip>
            </div>
          ) : (
            <div style={{ height: '65vh' }}>
              <HomeConnections nds={userOwnSubmissions && userOwnSubmissions['nodes']} eds={userOwnSubmissions && userOwnSubmissions['edges']} />
            </div>
          )}
        </div>

        <Divider className="my-4" />

        <div className="mb-4 lg:mx-60">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recommended</h2>
            <FormControl className="ml-2" size="small">
              <Select
                labelId="select-recommendation-type"
                id="select-recommendation-type"
                name="method"
                value={selectedRecOption}
                onChange={handleRecTypeChange}
                size="small"
                className="w-40"
              >
                <MenuItem value="explore_similar_extension">Explore</MenuItem>
                <MenuItem value="recent">New Submissions</MenuItem>
              </Select>
            </FormControl>
          </div>

          <InfiniteScroll
            dataLength={items.length}
            next={fetchNextPage}
            hasMore={!endOfRecommendations}
            loader={!endOfRecommendations && <div className="text-center">Loading...</div>}
            endMessage={endOfRecommendations && items.length > 0 ? <div className="text-center">You've reached the end of your recommendations.</div> : <div className="text-center">No recommendations to display. <br /> <a href="/community">Click here to create or join a community!</a></div>}
          >
            <div className="flex flex-col items-center">
              {items.map((d, idx) => (
                <div key={idx} className="mb-4 w-full">
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
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>
        </div >

        {
          visible && (
            <IconButton
              variant="extended"
              onClick={scrollToTop}
              sx={{
                width: '50px',
                height: '50px',
                ml: "auto",
                border: 'solid',
                bottom: '10px',
                position: 'fixed',
                right: '10px',
                backgroundColor: 'white',
                "&:hover": {
                  backgroundColor: "#1976d2",
                  color: 'white'
                }
              }}
            >
              <ArrowUpwardOutlined color="primary" />
            </IconButton>
          )
        }
      </div >
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

// export async function getServerSideProps(context) {
//   // Early return if no token is present
//   if (!context.req.cookies.token) {
//     return {
//       redirect: {
//         destination: "/about",
//         permanent: false,
//       },
//     };
//   }

//   const tokenHeaders = new Headers({
//     Authorization: context.req.cookies.token,
//   });

//   try {
//     // Endpoints
//     const baseURL = baseURL_server;
//     const recommendationURL = `${baseURL}${recommendationsEndPoint}?method=recent&page=0`;
//     const recentlyAccessedSubmissionsURL = `${baseURL}${recentlyAccessedSubmissionsEndpoint}`;
//     const communityURL = `${baseURL}${getCommunitiesEndpoint}`;
//     const recommendedCommunitiesURL = `${baseURL}communityRecommend`;

//     // Fetch requests
//     const [res, recentlyAccessedSubmissions, fetchCommunities, recommendedCommunities] = await Promise.all([
//       fetch(recommendationURL, { headers: tokenHeaders }),
//       fetch(recentlyAccessedSubmissionsURL, { headers: tokenHeaders }),
//       fetch(communityURL, { headers: tokenHeaders }),
//       fetch(recommendedCommunitiesURL, { headers: tokenHeaders })
//     ]);

//     // Process JSON data
//     const [data, recently_accessed_submissions, community_joined_data, recommended_communities_data] = await Promise.all([
//       res.json(),
//       recentlyAccessedSubmissions.json(),
//       fetchCommunities.json(),
//       recommendedCommunities.json()
//     ]);

//     // Ensure all fetches are successful
//     if (res.ok && recentlyAccessedSubmissions.ok && fetchCommunities.ok && recommendedCommunities.ok) {
//       return {
//         props: {
//           data,
//           recently_accessed_submissions,
//           community_joined_data,
//           recommended_communities_data
//         }
//       };
//     } else {
//       throw new Error('Failed to fetch data');
//     }
//   } catch (error) {
//     // Handle errors or invalid status
//     console.error('Error fetching data:', error);
//     return {
//       redirect: {
//         destination: "/auth",
//         permanent: false,
//       },
//     };
//   }
// }


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

    // @communities.route("/api/communityRecommend", methods=["GET"])

    var recommenddedCommunitiesURL = baseURL_server + "communityRecommend";
    const recommendedCommunities = await fetch(recommenddedCommunitiesURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });
    const recommendedCommunitiesData = await recommendedCommunities.json();

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
              data, community_joined_data, recommendedCommunitiesData,
              recently_accessed_submissions
            }
          };
        }

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

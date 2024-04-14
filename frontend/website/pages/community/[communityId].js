import { React, useEffect } from 'react';
import Head from "next/head";
import jsCookie from 'js-cookie';
import { Paper, Button, IconButton, Skeleton, Tooltip, Typography } from "@mui/material";
import { BASE_URL_CLIENT, BASE_URL_SERVER, GET_COMMUNITY_ENDPOINT, SEARCH_ENDPOINT } from '../../static/constants';
import useCommunityStore from '../../store/communityStore';
import QuickSubmissionBox from '../../components/quickSubmissionBox';
import SearchResult from '../../components/searchresult';
import Grid from "@mui/material/Grid";
import InfiniteScroll from "react-infinite-scroll-component";
import Error from 'next/error';
import useUserDataStore from '../../store/userData';


export default function CommunityHomepage(props) {

    if (props.error) {
        return <Error statusCode={props.errorCode} />
    }

    const { setUserDataStoreProps, userFollowedCommunities } = useUserDataStore();

    const {
        communityId,
        communityName,
        communityDescription,
        isFollowing,
        joined,
        isPublic,
        pinnedSubs,
        communitySubmissions,
        communitySubmissionsLoading,
        page,
        setCommunityStoreProps } = useCommunityStore();

    useEffect(() => {
        getCommunitySubmissions();
        setCommunityStoreProps({ communityId: props.community.id });
        setCommunityStoreProps({ communityName: props.community.name });
        setCommunityStoreProps({ communityDescription: props.community.description });
        setCommunityStoreProps({ isFollowing: props.community.following });
        setCommunityStoreProps({ joined: props.community.joined });
        setCommunityStoreProps({ isPublic: props.community.public });
        setCommunityStoreProps({ pinnedSubs: props.community.pinned_submissions });

    }, [props]);

    const getCommunitySubmissions = async () => {

        var searchURL = BASE_URL_CLIENT + SEARCH_ENDPOINT;
        //   "/search?community=" + community.community_id + "&page=0"
        searchURL += "?community=" + props.community.id + "&page=0";
        const com_submissions = await fetch(searchURL, {
            headers: new Headers({
                Authorization: jsCookie.get("token"),
            }),
        });

        if (com_submissions.status == 200) {
            const data = await com_submissions.json();
            setCommunityStoreProps({ communitySubmissions: data.search_results_page });
            setCommunityStoreProps([communitySubmissionsLoading, false]);

        }
        else {
            console.error("Error fetching submissions");
            setCommunityStoreProps({ communitySubmissions: [] });
            setCommunityStoreProps([communitySubmissionsLoading, true]);

        }
    }

    const loadMoreResults = async () => {
        try {
            const response = await fetch(searchURL + 'search_id=' + data.search_id + '&page=' + page, {
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                }),
            });
            const content = await response.json();
            setCommunityStoreProps([communitySubmissions, ...content.search_results_page]);

            if ((page + 1) % 5 === 0) {
                setCommunityStoreProps([communitySubmissionsLoading, true]);
            } else {
                setCommunityStoreProps([communitySubmissionsLoading, false]);
            }

            if (page !== totalPages) {
                setCommunityStoreProps([page, false]);
            }


        } catch (error) {
            console.log(error);
        }
    };

    const followCommunity = async () => {
        const followCommunityURL = BASE_URL_CLIENT + "followCommunity";

        const data = {
            community_id: communityId,
            command: "follow",
        }

        const res = await fetch(followCommunityURL, {
            method: "POST",
            body: JSON.stringify(data),
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });

        if (res.status === 200) {
            setCommunityStoreProps({ isFollowing: true });
            // update state for userFollowedCommunities
            setUserDataStoreProps({

                userFollowedCommunities: [...userFollowedCommunities,
                {
                    community_id: communityId,
                    name: communityName,
                    description: communityDescription,
                    is_public: isPublic,
                    isFollowing: true,
                    pinned: pinnedSubs,
                }
                ]
            });
        }
        else {
            console.error("Error following community");
        }

    };

    const unfollowCommunity = async () => {
        const followCommunityURL = BASE_URL_CLIENT + "followCommunity";

        const data = {
            community_id: communityId,
            command: "unfollow",
        }

        const res = await fetch(followCommunityURL, {
            method: "POST",
            body: JSON.stringify(data),
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });

        if (res.status === 200) {
            setCommunityStoreProps({ isFollowing: false });
            // update state for userFollowedCommunities
            setUserDataStoreProps({ userFollowedCommunities: userFollowedCommunities.filter(item => item !== communityId) });
        }
        else {
            console.error("Error following community");
        }

    };

    return (
        <div className="container mx-auto p-6">
            <Head>
                <title>{communityName} - TextData</title>
                <link rel="icon" href="/images/tree32.png" />
            </Head>
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">{communityName}</h1>
                    <p className="text-gray-500 mt-1">{communityDescription}</p>
                    {joined ? (
                        <div className="flex items-center text-sm text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            You have joined this community {isPublic && isFollowing ? "and are following it" : ""}
                        </div>
                    ) : (
                        <>

                            <div className="flex items-center text-sm text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                You have not joined this community {isPublic && isFollowing ? "but are following it" : ""}
                            </div>
                            <div>
                                {isPublic && isFollowing ? (
                                    <div className="flex items-center text-sm text-green-600">
                                        <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 focus:outline-none"
                                            onClick={() => { unfollowCommunity() }}>Unfollow</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-sm text-gray-400">
                                        <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 focus:outline-none"
                                            onClick={() => { followCommunity() }}
                                        >Follow</button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </header>
            <section className="pinned-posts mb-2">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Pinned Submissions</h2>
                {pinnedSubs.length > 0 ? (
                    <QuickSubmissionBox submissionData={pinnedSubs} pinned={true} />
                ) : (
                    <p className="font-semibold px-4 text-gray-600">No pinned submissions available.</p>
                )}
            </section>

            <section className="community-submissions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ maxWidth: '100ch' }}>
                    <h2 className="text-2xl font-semibold my-4 text-gray-800">Community Submissions</h2>

                    {!communitySubmissionsLoading && communitySubmissions ?
                        <Grid container
                            direction={'column'}
                            borderTop={"1px solid lightgray"}
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}>
                            <InfiniteScroll
                                dataLength={communitySubmissions.length}
                                next={loadMoreResults}
                                hasMore={page % 5 === 0 ? false : true}
                                loader="" >
                                <Grid item margin={'auto'}>
                                    {communitySubmissions !== undefined && communitySubmissions.length !== 0 &&
                                        communitySubmissions.map(function (d, idx) {
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
                                                        username={d.username}
                                                    ></SearchResult>
                                                </div>
                                            );
                                        })}
                                </Grid>
                            </InfiniteScroll>
                        </Grid>
                        :
                        <>
                            <Tooltip title={<Typography>Loading</Typography>} placement="top">
                                <Skeleton
                                    animation="wave"
                                    variant="rectangular"
                                    width={"100ch"}
                                    height={"100vh"}
                                />
                            </Tooltip>
                        </>}
                </div>
            </section>

        </div>

    );
}

export async function getServerSideProps(context) {

    const { communityId } = context.params;

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
        try {

            var communityHomePageURL = BASE_URL_SERVER + "community/" + communityId;

            const res = await fetch(communityHomePageURL, {
                headers: new Headers({
                    Authorization: context.req.cookies.token,
                }),
            });

            const data = await res.json();

            if (res.status === 200) {
                return {
                    props: {
                        community: data,
                    },
                };
            } else {
                return {
                    props: {
                        error: data.message,
                        errorCode: res.status,
                    },
                };
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            return { props: { error: "Error fetching data. Please try again later" } };
        }
    }
}

"use client"

import * as React from "react"
import jsCookie from "js-cookie"
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../components/ui/ui/collapsible"

import { Button } from "../components/ui/ui/button"
import useUserDataStore from "../store/userData";
import useQuickAccessStore from "../store/quickAccessStore";
import useSubmissionStore from "../store/submissionStore";
import { BASE_URL_CLIENT, GET_COMMUNITY_ENDPOINT, SEARCH_ENDPOINT, WEBSITE_URL } from "../static/constants";
import { Tooltip, Typography } from "@mui/material";


export function CollapsibleCommunity({ community }) {
    const [isOpen, setIsOpen] = React.useState(false);

    const { userCommunitySubs, communityData, setcommunityData, setUserCommunitySubs } = useQuickAccessStore();
    const { userCommunities, user_id } = useUserDataStore();

    const handleCommunityClick = async () => {

        // added source=sidebar to the url
        const res = await fetch(BASE_URL_CLIENT + SEARCH_ENDPOINT + "?source=sidebar&own_submissions=True&community=" + community.community_id, {
            method: "GET",
            headers: new Headers({
                Authorization: jsCookie.get("token"),
            }),
        });
        const response = await res.json();
        if (res.status == 200) {
            var temp = userCommunitySubs;
            if (response.search_results_page.length > 0) { temp[community.community_id] = response.search_results_page; }
            else {
                temp[community.community_id] = [{ explanation: "No submissions made", submission_id: null }];
            }
            setUserCommunitySubs(temp);
        } else {
            console.log('error fetching user submissions')
        }
    }

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full space-y-1"
        >
            <div className="flex items-center justify-between space-x-4 px-4">
                {/* <h4 onClick={() => { window.open(WEBSITE_URL + SEARCH_ENDPOINT + '?community=' + community.community_id + '&page=0', "_blank"); }} className="text-sm font-semibold underline">
                    {community.name}
                </h4> */}
                <Tooltip title={'Go To Community'}>
                    <a
                        href={WEBSITE_URL + SEARCH_ENDPOINT + '?community=' + community.community_id + '&page=0'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                            fontWeight: "500",
                            fontSize: "0.8125rem",
                            lineHeight: "1.75",
                            letterSpacing: "0.02857em",
                            textTransform: "uppercase",
                            color: "#1976d2",
                            padding: "3px 7px",
                            marginRight: "5px",
                            textDecoration: "none",
                            background: "aliceblue",
                        }}
                    >
                        {community.name}
                    </a>
                </Tooltip>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleCommunityClick}>
                        <UnfoldMoreIcon className="h-4 w-4" style={{
                            borderRadius: "50%",
                            color: "#1976d2",
                            textDecoration: "none",
                            background: "aliceblue",
                        }} />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1" style={{ maxWidth: '250px', }}>

                {userCommunitySubs[community.community_id]?.map((sub) => (
                    sub.submission_id ?
                        <Tooltip title={sub.explanation}>
                            <div
                                onClick={() => { window.open(WEBSITE_URL + "submissions/" + sub.submission_id, "_blank"); }}
                                className="px-5 py-1 text-xs link-style">
                                {sub.explanation.substring(0, 24)}
                                {sub.explanation.length > 24 ? "..." : ""}
                            </div>
                        </Tooltip>
                        :
                        // no submisisons
                        <Typography
                            variant="body2"
                            className="px-5 py-1 text-xs">
                            {sub.explanation}
                        </Typography>

                ))
                }
            </CollapsibleContent>
        </Collapsible>
    );
}


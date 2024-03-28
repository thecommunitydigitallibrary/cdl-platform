import { React, useState, useEffect } from 'react';
import Tooltip from '@material-ui/core/Tooltip';

const CommunityDisplay = (props) => {
    const websiteURL = process.env.NEXT_PUBLIC_FROM_CLIENT;

    const searchEndpoint = "search";
    const [usersCommunities, setUsersCommunities] = useState({});
    const [communitiesPartOf, setCommunitiesPartOf] = useState({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedData = JSON.parse(window.localStorage.getItem('dropdowndata'));
            const initialCommunities = storedData && storedData.community_info ? storedData.community_info : [];

            setUsersCommunities(initialCommunities);

            const initialCommunitiesMap = initialCommunities.reduce((acc, community) => {
                acc[community.community_id] = community.name;
                return acc;
            }, {});

            setCommunitiesPartOf(initialCommunitiesMap);
        }
    }, []);

    return (<>
        {(props.k === 'all') ?
            <Tooltip title="All Communities">
                <a href={websiteURL + 'communities'} target="_blank" rel="noopener noreferrer" style={{
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
                }}>
                    All your Communities
                </a>

            </Tooltip >
            :
            <Tooltip title={communitiesPartOf[props.k]}>
                <a
                    href={websiteURL + searchEndpoint + "?community=" + props.k + "&page=0"}
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
                    {communitiesPartOf[props.k]}
                </a>
            </Tooltip>
        }</>
    );
};

export default CommunityDisplay;
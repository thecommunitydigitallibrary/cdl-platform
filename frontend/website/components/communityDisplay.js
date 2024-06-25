import { React, useState, useEffect } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import useUserDataStore from '../store/userData';

const CommunityDisplay = (props) => {
    const websiteURL = process.env.NEXT_PUBLIC_FROM_CLIENT;

    const searchEndpoint = "search";
    const [usersCommunities, setUsersCommunities] = useState([]);
    const [communitiesPartOf, setCommunitiesPartOf] = useState({});
    const { userCommunities } = useUserDataStore();


    useEffect(() => {


        const storedData = JSON.parse(window.localStorage.getItem('dropdowndata'));
        const initialCommunities = storedData && storedData.community_info ? storedData.community_info : [];
        setUsersCommunities(initialCommunities);

        // this is the case where we pass a specific community to the render
        // used when a user searches/views a public community and they have not joined
        // so the community will not be mapped in their account's communities
        if (props.name !== 'undefined' || props.name != 'all') {
            var initialCommunitiesMap = {}
            initialCommunitiesMap[props.k] = props.name
            setCommunitiesPartOf(initialCommunitiesMap);
        } else {
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
                <a href={websiteURL + 'community'} target="_blank" rel="noopener noreferrer" style={{
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
                    href={websiteURL + "community/" + props.k}
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
                    {communitiesPartOf[props.k] || props.name}
                </a>
            </Tooltip>
        }</>
    );
};

export default CommunityDisplay;
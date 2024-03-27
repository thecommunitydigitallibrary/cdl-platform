import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';

const CommunityDisplay = (props) => {
    const websiteURL = process.env.NEXT_PUBLIC_FROM_CLIENT;

    const searchEndpoint = "search";

    return (
        <Tooltip title={props.communities_part_of[props.k]}>
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
                {props.communities_part_of[props.k].length > 25 ?
                    props.communities_part_of[props.k].slice(0, 23) + ".."
                    :
                    props.communities_part_of[props.k]}
            </a>
        </Tooltip>
    );
};

export default CommunityDisplay;
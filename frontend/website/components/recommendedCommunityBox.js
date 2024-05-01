import { Button, Tooltip } from '@mui/material';
import React from 'react';
import { WEBSITE_URL } from '../static/constants';

const RecommendedCommunityBox = ({ recommendedCommunitiesData }) => {
    return (
        <div>

            {recommendedCommunitiesData.map((community, index) => (
                <div key={index} className="inline-block mr-2">
                    <Tooltip title={'Go to Community'}>
                        <a
                            href={WEBSITE_URL + "community/" + community.id}
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
                </div>
            ))}


        </div>
    );
}

export default RecommendedCommunityBox;
import React from 'react';
import IconButton from '@mui/material/IconButton';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import { Lightbulb } from '@mui/icons-material';
import useUserDataStore from '../store/userData';
import { BASE_URL_CLIENT, SEARCH_ENDPOINT } from '../static/constants';
import jsCookie from 'js-cookie';

import { CollapsibleDemo } from './communitycollapsible';


export default function SideNav() {
    const { userCommunities, fetchUserCommunities } = useUserDataStore();

    const getSideBarData = async () => {

        for (let i = 0; i < userCommunities.length; i++) {
            const res = await fetch(BASE_URL_CLIENT + SEARCH_ENDPOINT + "?own_submissions=True&community=" + userCommunities[i].community_id, {
                method: "GET",
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                }),
            });
            const response = await res.json();
            if (res.status == 200) {
                console.log("success for " + userCommunities[i].name)
                console.log(response)
            } else {
                console.log(response)
            }
        }
    }

    return (
        <>

            <div>
                <h3 className="text-sm font-bold">
                    Quick Access
                </h3>
            </div>

            <div style={{ marginBottom: '10px' }}></div>

            <CollapsibleDemo />

            <div style={{ marginBottom: '10px' }}></div>

            <CollapsibleDemo />

            <div style={{ marginBottom: '10px' }}></div>

            <CollapsibleDemo />

            <IconButton
                variant="extended"
                onClick={() => {
                    getSideBarData();
                }}
                sx={{
                    width: '10px',
                    height: '10px',
                    left: '50%',
                    transform: 'translateY(-50%) ',
                    border: 'solid',
                    color: '#1976d2',
                    "&:hover": {
                        backgroundColor: "#1976d2",
                        color: 'white'
                    }
                }}
            >
                <ExpandCircleDownIcon color="inherit" />
            </IconButton >
        </>
    );
}

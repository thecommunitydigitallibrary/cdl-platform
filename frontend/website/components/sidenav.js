import React from 'react';
import IconButton from '@mui/material/IconButton';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import { Lightbulb } from '@mui/icons-material';
import useUserDataStore from '../store/userData';
import { BASE_URL_CLIENT, SEARCH_ENDPOINT } from '../static/constants';
import jsCookie from 'js-cookie';

import { CollapsibleCommunity } from './communitycollapsible';
import { Grid, Paper } from '@mui/material';
import useQuickAccessStore from '../store/quickAccessStore';


export default function SideNav() {
    const { userCommunities, fetchUserCommunities } = useUserDataStore();
    const { communityData } = useQuickAccessStore();
    const { isOpen, setIsOpen } = useQuickAccessStore();

    return (
        <div>
            {!isOpen ?
                <div>
                    <IconButton
                        variant="extended"
                        onClick={() => {
                            // getSideBarData();
                            setIsOpen(true);
                        }}
                        sx={{
                            position: 'fixed',
                            width: '10px',
                            height: '10px',
                            left: '0',
                            top: '50%',
                            transform: 'translateY(-50%) rotate(-90deg)',
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
                </div>
                :
                <div style={{
                    minWidth: '250px',

                    // border: 'none',
                    // borderRight: '1px solid #e0e0e0',
                }}>
                    <Grid container direction={'column'}>

                        <Grid item textAlign={'center'}>
                            <h5 className="text-sm font ">
                                Your Recent Submissions
                            </h5>
                        </Grid>

                        <Grid item>
                            {communityData.map((item, index) => (
                                <div key={index}>
                                    <div style={{ marginBottom: '2px' }}></div>
                                    <CollapsibleCommunity community={item} />
                                </div>
                            ))}

                        </Grid>

                    </Grid>

                    <IconButton
                        variant="extended"
                        onClick={() => {
                            // getSideBarData();
                            setIsOpen(false);
                        }}
                        zindex={50}
                        sx={{
                            position: 'fixed',
                            width: '10px',
                            height: '10px',
                            left: '241px',
                            top: '50%',
                            transform: 'translateY(-50%) rotate(90deg)',
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
                </div>
            }
        </div>
    );
}

import { React, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import { Lightbulb } from '@mui/icons-material';
import useUserDataStore from '../store/userData';
import jsCookie from 'js-cookie';

import { CollapsibleCommunity } from './communitycollapsible';
import { Divider, Grid, Paper } from '@mui/material';
import useQuickAccessStore from '../store/quickAccessStore';


export default function SideNav() {
    const { userCommunities, isLoggedOut, setLoggedOut, setUserDataStoreProps } = useUserDataStore();
    const { communityData } = useQuickAccessStore();
    const { isOpen, setIsOpen } = useQuickAccessStore();

    return (
        <div>
            {
                (!isOpen) ?
                    <div>
                        <IconButton
                            variant="extended"
                            onClick={() => {
                                // getSideBarData();
                                console.log(isOpen)
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
                    <div

                        style={{
                            width: '300px',
                            // height: '90vh',
                            maxHeight: '900px',
                            overflowY: 'auto',
                            scrollbarWidth: 'thin', scrollbarColor: 'gray white'
                        }}>
                        <Grid container direction={'column'}>

                            <Grid item textAlign={'center'}>
                                <h5 className="text-sm font">
                                    Your Submissions
                                </h5>
                                <Divider />
                            </Grid>

                            <Grid item>
                                {!isLoggedOut && communityData.map((item, index) => (
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
                                left: '288px',
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

import Paper from "@mui/material/Paper";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import Box from '@mui/material/Box';
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

export default function RecentlyAccessedSubmissions(recently_accessed_submissions) {
    //console.log(recently_accessed_submissions);
    return (
        <Grid
            container
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            //width={'65%'}
            maxWidth={'60%'}
        >
            
            <Grid item width={'95%'}>
                <h4>Recently Accessed Submissions</h4>
            </Grid>

            <Grid item width={'100%'} marginY="0.5%">
                <Divider sx={{ height: '100px', border: '0.5px'}} />
            </Grid>
            
            <Box
                sx={{
                    width: '90%',
                    //maxWidth: '1450px',
                    flex: '1 1 auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    '& > :not(style)': {
                        m: 1,
                        width: 342,
                        height: 128,
                    },
                }}
            >
                <Paper
                    elevation={0}
                    id={"0"}
                    sx={{
                        //width: "25%",
                        padding: "20px",
                        border: "1px solid #ddd",
                        //margin: "15px 10px",
                        //marginX: "2%",
                        wordBreak: 'break-word'
                    }}
                >
                    <div style={{ display: "flex" }}>
                        <div style={{ margin: "0px 0px 0px 0px" }}>
                            Hi0
                        </div>
                    </div>
                </Paper>
                <Paper
                    elevation={0}
                    id={"0"}
                    sx={{
                        //width: "15%",
                        padding: "20px",
                        border: "1px solid #ddd",
                        //margin: "15px 10px",
                        //marginX: "2%",
                        wordBreak: 'break-word'
                    }}
                >
                    <div style={{ display: "flex" }}>
                        <div style={{ margin: "0px 0px 0px 0px" }}>
                            Hi1
                        </div>
                    </div>
                </Paper>
                <Paper
                    elevation={0}
                    id={"2"}
                    sx={{
                        //width: "15%",
                        padding: "20px",
                        border: "1px solid #ddd",
                        //margin: "15px 10px",
                        //marginX: "2%",
                        wordBreak: 'break-word'
                    }}
                >
                    <div style={{ display: "flex" }}>
                        <div style={{ margin: "0px 0px 0px 0px" }}>
                            Hi2
                        </div>
                    </div>
                </Paper>
                <Paper
                    elevation={0}
                    id={"3"}
                    sx={{
                        //width: "15%",
                        padding: "20px",
                        border: "1px solid #ddd",
                        //margin: "15px 10px",
                        //marginX: "2%",
                        wordBreak: 'break-word'
                    }}
                >
                    <div style={{ display: "flex" }}>
                        <div style={{ margin: "0px 0px 0px 0px" }}>
                            Hi3
                        </div>
                    </div>
                </Paper>
                <Paper
                    elevation={0}
                    id={"3"}
                    sx={{
                        //width: "15%",
                        padding: "20px",
                        border: "1px solid #ddd",
                        //margin: "15px 10px",
                        //marginX: "2%",
                        wordBreak: 'break-word'
                    }}
                >
                    <div style={{ display: "flex" }}>
                        <div style={{ margin: "0px 0px 0px 0px" }}>
                            Hi3
                        </div>
                    </div>
                </Paper>

            </Box>

        </Grid>
    );
}

{/* <Tooltip title={props.explanation}>
                        <a
                            style={{
                                fontSize: "20px", maxWidth: '100%', display: '-webkit-box', WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: '1', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}
                            href={props.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {props.explanation}
                        </a>
                    </Tooltip> */}

                    //<Divider sx={{ height: '100px', border: '0.5px'}} />
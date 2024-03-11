import Paper from "@mui/material/Paper";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import Box from '@mui/material/Box';
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

export default function RecentlyAccessedSubmissions({ rec_acc_sub_data }) {
    return (
        <Grid
            container
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            maxWidth={'60%'}
        >
            <Grid item width={'95%'}>
                <h4>Recently Accessed Submissions</h4>
            </Grid>
            <Box
                sx={{
                    width: '90%',
                    flex: '1 1 auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    '& > :not(style)': {
                        m: 1,
                        width: 342,
                        height: 64,
                    },
                }}
            >
                {rec_acc_sub_data.map((item, index) => (
                    <Paper
                        key={index}
                        id={index}
                        elevation={0}
                        sx={{
                            padding: "20px",
                            border: "1px solid #ddd",
                            wordBreak: 'break-word'
                        }}
                    >
                        <a href={item.submission_url}>
                            <div style={{
                                display: "flex", alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}>
                                <div title={item.explanation} style={{ margin: "0px 0px 0px 0px" }}>
                                    {item.explanation.length >= 40 ? item.explanation.substring(0, 38) + '...' : item.explanation}
                                </div>
                            </div>
                        </a>
                    </Paper>
                ))}
            </Box>
        </Grid>
    );
}

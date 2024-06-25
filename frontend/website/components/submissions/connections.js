import { React, useEffect, useState } from 'react';
import { Typography, Grid, Paper, Box } from '@mui/material';
import SearchResult from '../searchresult';
import jsCookie from 'js-cookie';
import useSubmissionStore from '../../store/submissionStore';
import { Stack } from '@mui/system';
import { Tooltip } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

export default function Connections({ submissionDataResponse, id }) {
    const { submissionId, submissionIncomingConnections, setSubmissionProps } = useSubmissionStore();

    useEffect(() => {
    }, [submissionIncomingConnections]);

    useEffect(() => {
        // getIncomingConnections();
    }, [submissionId])

    return (
        <>
            <Stack flexDirection='column' alignItems={'center'}>
                <Typography variant='h5' gutterBottom>
                    Mentions {" "}

                    <Tooltip title="Submissions that contain this submission's ID">
                        <InfoOutlined fontSize="xs" />
                    </Tooltip>
                </Typography>


                <Grid container rowSpacing={1} columnSpacing={1} justifyContent={'space-between'}>

                    <Grid item style={{ padding: '3ch' }} >

                        {submissionIncomingConnections ?
                            (<Box display="flex" flexDirection="column" gap={1}>
                                {submissionIncomingConnections.map((d, index) => (
                                    <SearchResult
                                        search_idx={index}
                                        redirect_url={d.redirect_url}
                                        display_url={d.display_url}
                                        submission_id={d.submission_id}
                                        description={d.description}
                                        title={d.title}
                                        hashtags={d.hashtags}
                                        time={d.time}
                                        communities_part_of={d.communities_part_of}
                                        auth_token={jsCookie.get('token')}
                                        paperWidth={'100%'}
                                        paperMarginX={'0%'}
                                    ></SearchResult>

                                ))}
                            </Box>
                            ) : (
                                <Box>
                                    <Typography variant='body2'>No incoming connections found.</Typography>
                                </Box>
                            )}

                    </Grid>

                    {/* {submissionIncomingConnections && renderConnections(submissionOutgoingConnections, 'Mentions')} */}
                </Grid>
            </Stack>
        </>
    );
}

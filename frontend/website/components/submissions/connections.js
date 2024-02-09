import { React, useEffect, useState } from 'react';
import { Typography, Grid, Paper, Box } from '@mui/material';
import SearchResult from '../searchresult';
import jsCookie from 'js-cookie';
import useSubmissionStore from '../../store/submissionStore';
import { Stack } from '@mui/system';
import { Tooltip } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { BASE_URL_CLIENT, BASE_URL_SERVER, SEARCH_ENDPOINT } from '../../static/constants';

export default function Connections({ submissionDataResponse, id }) {
    const { submissionId, submissionIncomingConnections, submissionOutgoingConnections, setSubmissionProps } = useSubmissionStore();
    const [count, setCount] = useState(0);

    useEffect(() => {
    }, [submissionIncomingConnections]);

    useEffect(() => {
        console.log('called :' + count)
        console.log(submissionId)
        setCount(count + 1);
        getIncomingConnections();
    }, [submissionId])

    async function getIncomingConnections() {

        // var searchURL = BASE_URL_SERVER + SEARCH_ENDPOINT;

        var searchURL = BASE_URL_CLIENT + SEARCH_ENDPOINT + "?";

        if (id) {
            searchURL += "query=" + encodeURIComponent(submissionId);

            searchURL += "&community=" + "all";

            searchURL += "&page=0";
        }
        // else {
        //     searchURL += "query=" + "";
        // }


        const res = await fetch(searchURL, {
            headers: new Headers({
                Authorization: jsCookie.get('token'),
            }),
        });

        if (res.status == 200) {
            console.log(res)
            const data = await res.json();
            setSubmissionProps({ submissionIncomingConnections: data.search_results_page })
        } else {
            console.log(res.status)
        }

    }

    return (
        <>
            <Stack flexDirection='column' alignItems={'center'}>
                <Typography variant='h4' gutterBottom>
                    Mentions
                </Typography>

                <Grid container rowSpacing={1} columnSpacing={1} justifyContent={'space-between'}>

                    <Grid item style={{ padding: '3ch' }} >
                        {/* style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }} */}
                        <Typography variant='h6' gutterBottom>

                            {"All submissions that mention this one" + " "}

                            <Tooltip title="All submissions that mention this one ">
                                <InfoOutlined fontSize="xs" />
                            </Tooltip>
                        </Typography>

                        {submissionIncomingConnections ?
                            (<Box display="flex" flexDirection="column" gap={2}>
                                {submissionIncomingConnections.map((d, index) => (
                                    <Paper key={index} elevation={3} style={{ padding: '10px' }}>

                                        <SearchResult
                                            search_idx={index}
                                            redirect_url={d.redirect_url}
                                            display_url={d.display_url}
                                            submission_id={d.submission_id}
                                            result_hash={d.result_hash}
                                            highlighted_text={d.highlighted_text}
                                            explanation={d.explanation}
                                            hashtags={d.hashtags}
                                            time={d.time}
                                            communities_part_of={d.communities_part_of}
                                            auth_token={jsCookie.get('token')}
                                            show_relevant={true}
                                            paperWidth={'100%'}
                                            paperMarginX={'0%'}
                                        ></SearchResult>
                                    </Paper>
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

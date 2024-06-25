import { React, useEffect, useState } from 'react';
import { Typography, Grid, Paper, Box } from '@mui/material';
import SearchResult from '../searchresult';
import jsCookie from 'js-cookie';
import { Stack } from '@mui/system';
import { Tooltip } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { BASE_URL_CLIENT } from '../../static/constants';

export default function SubmissionRecommendations({ id, target }) {


    const [recommendations, setRecommendations] = useState([]);
    const [questions, setQuestions] = useState([]);


    const callRecAPI = async (question_text) => {
        const res = await fetch(BASE_URL_CLIENT + "search/bing?query=" + question_text, {
            method: "GET",
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        return await res.json();
    }

    const callQuestionsAPI = async (submission_id) => {
        const res = await fetch(BASE_URL_CLIENT + "generate/questions_from_submission?sub_id=" + submission_id, {
            method: "GET",
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        return await res.json();
    }
    

    const getQuestions = async () => {
        const response = await callQuestionsAPI(id);
        if (response.status === "ok") {
            setQuestions(response.data.questions);
        } else {
            console.log(response);
        }
    }

    const getRecommendations = async (questionText) => {
        const response = await callRecAPI(questionText);
        if (response.status === "ok") {
            setRecommendations(response.data.results);
        } else {
            console.log(response);
        }
    }


    useEffect(() => {
        getQuestions();
    }, []);

    return (
        <>
            <Stack flexDirection='column' alignItems={'center'}>
                <Typography variant='h5' gutterBottom>
                    Recommendations {" "}

                    <Tooltip title="Questions that you may have based on the submission.">
                        <InfoOutlined fontSize="xs" />
                    </Tooltip>
                </Typography>


                <Grid container rowSpacing={1} columnSpacing={1} justifyContent={'space-between'}>

                    <Grid item style={{ padding: '3ch' }} >

                        {questions ?
                            (<Box display="flex" flexDirection="column" gap={1}>
                                {questions.map((d, index) => (

                                    <button onClick={() => getRecommendations(d)}>{d}</button>

                                ))}
                            </Box>
                            ) : (
                                <Box>
                                    <Typography variant='body2'>No generated questions.</Typography>
                                </Box>
                        )}

                        {recommendations ?
                            (<Box display="flex" flexDirection="column" gap={1}>
                                {recommendations.map((d, index) => (

                                    <SearchResult
                                        search_idx={index}
                                        redirect_url={d.redirect_url}
                                        display_url={d.display_url}
                                        submission_id={d.submission_id}
                                        result_hash={d.result_hash}
                                        description={d.description}
                                        title={d.title}
                                        hashtags={d.hashtags}
                                        time={d.time}
                                        communities_part_of={d.communities_part_of}
                                        auth_token={jsCookie.get('token')}
                                        show_relevant={true}
                                        paperWidth={'100%'}
                                        paperMarginX={'0%'}
                                    ></SearchResult>

                                ))}
                            </Box>
                            ) : (
                                <Box>
                                    <Typography variant='body2'>Click on a question to see results!.</Typography>
                                </Box>
                            )}
                    </Grid>
                </Grid>
            </Stack>
        </>
    )
}

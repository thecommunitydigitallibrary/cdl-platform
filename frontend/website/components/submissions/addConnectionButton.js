import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import EditIcon from '@material-ui/icons/Edit';
import Slide from '@material-ui/core/Slide';
import { Typography } from '@mui/material';
import SubmissionForm from '../forms/submissionForm';
import useSubmissionStore from '../../store/submissionStore';
import { ReplyAllOutlined } from '@mui/icons-material';
import { GET_SUBMISSION_ENDPOINT, WEBSITE_URL } from '../../static/constants';

const AddConnectionsButton = ({ setSelectedOption }) => {
    const [isTextBoxVisible, setTextBoxVisible] = useState(false);
    const { submissionTitle, submissionId, submissionCommunitiesNameMap, submissionRedirectUrl, submissionDisplayUrl, setSubmissionProps }
        = useSubmissionStore();

    const { connectionDescription, setConnectionDescription } =
        useState(`[${submissionTitle}](${WEBSITE_URL}+'submissions/'+${submissionId}})`);
    // useState(`[[${submissionTitle}]]` + ' ');

    const handleButtonClick = () => {
        // setSubmissionProps({ submissionMode: "create" });
        setTextBoxVisible(true);
    };

    const handleViewConnectionsClick = () => {
        setSelectedOption('graph');
    }

    return (
        <>
            <Box minWidth={'750px'}>
                <Button
                    onClick={handleButtonClick}
                    variant="contained"
                    size="small"
                    endIcon={<ReplyAllOutlined />}
                    style={{ textTransform: 'none' }}
                >
                    Make Submission with Mention
                </Button>

                <Slide direction="left" in={isTextBoxVisible} mountOnEnter unmountOnExit>
                    <div style={{ padding: 2 }}>
                        <SubmissionForm
                            isAConnection={true}
                            isTextBoxVisible={isTextBoxVisible}
                            setTextBoxVisible={setTextBoxVisible}
                            source_url=""
                            title=""
                            description={`[${submissionTitle}](${WEBSITE_URL}submissions/${submissionId})`}
                            communitiesNameMap={submissionCommunitiesNameMap}
                        />

                    </div>
                </Slide>
            </Box>
        </>
    );

};

export default AddConnectionsButton;

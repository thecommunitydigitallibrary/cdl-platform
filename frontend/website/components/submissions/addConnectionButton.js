import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import EditIcon from '@material-ui/icons/Edit';
import Slide from '@material-ui/core/Slide';
import { Typography } from '@mui/material';
import SubmissionForm from '../forms/submissionForm';
import useSubmissionStore from '../../store/submissionStore';
import { ReplyAllOutlined } from '@mui/icons-material';

const AddConnectionsButton = ({ setSelectedOption }) => {
    const [isTextBoxVisible, setTextBoxVisible] = useState(false);
    const { submissionTitle, submissionCommunitiesNameMap, submissionRedirectUrl, setSubmissionProps }
        = useSubmissionStore();

    const { connectionDescription, setConnectionDescription } =
        useState(`Reply to [${submissionTitle}](${submissionRedirectUrl})`);
    // useState(`Reply to [[${submissionTitle}]]` + ' ');

    const handleButtonClick = () => {
        // setSubmissionProps({ submissionMode: "create" });
        setTextBoxVisible(true);
    };

    const handleViewConnectionsClick = () => {
        setSelectedOption('graph');
    }

    return (
        <>
            <Box>
                <Button
                    onClick={handleButtonClick} variant="contained" size="small" endIcon={<ReplyAllOutlined />}>
                    Add Incoming Connection

                </Button>

                <Slide direction="left" in={isTextBoxVisible} mountOnEnter unmountOnExit>
                    <div style={{ padding: 2 }}>
                        <SubmissionForm
                            isAConnection={true}
                            isTextBoxVisible={isTextBoxVisible}
                            setTextBoxVisible={setTextBoxVisible}
                            source_url=""
                            title=""
                            description={`Reply to [${submissionTitle}](${submissionRedirectUrl})`}
                            communitiesNameMap={submissionCommunitiesNameMap}
                        />

                    </div>
                </Slide>
            </Box>
        </>
    );

};

export default AddConnectionsButton;

import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import EditIcon from '@material-ui/icons/Edit';
import Slide from '@material-ui/core/Slide';
import { Typography } from '@mui/material';
import SubmissionForm from '../forms/submissionForm';
import useSubmissionStore from '../../store/submissionStore';
import { ReplyAllOutlined } from '@mui/icons-material';
import { WEBSITE_URL } from '../../static/constants';

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

    return (
        <>
            <Box style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Button
                    className='my-1 bg-blue-500 hover:bg-blue-700 cursor-pointer'
                    onClick={handleButtonClick}
                    variant="contained"
                    size="small"
                    endIcon={<ReplyAllOutlined />}
                    style={{ textTransform: 'none' }}
                >
                    Make Submission with Mention
                </Button>

                <Slide
                    direction="right"
                    in={isTextBoxVisible}
                    mountOnEnter
                    unmountOnExit
                    style={{
                        width: '100%',
                        padding: 2,
                        marginTop: 10,
                        alignSelf: 'flex-end',
                    }}
                >
                    <div>
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

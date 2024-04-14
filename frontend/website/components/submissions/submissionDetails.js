import jsCookie from "js-cookie";
import { ContentCopy, Delete, Save, Edit, CloseOutlined, Close } from '@mui/icons-material';
import { Box, Checkbox, FormControl, IconButton, InputLabel, Link, ListItemText, Tooltip, Menu, MenuItem, OutlinedInput, Select, Stack, Typography, Grid, Button, ButtonGroup, Snackbar, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField } from '@mui/material';
import { React, useState, useEffect } from 'react';
import { BASE_URL_CLIENT, GET_SUBMISSION_ENDPOINT, SEARCH_ENDPOINT, WEBSITE_URL } from '../../static/constants';
import SubmissionStatistics from "./stats";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocalLibraryRoundedIcon from '@mui/icons-material/LocalLibraryRounded';
import useSubmissionStore from "../../store/submissionStore";
import useSnackbarStore from "../../store/snackBar";
import Alert from '@mui/material/Alert';
import Router from 'next/router';

export default function SubmissionDetails(subData) {

    const {
        submissionStats,
        submissionTitle,
        submissionDescription,
        submissionSourceUrl,
        submissionIsAnonymous,
        submissionMode,
        submissionCanDelete,
        originalDescription,
        originalTitle,
        originalSourceUrl,
        submissionType,
        submissionId,
        submissionCommunitiesNamesList,
        submissionRemoveCommunityID,
        submissionSaveCommunityID,
        submissionRemoveCommunityIDList,
        submissionCommunitiesNameMap,
        submissionSaveCommunityIDList,
        submissionUsername,
        submissionDisplayUrl,
        submissionDate,
        submissionRedirectUrl,
        isAConnection,
        submissionHashtags,
        setSubmissionProps,
        hasUnsavedChanges,
    } = useSubmissionStore();

    const { isSnackBarOpen, snackBarMessage, snackBarSeverity, openSnackbar, closeSnackbar, setSnackBarProps } = useSnackbarStore();
    const submissionData = subData.data;

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("error");
    const [openDelete, setOpenDelete] = useState(false);


    const submitRelevanceJudgements = async function (event, rel) {
        event.preventDefault();
        try {
            let URL = BASE_URL_CLIENT + "submitRelJudgments";
            let judgement = {};
            const submission_id = await submissionId;
            judgement[submissionId] = rel;
            const res = await fetch(URL, {
                method: "POST",
                body: JSON.stringify(judgement),
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                    "Content-Type": "application/json",
                }),
            });
            const response = await res.json();
            if (res.status == 200) {
                setSeverity("success");
                setMessage(response.message);
                handleClick();
                return response.message;
            } else {
                setSeverity("error");
                setMessage(response.message);
                handleClick();
                throw new new Error(response.message);
            }
        }
        catch (error) {
            throw new Error("Failed to submit judgment" || error);
        }
    };

    const fetchSubmissionStats = async () => {
        try {
            const URL = BASE_URL_CLIENT + "fetchSubmissionStats?submissionId=" + submissionId;
            const response = await fetch(URL, {
                method: "GET",
                headers: {
                    Authorization: jsCookie.get("token"),
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch submission stats: ${response.status}`);
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching submission stats:', error);
        }
    };

    const fetchSubmissionJudgement = async (submissionId) => {
        try {
            const URL = BASE_URL_CLIENT + "fetchSubmissionJudgement?submissionId=" + submissionId;
            const response = await fetch(URL, {
                method: "GET",
                headers: {
                    Authorization: jsCookie.get("token"),
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch submission judgement: ${response.status}`);
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching submission judgement:', error);
        }
    };
    const mapCommunitiesToNames = (commResponse) => {
        let idNameMap = {};
        for (var key in commResponse) {
            idNameMap[key] = commResponse[key].name;
        }
        return idNameMap;
    };
    // const [communityNamesList, setCommunityNamesList] = useState([]);
    const ITEM_HEIGHT = 40;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5,
                width: '23ch',
            },
        },
    };

    const otherMenuOptions = [
        'Report submission',
    ];

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setOpen(false);
    };

    const handleCloseDelete = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setOpenDelete(false);
    };

    const deleteSubmissionEntirely = async (event) => {

        var submissionId = submissionData.submission.submission_id;
        var URL = BASE_URL_CLIENT + 'submission/' + submissionId;

        if (subData.data.submission.can_delete) {
            const res = await fetch(URL, {
                method: "DELETE",
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                }),
            });

            const response = await res.json();

            if (response.status == "ok") {
                setSnackBarProps({ isSnackBarOpen: true })
                setSnackBarProps({ snackBarSeverity: 'success' });
                setSnackBarProps({ snackBarMessage: 'Deleted submission from all communities successfully!' })

                window.close()
            }
        } else {
            setSnackBarProps({ isSnackBarOpen: true })
            setSnackBarProps({ snackBarSeverity: 'error' });
            setSnackBarProps({ snackBarMessage: 'Only the original poster of this submission can delete this.' })
        }
        handleCloseDelete()
    };


    const handleClickDelete = () => {
        setOpenDelete(true);
    };

    async function copyPageUrl() {
        const linkToCopy = WEBSITE_URL + 'submissions/' + submissionId;
        try {
            await navigator.clipboard
                .writeText(linkToCopy)
                .then(() => {
                    setSnackBarProps({ snackBarSeverity: 'success' })
                    openSnackbar('URL copied to clipboard!', 'success')
                })
                .catch(() => {

                    setSnackBarProps({ snackBarSeverity: 'error' })
                    openSnackbar("Error copying URL", 'error');
                });
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    }

    const getSubmissionData = () => {
        if (submissionData.status === "ok") {
            setSubmissionProps({ submissionCommunities: submissionData.submission.communities })
            setSubmissionProps({ submissionCommunitiesNameMap: mapCommunitiesToNames(submissionData.submission.communities) })
            // setCommunityNameMap(mapCommunitiesToNames(submissionData.submission.communities));

            let sharableCommunityIds = [];
            let removableCommnuityIds = [];

            const userCommunityIds = Object.keys(submissionData.submission.communities);

            sharableCommunityIds = userCommunityIds.filter(
                (x) => submissionData.submission.communities[x]["valid_action"] == "save"
            );
            removableCommnuityIds = userCommunityIds.filter(
                (x) => submissionData.submission.communities[x]["valid_action"] == "remove"
            );

            if (submissionSaveCommunityID && sharableCommunityIds.length > 0) { //saveCommunityID
                setSubmissionProps({ submissionSaveCommunityID: sharableCommunityIds })
                // setSaveCommunityID(sharableCommunityIds);
            } else {
                setSubmissionProps({ submissionSaveCommunityID: [] })
                // setSaveCommunityID([]);
            }

            if (submissionRemoveCommunityID && removableCommnuityIds.length > 0) { //removeCommunityID
                setSubmissionProps({ submissionRemoveCommunityID: removableCommnuityIds })
                // setRemoveCommunityID(removableCommnuityIds);
            } else {
                setSubmissionProps({ submissionRemoveCommunityID: [] })
                // setRemoveCommunityID([]);
            }
        }

        if (submissionData.submission && submissionData.submission.communities_part_of) {
            var communityNamesList = Object.keys(
                submissionData.submission.communities_part_of
            ).map(function (key) {
                return (
                    // <Tooltip title={"Go to " + submissionData.submission.communities_part_of[key]}>

                    <Tooltip key={key} title={"Go to community"}>
                        <a
                            //href={'/' + SEARCH_ENDPOINT + "?community=" + key + "&page=0"}
                            href={WEBSITE_URL + 'community/' + key}
                            target="_blank"
                            rel="noopener noreferrer"

                            style={{
                                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                fontWeight: "500",
                                fontSize: "0.8125rem",
                                lineHeight: "1.75",
                                letterSpacing: "0.02857em",
                                textTransform: "uppercase",
                                color: "#1976D2",
                                padding: "3px 7px",
                                marginRight: "5px",
                                textDecoration: "none",
                                background: "aliceblue",
                            }}
                        >
                            {submissionData.submission.communities_part_of[key]}
                        </a>
                    </Tooltip>
                );
            });
            setSubmissionProps({ submissionCommunitiesNamesList: communityNamesList })
            // setCommunityNamesList(communityNamesList);
        }
    };

    const handleSaveDropdownChange = (event) => {
        const {
            target: { value },
        } = event;


        setSubmissionProps({
            submissionSaveCommunityIDList:
                typeof value === "string" ? value.split(",") : value
        })

        // setSaveCommunityIDList(
        //     // On autofill we get a stringified value.
        //     typeof value === "string" ? value.split(",") : value
        // );
    };

    const handleRemoveDropdownChange = (event) => {
        const {
            target: { value },
        } = event;
        setSubmissionProps({
            submissionRemoveCommunityIDList:
                typeof value === "string" ? value.split(",") : value
        })
        // setRemoveCommunityIDList(
        //     // On autofill we get a stringified value.
        //     typeof value === "string" ? value.split(",") : value
        // );
    };

    const deleteSubmissionfromCommunity = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault();
        // console.log("removing from these communities", submissionRemoveCommunityIDList);
        // Get the searchId required for POST request
        for (let i = 0; i < submissionRemoveCommunityIDList.length; ++i) {
            var URL =
                BASE_URL_CLIENT +
                GET_SUBMISSION_ENDPOINT +
                submissionData.submission.submission_id;
            const res = await fetch(URL, {
                method: "DELETE",
                body: JSON.stringify({
                    community: submissionRemoveCommunityIDList[i],
                }),
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                }),
            });

            const response = await res.json();
            if (response.status == "ok") {

                setSnackBarProps({ isSnackBarOpen: true })
                setSnackBarProps({ snackBarSeverity: 'success' });
                console.log('Submission removed from community!')
                setSnackBarProps({ snackBarMessage: response.message })

                handleClick();
                handleCloseDelete();

                let temp = [...submissionCommunitiesNamesList];
                temp = temp.filter((x) => x.key != submissionRemoveCommunityIDList[i]);
                setSubmissionProps({ submissionCommunitiesNamesList: temp })

                // add to 'add' dropdown
                let tempSubmissionSaveCommunityID = submissionSaveCommunityID;
                tempSubmissionSaveCommunityID.push(submissionRemoveCommunityIDList[i]);
                setSubmissionProps({ submissionSaveCommunityID: tempSubmissionSaveCommunityID })

                // remove from 'add' dropdown
                let tempSubmissionRemoveCommunityID = submissionRemoveCommunityID;
                tempSubmissionRemoveCommunityID = tempSubmissionRemoveCommunityID.filter((x) => x != submissionRemoveCommunityIDList[i]);
                setSubmissionProps({ submissionRemoveCommunityID: tempSubmissionRemoveCommunityID })

                // window.location.reload();
            } else {

                setSnackBarProps({ isSnackBarOpen: true })
                setSnackBarProps({ snackBarSeverity: 'error' });
                setSnackBarProps({ snackBarMessage: response.message })

                handleClick();
            }
        }
        setSubmissionProps({ submissionRemoveCommunityIDList: [] })
    };

    const saveSubmission = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault();
        // console.log("adding to these communities", submissionSaveCommunityIDList);
        var i;
        for (i = 0; i < submissionSaveCommunityIDList.length; i++) {
            //addToNewCommunity(saveCommunityIDList[i])
            var URL =
                BASE_URL_CLIENT +
                GET_SUBMISSION_ENDPOINT +
                submissionId;
            const res = await fetch(URL, {
                method: "PATCH",
                body: JSON.stringify({
                    community: submissionSaveCommunityIDList[i], //i
                }),
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                    "Content-Type": "application/json",
                }),
            });

            const response = await res.json();
            if (response.status == "ok") {
                setSeverity("success");
                setMessage("Saved submission successfully!");
                handleClick();
                console.log('Added to community!')

                let temp = submissionCommunitiesNamesList;

                temp.push(<Tooltip key={submissionSaveCommunityIDList[i]} title={"Go to community"}>
                    <a
                        // href={'/' + SEARCH_ENDPOINT + "?community=" + submissionSaveCommunityIDList[i] + "&page=0"}
                        href={WEBSITE_URL + 'community/' + submissionSaveCommunityIDList[i]}
                        target="_blank"
                        rel="noopener noreferrer"

                        style={{
                            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                            fontWeight: "500",
                            fontSize: "0.8125rem",
                            lineHeight: "1.75",
                            letterSpacing: "0.02857em",
                            textTransform: "uppercase",
                            color: "#1976D2",
                            padding: "3px 7px",
                            marginRight: "5px",
                            textDecoration: "none",
                            background: "aliceblue",
                        }}
                    >
                        {submissionCommunitiesNameMap[submissionSaveCommunityIDList[i]]}
                    </a>
                </Tooltip>)
                setSubmissionProps({ submissionCommunitiesNamesList: temp })

                // remove from 'add' dropdown
                let tempSubmissionSaveCommunityID = submissionSaveCommunityID;
                tempSubmissionSaveCommunityID = tempSubmissionSaveCommunityID.filter((x) => x != submissionSaveCommunityIDList[i]);
                setSubmissionProps({ submissionSaveCommunityID: tempSubmissionSaveCommunityID })

                // add to 'remove' dropdown
                let tempSubmissionRemoveCommunityID = submissionRemoveCommunityID;
                tempSubmissionRemoveCommunityID.push(submissionSaveCommunityIDList[i]);
                setSubmissionProps({ submissionRemoveCommunityID: tempSubmissionRemoveCommunityID })

            } else {
                setSeverity("error");
                setMessage(response.message);
                handleClick();
            }
        }
        setSubmissionProps({ submissionSaveCommunityIDList: [] })
    };

    const [otherMenuAnchor, setOtherMenuAnchor] = useState(null);
    const openOtherOptionsMenu = otherMenuAnchor;
    const handleClickOtherOptionsMenu = (event) => {
        setOtherMenuAnchor(event.currentTarget);
    };
    const handleCloseOtherOptionsMenu = () => {
        setOtherMenuAnchor(null);
    };

    const handleSubmit = async (event) => {

        var DATA = {
            source_url: submissionSourceUrl,
            title: submissionTitle,
            description: submissionDescription,
            anonymous: submissionIsAnonymous,
            time: new Date().getTime()
        }

        var URL = BASE_URL_CLIENT + GET_SUBMISSION_ENDPOINT + submissionId

        const res = await fetch(URL, {
            method: "PATCH",
            body: JSON.stringify(DATA),
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        const response = await res.json();

        if (res.status == 200) {
            console.log('Saved successfully', response)
            setSnackBarProps({ isSnackBarOpen: true })
            setSnackBarProps({ snackBarSeverity: 'success' });
            setSnackBarProps({ snackBarMessage: response.message })
            setSubmissionProps({ submissionDisplayUrl: response.display_url ? response.display_url : submissionSourceUrl })
            setSubmissionProps({ submissionHashtags: response.hashtags ? response.hashtags : submissionHashtags })
            setSubmissionProps({ submissionUsername: response.username ? response.username : submissionUsername })
            return true

            // window.location.reload();
        }
        else {
            //if we fail, want to keep the text so that the user can make the necessary changes
            //setSubmissionProps({ submissionTitle: originalTitle })
            //setSubmissionProps({ submissionDescription: originalDescription })
            //setSubmissionProps({ submissionSourceUrl: originalSourceUrl })

            setSnackBarProps({ isSnackBarOpen: true })
            setSnackBarProps({ snackBarSeverity: 'error' });
            setSnackBarProps({ snackBarMessage: 'Changes not saved: ' + response.message })
            return false


        }
    };

    const changeMode = () => {

        if (submissionMode === "edit") {
            let temp = originalDescription
            // if (originalDescription) {
            setSubmissionProps({ submissionDescription: temp })
            // }
            let tempTitle = originalTitle
            if (originalTitle) {
                setSubmissionProps({ submissionTitle: tempTitle })
            }

            let tempSourceUrl = originalSourceUrl
            setSubmissionProps({ submissionSourceUrl: tempSourceUrl })
            setSubmissionProps({ hasUnsavedChanges: false })
            setSubmissionProps({ ...submissionMode, submissionMode: "view" });

        } else {
            let tempDesc = submissionDescription
            setSubmissionProps({ originalDescription: tempDesc })

            let temp = submissionTitle
            setSubmissionProps({ originalTitle: temp })

            let tempSourceUrl = submissionSourceUrl
            setSubmissionProps({ originalSourceUrl: tempSourceUrl })

            setSubmissionProps({ hasUnsavedChanges: true })
            setSubmissionProps({ ...submissionMode, submissionMode: "edit" });

        }
    }

    const submitSubmissionChanges = () => {

        handleSubmit().then(isSuccessful => {
            if (isSuccessful) {
                let tempTitle = submissionTitle
                setSubmissionProps({ originalTitle: tempTitle })

                let tempDesc = submissionDescription
                setSubmissionProps({ originalDescription: tempDesc })

                let tempSourceUrl = submissionSourceUrl
                setSubmissionProps({ originalSourceUrl: tempSourceUrl })
                setSubmissionProps({ ...submissionMode, submissionMode: "view" })

                setSubmissionProps({ hasUnsavedChanges: false })
            }
        })
    }


    const [feedbackMessage, setFeedbackMessage] = useState("");

    const [openFeedbackForm, setOpenFeedbackForm] = useState(false);

    const handleClickOpenFeedbackForm = () => {
        setOpenFeedbackForm(true);
    };
    const handleMessageType = (event) => {
        setFeedbackMessage(event.target.value);
    };

    const handleCancelFeedbackForm = () => {
        setFeedbackMessage("");
        setOpenFeedbackForm(false);
        handleCloseOtherOptionsMenu();
    };

    const handleCreateFeedbackForm = async (event) => {
        //send feedback
        var URL = BASE_URL_CLIENT + "feedback" + "/";
        const res = await fetch(URL, {
            method: "POST",
            body: JSON.stringify({
                submission_id: submissionId,
                message: feedbackMessage,
            }),
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        const response = await res.json();
        setOpenFeedbackForm(false);
        setFeedbackMessage("");
        handleCloseOtherOptionsMenu();
    };

    useEffect(() => {
        getSubmissionData();
    }, []);

    useEffect(() => {
        const handleRouteChangeStart = (url) => {
            if (url == '/') {
                console.log(`Route change to ${url} started`);
                Router.events.off('routeChangeStart', handleRouteChangeStart);
            } else {

                if (hasUnsavedChanges == true) {

                    if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {

                        Router.events.emit('routeChangeError');
                        throw 'Abort route change. Please ignore this error.';
                    }
                }
            }
        };

        if (hasUnsavedChanges == false) {
            Router.events.off('routeChangeStart', handleRouteChangeStart);
        }
        if (hasUnsavedChanges == true) {
            Router.events.on('routeChangeStart', handleRouteChangeStart);
        }

        return () => {
            Router.events.off('routeChangeStart', handleRouteChangeStart);
        };
    }, [hasUnsavedChanges]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (hasUnsavedChanges == true) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        if (hasUnsavedChanges == false) {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }

        if (hasUnsavedChanges == true) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);


    return (
        <>
            <Box margin={.5} width={'100%'}>
                <div>

                    {submissionData.submission &&
                        <Grid container direction={'row'} spacing={2} justifyContent={'space-between'}>
                            <Grid item>
                                <Typography variant="h5" color='blue' noWrap
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '95ch',
                                    }}>
                                    <Link target="_blank" color="inherit" href={submissionData.submission.redirect_url}>
                                        {/* {submissionTitle} */}
                                        {originalTitle ? originalTitle : submissionTitle}
                                    </Link>

                                </Typography>
                            </Grid>
                            <Grid item>

                                {
                                    submissionCanDelete && (
                                        <>
                                            {submissionType != "webpage" &&
                                                (submissionMode == "edit" ?

                                                    <>
                                                        <Button onClick={submitSubmissionChanges} variant="outlined" startIcon={<Save />} size="small" color="success">
                                                            Save
                                                        </Button>
                                                        <Button onClick={handleClickDelete} startIcon={<Delete />} variant="outlined" size="small" color="error">
                                                            Delete
                                                        </Button>
                                                        <Tooltip title="Cancel">
                                                            <IconButton
                                                                size="small" color="gray"
                                                                onClick={changeMode}
                                                                label="cancel"
                                                                aria-label="close"
                                                                variant="outlined"
                                                            >
                                                                <CloseOutlined />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                    :
                                                    <Button onClick={changeMode} disabled={submissionMode === "create" && isAConnection} variant="outlined" startIcon={<Edit />} size="small">
                                                        Edit
                                                    </Button>
                                                )

                                            }
                                        </>
                                    )
                                }

                                <IconButton
                                    aria-label="more"
                                    id="long-button"
                                    size="small"
                                    aria-controls={open ? 'long-menu' : undefined}
                                    aria-expanded={open ? 'true' : undefined}
                                    aria-haspopup="true"
                                    onClick={handleClickOtherOptionsMenu}
                                >
                                    <MoreVertIcon />
                                </IconButton>

                                <Menu
                                    id="long-menu"
                                    MenuListProps={{
                                        'aria-labelledby': 'long-button',
                                    }}
                                    anchorEl={otherMenuAnchor}
                                    open={openOtherOptionsMenu}
                                    onClose={handleCloseOtherOptionsMenu}
                                    PaperProps={{
                                        style: {
                                            maxHeight: ITEM_HEIGHT * 4.5,
                                            width: '20ch',
                                        },
                                    }}
                                >
                                    {otherMenuOptions.map((option) => (
                                        <MenuItem key={option} selected={option === 'Report Submission'} onClick={handleClickOpenFeedbackForm}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Menu>
                                <Dialog open={openFeedbackForm}>
                                    <DialogTitle>
                                        {" "}
                                        Report submission: {" "}
                                        <a
                                            style={{ fontSize: "20px" }}
                                            href={submissionRedirectUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {submissionTitle}
                                        </a>
                                    </DialogTitle>
                                    <DialogContent>
                                        <DialogContentText>
                                        </DialogContentText>
                                        <TextField
                                            autoFocus
                                            margin="dense"
                                            id="message"
                                            name="message"
                                            value={feedbackMessage}
                                            onChange={handleMessageType}
                                            label="Why are you reporting this submission?"
                                            fullWidth
                                            variant="standard"
                                        />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={handleCancelFeedbackForm}>Cancel</Button>
                                        <Button onClick={handleCreateFeedbackForm}>Send</Button>
                                    </DialogActions>
                                </Dialog>
                                <Dialog open={openDelete} onClose={handleCloseDelete}>
                                    <DialogTitle style={{ width: "500px" }}>
                                        {" "}
                                        Delete Submission{" "}
                                    </DialogTitle>
                                    <DialogContent>
                                        <DialogContentText>
                                            Are you sure you want to delete this submission? This will
                                            remove the submission from all communities.
                                        </DialogContentText>
                                    </DialogContent>

                                    <DialogActions>
                                        <Button onClick={handleCloseDelete}>Cancel</Button>
                                        <Button
                                            style={{ color: "red" }}
                                            onClick={deleteSubmissionEntirely}
                                        >
                                            I'm Sure
                                        </Button>
                                    </DialogActions>
                                </Dialog>



                            </Grid>

                        </Grid>
                    }

                    <Stack direction={"row"} alignItems={'center'} justifyContent="space-between">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Tooltip title="Copy URL">
                                <IconButton
                                    size="small"
                                    sx={{ padding: "3px", backgroundColor: "#f8f8f8", '&:hover': { backgroundColor: "#e0e0e0" } }}
                                    onClick={copyPageUrl}
                                >
                                    <ContentCopy fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Typography
                                color="grey"
                                variant="subtitle2"
                                noWrap
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '95ch',
                                }}
                            >
                                {/* {subData.sourceURL} */}
                                {submissionDisplayUrl}
                            </Typography>
                        </div>

                        <Stack direction={"row"} justifyContent={"flex-end"}>
                            <Stack direction={"row"} spacing={0.5}>

                                <Typography color="grey" variant="subtitle2">
                                    {"Submitted"}
                                </Typography>

                                {!submissionIsAnonymous &&
                                    <>
                                        <Typography color="grey" variant="subtitle2">
                                            {"by"}
                                        </Typography>
                                        <Typography color="grey" variant="subtitle2"
                                            sx={{
                                                fontStyle: 'italic',
                                                textDecoration: 'underline',
                                            }}>
                                            {submissionUsername}
                                        </Typography></>
                                }
                                {submissionDate &&
                                    <>
                                        <Typography color="grey" variant="subtitle2">
                                            {"on"}
                                        </Typography>
                                        <Typography color="grey" display={"block"} variant="subtitle2"
                                            sx={{
                                                fontWeight: 'bold',
                                            }}>
                                            {/* {'Submitted on ' + submissionLastModified} */}
                                            {submissionDate}
                                            {/* HERE {submissionData.submission.time && new Date(parseInt(submissionData.submission.time)).toLocaleDateString("en-us")} */}
                                        </Typography></>
                                }


                            </Stack>
                        </Stack>
                    </Stack>

                    <Stack direction={"row"} justifyContent={'flex-start'} alignItems={'center'} spacing={1}>
                        <Tooltip title="Associated Communities">

                            <IconButton
                                size="small"
                                sx={{ padding: "3px", color: "gray", backgroundColor: "#f8f8f8", '&:hover': { backgroundColor: "#e0e0e0" } }}

                            >
                                <LocalLibraryRoundedIcon fontSize="small" style={{ color: "#1976d2" }} />
                            </IconButton>
                        </Tooltip>
                        <div style={{
                            display: "flex",
                            flex: 2,
                            overflowX: "auto",
                            overflowY: "hidden",
                            whiteSpace: "nowrap",
                        }}
                        >
                            <div style={{
                                float: "left",
                            }}>

                                {submissionCommunitiesNamesList.length > 0 && submissionData.submission.type === "user_submission"
                                    ? submissionCommunitiesNamesList.map((link, i) => [i > 0, link])
                                    : ""}
                                {submissionData.submission.type === "webpage" &&
                                    <Typography
                                        style={{
                                            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                            fontWeight: "500",
                                            fontSize: "0.7125rem",
                                            lineHeight: "1.75",
                                            letterSpacing: "0.02857em",
                                            textTransform: "uppercase",
                                            // color: "#1976D2",
                                            borderRadius: "50px",
                                            padding: "3px 7px",
                                            marginRight: "5px",
                                            textDecoration: "none",
                                            background: "#DCDCDC",
                                        }}
                                    >
                                        Webpage
                                    </Typography>
                                }
                            </div>

                        </div>

                        {submissionCanDelete && submissionData.submission.type !== "webpage" ? <>
                            <div style={{
                                display: "flex",
                                flex: 1,
                            }}>
                                <FormControl
                                    sx={{ width: "100px" }}
                                    size="small"
                                >
                                    <InputLabel
                                        id="demo-multiple-checkbox-label"
                                        sx={{ width: 150, fontSize: "0.8rem" }} // Adjusting label width and font size
                                    >
                                        Add
                                    </InputLabel>

                                    <Select
                                        labelId="demo-multiple-checkbox-label"
                                        id="demo-multiple-checkbox"
                                        value={submissionSaveCommunityIDList}
                                        // value={saveCommunityIDList}
                                        onChange={handleSaveDropdownChange}
                                        sx={{ borderRadius: "4px 0 0 4px", fontSize: "0.8rem" }} // Adjusting border radius and font size
                                        input={
                                            <OutlinedInput label="Add Community" />
                                        }
                                        renderValue={(selected) =>
                                            selected
                                                .map((x) => submissionCommunitiesNameMap[x])
                                                .join(", ")
                                        }
                                        MenuProps={MenuProps}
                                    >
                                        {/* {saveCommunityID.map((item) => ( */}
                                        {submissionSaveCommunityID && submissionSaveCommunityID.map((item) => (
                                            <MenuItem key={item} value={item}
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={
                                                        submissionSaveCommunityIDList.indexOf(item) > -1
                                                    }
                                                />
                                                <ListItemText
                                                    primaryTypographyProps={{ fontSize: '0.8rem' }}
                                                    primary={submissionCommunitiesNameMap[item]}
                                                />
                                            </MenuItem>

                                        ))}
                                    </Select>
                                </FormControl>
                                <Tooltip title="Add to community">
                                    <IconButton
                                        size="small"
                                        sx={{ padding: "4px", borderColor: "green", borderRadius: "0 5px 5px 0", borderWidth: "1px", borderStyle: "solid" }}
                                        onClick={saveSubmission}>
                                        <Save fontSize="small" /> {/* Adjusting icon size */}
                                    </IconButton>
                                </Tooltip>
                            </div>

                            <div style={{
                                display: "flex",
                                flex: 1,
                            }}>
                                <FormControl
                                    sx={{ width: "100px" }}
                                    size="small"
                                >
                                    <InputLabel
                                        id="demo-multiple-checkbox-label"
                                        sx={{ fontSize: "0.8rem" }}
                                    >
                                        Remove
                                    </InputLabel>
                                    <Select
                                        labelId="demo-multiple-checkbox-label"
                                        id="demo-multiple-checkbox"
                                        // value={removeCommunityIDList}
                                        value={submissionRemoveCommunityIDList}
                                        onChange={handleRemoveDropdownChange}
                                        input={
                                            <OutlinedInput label="Remove Community" />
                                        }
                                        sx={{ borderRadius: "4px 0 0 4px", fontSize: "0.8rem" }}
                                        renderValue={(selected) =>
                                            selected
                                                .map((x) => submissionCommunitiesNameMap[x])
                                                .join(", ")
                                        }
                                        MenuProps={MenuProps}>
                                        {/* {removeCommunityID.map((item) => ( */}
                                        {submissionRemoveCommunityID && submissionRemoveCommunityID.map((item) => (
                                            <MenuItem key={item} value={item}
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={submissionRemoveCommunityIDList.indexOf(item) > -1}
                                                />
                                                <ListItemText
                                                    primaryTypographyProps={{ fontSize: '0.8rem' }}
                                                    primary={submissionCommunitiesNameMap[item]}
                                                />
                                            </MenuItem>


                                        ))}
                                    </Select>
                                </FormControl>
                                <Tooltip title="Remove from community">
                                    <IconButton
                                        size="small"
                                        sx={{ padding: "4px", borderColor: "red", borderRadius: "0 5px 5px 0", borderWidth: "1px", borderStyle: "solid" }}
                                        onClick={deleteSubmissionfromCommunity}
                                    >
                                        <Delete fontSize="small" /> {/* Adjusting icon size */}
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </>
                            :
                            <>
                                <div style={{
                                    display: "flex",
                                    flex: 1,
                                }}></div>
                                <div style={{
                                    display: "flex",
                                    flex: 1,
                                }}></div>
                            </>
                        }



                        <div style={{
                            display: "flex",
                            flex: 5,
                        }}>
                        </div>

                        <div style={{
                            display: "flex",
                            flex: 1,
                        }}>

                            <SubmissionStatistics submitRelevanceJudgements={submitRelevanceJudgements} fetchSubmissionStats={fetchSubmissionStats} fetchSubmissionJudgement={fetchSubmissionJudgement} />
                        </div>

                    </Stack>

                </div>

                <Snackbar
                    open={isSnackBarOpen}
                    autoHideDuration={6000}
                    onClose={closeSnackbar}
                    onClick={closeSnackbar}
                >
                    <Alert
                        onClose={closeSnackbar}
                        severity={snackBarSeverity}
                        sx={{ width: '100%' }}
                    >
                        {snackBarMessage}
                    </Alert>
                </Snackbar>
            </Box >
        </>
    )
}

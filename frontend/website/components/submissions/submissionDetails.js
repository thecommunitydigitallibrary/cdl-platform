import jsCookie from "js-cookie";
import { ContentCopy, Delete, LocalLibraryOutlined, LocalLibraryRounded, LocalLibraryTwoTone, Save, Edit, CloseOutlined, Close } from '@mui/icons-material';
import { Box, Checkbox, FormControl, IconButton, InputLabel, Link, ListItemText, Tooltip, Menu, MenuItem, OutlinedInput, Select, Stack, Typography, Grid, Button, ButtonGroup, Snackbar, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { React, useState, useEffect } from 'react';
import { BASE_URL_CLIENT, GET_SUBMISSION_ENDPOINT, SEARCH_ENDPOINT, WEBSITE_URL } from '../../static/constants';
import SubmissionStatistics from "./stats";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocalLibraryRoundedIcon from '@mui/icons-material/LocalLibraryRounded';
import useSubmissionStore from "../../store/submissionStore";
import useSnackbarStore from "../../store/snackBar";

export default function SubmissionDetails(subData) {

    const {
        submissionTitle,
        submissionDescription,
        submissionSourceUrl,
        submissionCommunity,
        submissionCommunities,
        submissionIsAnonymous,
        submissionMode,
        originalDescription,
        submissionType,
        submissionId,
        submissionIncomingConnections,
        submissionCommunitiesNamesList,
        submissionRemoveCommunityID,
        submissionSaveCommunityID,
        submissionRemoveCommunityIDList,
        submissionCommunitiesNameMap,
        submissionSaveCommunityIDList,
        submissionUsername,
        submissionDisplayUrl,
        submissionLastModified,
        submissionDate,
        isAConnection,
        setSubmissionProps
    } = useSubmissionStore();

    const { isSnackBarOpen, snackBarMessage, snackBarSeverity, openSnackbar, closeSnackbar, setSnackBarProps } = useSnackbarStore();

    const submissionData = subData.data;

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("error");
    const [openDelete, setOpenDelete] = useState(false);

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
        const linkToCopy = WEBSITE_URL + GET_SUBMISSION_ENDPOINT + "/" + submissionId;
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

                    <Tooltip title={"Go to community"}>
                        <a
                            href={'/' + SEARCH_ENDPOINT + "?community=" + key + "&page=0"}
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

                        // style={{
                        //     fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                        //     fontWeight: "750",
                        //     fontSize: "0.75rem",
                        //     letterSpacing: "0.02857em",
                        //     textTransform: "uppercase",
                        //     color: "white",
                        //     padding: "5px 7px",
                        //     marginRight: "5px",
                        //     textDecoration: "none",
                        //     background: "#1976d2",
                        //     borderRadius: '1rem'
                        // }}
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
        console.log("removing from these communities", submissionRemoveCommunityIDList);
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
                setSeverity("success");
                setMessage("Submission removed from community.");
                handleClick();
                handleCloseDelete();
                window.location.reload();
            } else {
                setSeverity("error");
                setMessage(response.message);
                handleClick();
            }
        }
    };

    const saveSubmission = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault();
        console.log("adding to these communities", submissionSaveCommunityIDList);
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
                window.location.reload();
            } else {
                setSeverity("error");
                setMessage(response.message);
                handleClick();
            }
        }
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
            // community: submissionCommunity, we have option to edit communities in the page itself
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
            console.log('Saved successfully')
            setSnackBarProps({ isSnackBarOpen: true })
            setSnackBarProps({ snackBarSeverity: 'success' });
            setSnackBarProps({ snackBarMessage: 'Saved successfully!' })
            // window.location.reload();
        }
        else {

            setSnackBarProps({ isSnackBarOpen: true })
            setSnackBarProps({ snackBarSeverity: 'error' });
            setSnackBarProps({ snackBarMessage: 'Could not save changes' })
        }
    };

    const changeMode = () => {

        if (submissionMode === "edit") {
            let temp = originalDescription
            setSubmissionProps({ submissionDescription: temp })
            setSubmissionProps({ ...submissionMode, submissionMode: "view" });
        } else {
            setSubmissionProps({ ...submissionMode, submissionMode: "edit" });
        }
    }

    const submitSubmissionChanges = () => {

        // let tempTitle = submissionTitle
        // setSubmissionProps({ originalTitle: tempTitle })

        let tempDesc = submissionDescription
        setSubmissionProps({ originalDescription: tempDesc })
        handleSubmit()
        setSubmissionProps({ ...submissionMode, submissionMode: "view" });
    }

    useEffect(() => {
        getSubmissionData();
    }, []);


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
                                        {submissionTitle}
                                    </Link>

                                </Typography>
                            </Grid>
                            <Grid item>

                                {submissionType != "webpage" &&
                                    (submissionMode == "edit" ?

                                        <>
                                            <Button onClick={submitSubmissionChanges} variant="outlined" startIcon={<Save />} size="small" color="success">
                                                Save
                                            </Button>
                                            <Button onClick={handleClickDelete} startIcon={<Delete />} variant="outlined" size="small" color="error">
                                                Delete
                                            </Button>

                                        </>
                                        :
                                        <Button onClick={changeMode} disabled={submissionMode === "create" && isAConnection} variant="outlined" startIcon={<Edit />} size="small">
                                            Edit
                                        </Button>
                                    )
                                }

                                {submissionMode == "edit" &&
                                    <IconButton
                                        size="small" color="gray"
                                        onClick={changeMode}
                                        aria-label="close"
                                        variant="outlined"
                                    >
                                        <CloseOutlined />
                                    </IconButton>}
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
                                        <MenuItem key={option} selected={option === 'Report Submission'} onClick={() => { console.log('need to report'); handleCloseOtherOptionsMenu(); }}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Menu>
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

                                {submissionUsername &&
                                    <>
                                        <Typography color="grey" variant="subtitle2">
                                            {"by"}
                                        </Typography>
                                        <Typography color="grey" variant="subtitle2"
                                            sx={{
                                                fontStyle: 'italic',
                                                textDecoration: 'underline',
                                            }}>
                                            {/* {submissionData.submission.username} */}
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
                            borderRadius: "50px"
                        }}
                        >
                            <div style={{
                                float: "left",
                            }}>

                                {/* {submissionCommunitiesNamesList.length > 0 && submissionData.submission.type === "user_submission"
                                    ? submissionCommunitiesNamesList.map((link, i) => [i > 0, link])
                                    : ""}
                                {submissionData.submission.type === "webpage" &&
                                    <Typography>
                                        "Webpage"
                                    </Typography>
                                } */}

                                {submissionCommunitiesNamesList.length > 0 && submissionData.submission.type === "user_submission"
                                    ? submissionCommunitiesNamesList.map((link, i) => [i > 0, link])
                                    : ""}
                                {submissionData.submission.type === "webpage" &&
                                    <Typography>
                                        "Webpage"
                                    </Typography>
                                }
                            </div>

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


                        <div style={{
                            display: "flex",
                            flex: 5,
                        }}>

                        </div>

                        <div style={{
                            display: "flex",
                            flex: 1,
                        }}>
                            <SubmissionStatistics />
                        </div>

                    </Stack>

                </div>

                <Snackbar
                    open={isSnackBarOpen}
                    autoHideDuration={1000}
                    onClick={closeSnackbar}
                    message={snackBarMessage}
                    severity={snackBarSeverity}
                    onClose={closeSnackbar}
                />

            </Box >
        </>
    )
}

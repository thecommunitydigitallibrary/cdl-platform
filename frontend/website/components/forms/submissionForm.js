import katex from "katex";
import "katex/dist/katex.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import rehypeSanitize from "rehype-sanitize";
import { getCodeString } from 'rehype-rewrite';

import jsCookie from "js-cookie";
import React, { useState, useEffect, useRef } from "react";

import dynamic from 'next/dynamic'
import { DialogTitle, FormControl, IconButton, InputLabel, List, ListItem, Paper, Select } from "@mui/material";
import Button from "@mui/material/Button";

import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';


import Box from '@mui/material/Box';
import useSubmissionStore from "../../store/submissionStore";
import { BASE_URL_CLIENT, BASE_URL_SERVER, GET_SUBMISSION_ENDPOINT } from "../../static/constants";
import { CloseFullscreenOutlined, CloseOutlined } from "@mui/icons-material";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const AUTOCOMPLETE_ENDPOINT = baseURL_client + "autocomplete"


const SUB_WEB_ENDPOINT = process.env.NEXT_PUBLIC_FROM_CLIENT + "submissions/";

export default function SubmissionForm(props) {

    // in props:
    // submissionCommunitiesNameMap
    // method (reply, create, edit)
    // source_url, title, description (empty text if not there, needed on edit)
    // submission_id (empty text if not there, needed on edit)

    const {
        submissionTitle,
        submissionDescription,
        submissionCommunities, submissionCommunity,
        submissionSourceUrl,
        submissionIsAnonymous,
        submissionMode,
        submissionId,
        submissionIncomingConnections,
        submissionUsername,
        submissionCommunitiesNameMap,
        submissionSuggestions,
        submissionRemoveCommunityID,
        submissionSaveCommunityID,
        submissionRemoveCommunityIDList,
        submissionSaveCommunityIDList,
        setSubmissionProps
    } = useSubmissionStore();

    // States for Alerts
    const [openSnackbar, setOpenSnackbar] = React.useState(false);
    const [severity, setSeverity] = React.useState("error");
    const [message, setMessage] = React.useState("");

    // must always pass (make empty if creating)
    const [sourceURL, setSourceURL] = useState(props?.source_url)
    const [title, setTitle] = useState(props?.title)
    const [description, setDescription] = useState(props?.description)

    const [suggestions, setSuggestions] = useState(null)

    const [community, setCommunity] = useState("")

    const [connection, setConnection] = useState("")

    const [currentQuery, setCurrentQuery] = useState("")

    const [isAnonymous, setAnonymous] = useState(props?.username == undefined)

    const handleAnonymous = async (event) => {

        if (props.isAConnection) {
            if (isAnonymous) {
                setAnonymous(false)
            } else {
                setAnonymous(true)
            }
        }

        else {
            if (submissionIsAnonymous) {
                setSubmissionProps({ ...submissionIsAnonymous, submissionIsAnonymous: false })

            } else {
                setSubmissionProps({ ...submissionIsAnonymous, submissionIsAnonymous: true })

            }
        }
    }

    const handleAutoSuggestClick = async (event) => {

        const regex = /\[\[([^\]]+)\]\]/i;
        var replacement_text = "[" + event.target.title + "](" + SUB_WEB_ENDPOINT + event.target.id + ")"
        var new_desc = submissionDescription.replace(regex, replacement_text)

        if (props.isAConnection) {
            setDescription(new_desc)
        }
        else {
            setSubmissionProps({ submissionDescription: new_desc })
        }
        // setSubmissionProps({ submissionDescription: replacement_text })
        // setDescription(new_desc)
        setCurrentQuery("")
        if (props.isAConnection) {
            setSuggestions(null)
        } else {
            setSubmissionProps({ suggestions: null })
        }
    }

    const getSuggestions = async (text) => {

        if (text == currentQuery) {
            return
        }

        const res = await fetch(AUTOCOMPLETE_ENDPOINT + "?query=" + text + "&topn=5", {
            method: "GET",
            headers: new Headers({
                Authorization: jsCookie.get("token"),
            }),
        });
        const response = await res.json();

        if (res.status == 200) {

            if (props.isAConnection) {

                console.log('shoudl be setting noe')
                setSuggestions(response.suggestions.map((x) =>
                    <Button onClick={handleAutoSuggestClick} id={x.id} title={x.label}>
                        {x.label}
                    </Button>
                ));
            }
            else {
                console.log('looking for suggestiong for : ', text)

                setSubmissionProps({
                    submissionSuggestions:
                        response.suggestions.map((x) =>
                            <Button onClick={handleAutoSuggestClick} id={x.id} title={x.label}>
                                {x.label}
                            </Button>
                        )
                })
            }

            setCurrentQuery(text)
        } else {
            console.log(response.message)

            if (props.isAConnection) {
                setSuggestions(null)
            } else {
                setSubmissionProps({ submissionSuggestions: null })
            }
        }
    }

    const setDescriptionListener = async (text) => {

        if (props.isAConnection) {
            setDescription(text)

            const regex = /\[\[([^\]]+)\]\]/g;
            const matches = [];
            let match;

            while ((match = regex.exec(description)) !== null) {
                matches.push(match[1]);
            }

            if (matches.length == 1) {
                var words_in_match = matches[0]
                getSuggestions(words_in_match)
            }
        }
        else {
            setSubmissionProps({ submissionDescription: text })
            const regex = /\[\[([^\]]+)\]\]/g;
            const matches = [];
            let match;

            while ((match = regex.exec(submissionDescription)) !== null) {
                matches.push(match[1]);
            }

            if (matches.length == 1) {
                var words_in_match = matches[0]
                getSuggestions(words_in_match)
            }
        }
    }

    const handleCancel = () => {
        props.setTextBoxVisible(false)
    }

    const handleSubmit = async (event) => {

        if (props.isAConnection) {

            var DATA = {
                community: community,
                source_url: sourceURL,
                title: title,
                description: description,
                anonymous: isAnonymous
            }
            var URL = BASE_URL_CLIENT
            var METH = "POST"

            URL = URL + GET_SUBMISSION_ENDPOINT

            const res = await fetch(URL, {
                method: METH,
                body: JSON.stringify(DATA),
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                    "Content-Type": "application/json",
                }),
            });

            const response = await res.json();
            if (res.status == 200) {
                setSeverity("success");
                setMessage(response.message);
                props.setTextBoxVisible(false)
                setOpenSnackbar(true);

                URL = BASE_URL_CLIENT + GET_SUBMISSION_ENDPOINT + response.submission_id;

                const newSubmissionRes = await fetch(URL, {
                    method: "GET",
                    headers: new Headers({
                        Authorization: jsCookie.get("token"),
                    }),
                });
                const newConnection = await newSubmissionRes.json();

                const errorCode = newSubmissionRes.ok ? false : newSubmissionRes.status;

                if (!errorCode) {
                    let newIncomingSubs = [...submissionIncomingConnections, newConnection.submission];
                    setSubmissionProps({ submissionIncomingConnections: newIncomingSubs });
                }
                // window.location.reload(); not needed if we change connectiosn state
            }
            else {
                setSeverity("error");
                setMessage(response.message);
                setOpenSnackbar(true);
            }
        }
        else {
            var DATA = {
                community: submissionCommunity,
                source_url: submissionSourceUrl,
                title: submissionTitle,
                description: submissionDescription,
                anonymous: submissionIsAnonymous
            }

            var URL = baseURL_client
            var METH = "POST"

            if (submissionMode == "create") {
                URL = URL + "submission/"

            } else if (submissionMode == "reply") {

                URL = URL + "connect/"
                DATA["connection_target"] = connection
                DATA["connection_source"] = props.submission_id

            } else if (submissionMode == "edit") {
                URL = URL + "submission/" + props.submission_id
                METH = "PATCH"
            }

            const res = await fetch(URL, {
                method: METH,
                body: JSON.stringify(DATA),
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                    "Content-Type": "application/json",
                }),
            });
            const response = await res.json();
            if (res.status == 200) {
                setSeverity("success");
                setMessage(response.message);
                setOpenSnackbar(true);
                if (submissionMode == "edit" || submissionMode == "reply") {
                    window.location.reload();
                } else {
                    props.handle_close()
                }
            } else {
                setSeverity("error");
                setMessage(response.message);
                setOpenSnackbar(true);
            }
        }


    };

    useEffect(() => {

        console.log('submissionIncomingConnections has changed: ', submissionIncomingConnections)

    }, [submissionIncomingConnections]);

    // document.querySelectorAll('input[type=text], textarea').forEach(field => field.spellcheck = true);
    // document.querySelectorAll('w-md-editor-text').forEach(field => field.style = {"min-height": "200px"});

    return (

        props.isAConnection ? // if props.isConnection si true, then this is a CONNECTION-submission so use the local states for inputs
            <div style={{ border: "1px solid #ccc", borderRadius: "4px", order: 2, elevation: 2 }}>
                {/* for submission mode create, set all params to empty string? */}

                <DialogContent>

                    <IconButton
                        style={{ float: 'right' }}
                        edge="end"
                        color="gray"
                        onClick={handleCancel}
                        aria-label="close"
                    >
                        <CloseOutlined />
                    </IconButton>


                    <TextField
                        margin="dense"
                        id="submissionURL"
                        label="Submission URL (optional)"
                        fullWidth
                        variant="standard"
                        value={sourceURL}
                        onChange={(event) => setSourceURL(event.target.value)}
                    />
                    <TextField
                        margin="dense"
                        id="submissionTitle"
                        label="Submission Title"
                        variant="standard"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        style={{ width: "50%" }} // Increase the width to 100%
                    />

                    <FormControl
                        sx={{ float: 'right', minWidth: 200, maxHeight: 150 }}
                    >
                        <InputLabel id="demo-simple-select-label">
                            Select Community
                        </InputLabel>

                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            style={{ backgroundColor: "white" }}
                            label="Select Community"
                            value={community}
                            onChange={(event) => setCommunity(event.target.value)}
                        >
                            {props.communitiesNameMap && Array.isArray(props.communitiesNameMap) &&
                                props.communitiesNameMap.map(function (d, idx) {
                                    return (
                                        <MenuItem key={idx} value={d.community_id}>
                                            {d.name}
                                        </MenuItem>
                                    );
                                })
                            }

                            {props.communitiesNameMap && !Array.isArray(props.communitiesNameMap) && Object.keys(submissionCommunitiesNameMap).map(function (key, index) {
                                return (
                                    <MenuItem key={index} value={key}>
                                        {props.communitiesNameMap[key]}
                                    </MenuItem>
                                );
                            })}

                        </Select>

                    </FormControl>
                    <br />
                    <div data-color-mode="light">
                        <MDEditor
                            id="submissionDescription"
                            label="Submission Description"
                            variant="standard"
                            value={description}
                            onChange={(value) => setDescriptionListener(value)}
                            highlightEnable={false}
                            preview="live"
                            height={400}
                            minHeight="100%"
                            visibleDragbar={false}
                            previewOptions={{
                                rehypePlugins: [[rehypeSanitize]],
                                components: {
                                    code: ({ inline, children = [], className, ...props }) => {
                                        const txt = children[0] || "";
                                        if (inline) {
                                            if (
                                                typeof txt === "string" &&
                                                /^\$\$(.*)\$\$/.test(txt)
                                            ) {
                                                const html = katex.renderToString(
                                                    txt.replace(/^\$\$(.*)\$\$/, "$1"),
                                                    {
                                                        throwOnError: false,
                                                    }
                                                );
                                                return (
                                                    <code dangerouslySetInnerHTML={{ __html: html }} />
                                                );
                                            }
                                            return <code>{txt}</code>;
                                        }
                                        const code =
                                            props.node && props.node.children
                                                ? getCodeString(props.node.children)
                                                : txt;
                                        if (
                                            typeof code === "string" &&
                                            typeof className === "string" &&
                                            /^language-katex/.test(className.toLocaleLowerCase())
                                        ) {
                                            const html = katex.renderToString(code, {
                                                throwOnError: false,
                                            });
                                            return (
                                                <code
                                                    style={{ fontSize: "150%" }}
                                                    dangerouslySetInnerHTML={{ __html: html }}
                                                />
                                            );
                                        }
                                        return <code className={String(className)}>{txt}</code>;
                                    },
                                },
                            }}
                        />
                    </div>
                    <Box sx={{ bgcolor: 'background.paper' }}>
                        {suggestions ? suggestions : "Pro-tip: Type [[search terms]] followed by a space to auto-link a submission that matches your search terms."}
                        <FormGroup>
                            <FormControlLabel control={<Checkbox defaultChecked={isAnonymous} onChange={handleAnonymous} />} label="Anonymous" />
                        </FormGroup>
                    </Box>

                </DialogContent>

                <DialogActions>
                    <Button onClick={() => { handleCancel() }}>Cancel</Button>
                    <Button onClick={() => { handleSubmit() }}>Save</Button>
                </DialogActions>
                <Snackbar open={openSnackbar} autoHideDuration={6000} >
                    <Alert
                        severity={severity}
                        sx={{ width: "100%" }}
                    >
                        {message}
                    </Alert>
                </Snackbar>
            </div >
            :
            <div>
                <>
                    {submissionMode == "edit" &&
                        <div>
                            <TextField
                                margin="dense"
                                id="submissionURL"
                                label="Submission URL (optional)"
                                fullWidth
                                variant="standard"
                                value={submissionSourceUrl}
                                onChange={(event) => setSubmissionProps({ submissionSourceUrl: event.target.value })}
                            />
                            <TextField
                                margin="dense"
                                id="submissionTitle"
                                label="Submission Title"
                                fullWidth
                                variant="standard"
                                value={submissionTitle}
                                onChange={(event) => setSubmissionProps({ submissionTitle: event.target.value })}
                            />
                            <br />
                            <div data-color-mode="light" >
                                <MDEditor
                                    id="submissionDescription"
                                    label="Submission Description"
                                    variant="standard"
                                    value={submissionDescription}
                                    onChange={(value) => setDescriptionListener(value)}
                                    highlightEnable={false}
                                    preview="live"
                                    height={'75vh'}
                                    minHeight="100%"
                                    visibleDragbar={false}
                                    previewOptions={{
                                        rehypePlugins: [[rehypeSanitize]],
                                        components: {
                                            code: ({ inline, children = [], className, ...props }) => {
                                                const txt = children[0] || "";
                                                if (inline) {
                                                    if (
                                                        typeof txt === "string" &&
                                                        /^\$\$(.*)\$\$/.test(txt)
                                                    ) {
                                                        const html = katex.renderToString(
                                                            txt.replace(/^\$\$(.*)\$\$/, "$1"),
                                                            {
                                                                throwOnError: false,
                                                            }
                                                        );
                                                        return (
                                                            <code dangerouslySetInnerHTML={{ __html: html }} />
                                                        );
                                                    }
                                                    return <code>{txt}</code>;
                                                }
                                                const code =
                                                    props.node && props.node.children
                                                        ? getCodeString(props.node.children)
                                                        : txt;
                                                if (
                                                    typeof code === "string" &&
                                                    typeof className === "string" &&
                                                    /^language-katex/.test(className.toLocaleLowerCase())
                                                ) {
                                                    const html = katex.renderToString(code, {
                                                        throwOnError: false,
                                                    });
                                                    return (
                                                        <code
                                                            style={{ fontSize: "150%" }}
                                                            dangerouslySetInnerHTML={{ __html: html }}
                                                        />
                                                    );
                                                }
                                                return <code className={String(className)}>{txt}</code>;
                                            },
                                        },
                                    }}
                                />
                                <Box sx={{ bgcolor: 'background.paper' }}>
                                    {submissionSuggestions ? submissionSuggestions : "Pro-tip: Type [[search terms]] followed by a space to auto-link a submission that matches your search terms."}
                                </Box>

                                <FormGroup style={{ 'padding': '1%' }}>
                                    <FormControlLabel control={<Checkbox defaultChecked={submissionIsAnonymous} onChange={handleAnonymous} />} label="Anonymous" />
                                </FormGroup>
                            </div>
                            <br />

                        </div>
                    }

                    {submissionMode == "view" &&
                        <div>
                            <div data-color-mode="light">
                                <MDEditor
                                    id="submissionDescription"
                                    label="Submission Description"
                                    variant="standard"
                                    value={submissionDescription}
                                    onChange={(value) => setDescriptionListener(value)}
                                    highlightEnable={false}
                                    preview="preview"
                                    height={'75vh'}
                                    minHeight="100%"
                                    visibleDragbar={false}
                                    previewOptions={{
                                        rehypePlugins: [[rehypeSanitize]],
                                        components: {
                                            code: ({ inline, children = [], className, ...props }) => {
                                                const txt = children[0] || "";
                                                if (inline) {
                                                    if (
                                                        typeof txt === "string" &&
                                                        /^\$\$(.*)\$\$/.test(txt)
                                                    ) {
                                                        const html = katex.renderToString(
                                                            txt.replace(/^\$\$(.*)\$\$/, "$1"),
                                                            {
                                                                throwOnError: false,
                                                            }
                                                        );
                                                        return (
                                                            <code dangerouslySetInnerHTML={{ __html: html }} />
                                                        );
                                                    }
                                                    return <code>{txt}</code>;
                                                }
                                                const code =
                                                    props.node && props.node.children
                                                        ? getCodeString(props.node.children)
                                                        : txt;
                                                if (
                                                    typeof code === "string" &&
                                                    typeof className === "string" &&
                                                    /^language-katex/.test(className.toLocaleLowerCase())
                                                ) {
                                                    const html = katex.renderToString(code, {
                                                        throwOnError: false,
                                                    });
                                                    return (
                                                        <code
                                                            style={{ fontSize: "150%" }}
                                                            dangerouslySetInnerHTML={{ __html: html }}
                                                        />
                                                    );
                                                }
                                                return <code className={String(className)}>{txt}</code>;
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    }

                    {/* for submission mode create, set all params to empty string? */}
                    {submissionMode == "create" && <div>
                        <DialogContent>
                            <h6 align="center">
                                {props.dialog_title}
                            </h6>
                            <TextField
                                margin="dense"
                                id="submissionURL"
                                label="Submission URL (optional)"
                                fullWidth
                                variant="standard"
                                value={submissionSourceUrl}
                                onChange={(event) => setSubmissionProps({ submissionSourceUrl: event.target.value })}
                            />
                            <TextField
                                margin="dense"
                                id="submissionTitle"
                                label="Submission Title"
                                fullWidth
                                variant="standard"
                                value={submissionTitle}
                                onChange={(event) => setSubmissionProps({ submissionTitle: event.target.value })}
                            />
                            <br />
                            <br />
                            <DialogContentText>
                                Submission Description
                            </DialogContentText>
                            <div data-color-mode="light">
                                <MDEditor
                                    id="submissionDescription"
                                    label="Submission Description"
                                    variant="standard"
                                    value={submissionDescription}
                                    onChange={(value) => setDescriptionListener(value)}
                                    highlightEnable={false}
                                    preview="live"
                                    height={400}
                                    minHeight="100%"
                                    visibleDragbar={false}
                                    previewOptions={{
                                        rehypePlugins: [[rehypeSanitize]],
                                        components: {
                                            code: ({ inline, children = [], className, ...props }) => {
                                                const txt = children[0] || "";
                                                if (inline) {
                                                    if (
                                                        typeof txt === "string" &&
                                                        /^\$\$(.*)\$\$/.test(txt)
                                                    ) {
                                                        const html = katex.renderToString(
                                                            txt.replace(/^\$\$(.*)\$\$/, "$1"),
                                                            {
                                                                throwOnError: false,
                                                            }
                                                        );
                                                        return (
                                                            <code dangerouslySetInnerHTML={{ __html: html }} />
                                                        );
                                                    }
                                                    return <code>{txt}</code>;
                                                }
                                                const code =
                                                    props.node && props.node.children
                                                        ? getCodeString(props.node.children)
                                                        : txt;
                                                if (
                                                    typeof code === "string" &&
                                                    typeof className === "string" &&
                                                    /^language-katex/.test(className.toLocaleLowerCase())
                                                ) {
                                                    const html = katex.renderToString(code, {
                                                        throwOnError: false,
                                                    });
                                                    return (
                                                        <code
                                                            style={{ fontSize: "150%" }}
                                                            dangerouslySetInnerHTML={{ __html: html }}
                                                        />
                                                    );
                                                }
                                                return <code className={String(className)}>{txt}</code>;
                                            },
                                        },
                                    }}
                                />
                            </div>
                            <Box sx={{ bgcolor: 'background.paper' }}>
                                {submissionSuggestions ? submissionSuggestions : "Pro-tip: Type [[search terms]] followed by a space to auto-link a submission that matches your search terms."}
                            </Box>

                            <FormGroup>
                                <FormControlLabel control={<Checkbox defaultChecked={submissionIsAnonymous} onChange={handleAnonymous} />} label="Anonymous" />
                            </FormGroup>

                            <br />



                            {(submissionMode == "create" || submissionMode == "reply") ?
                                <FormControl
                                    sx={{ minWidth: 200, marginTop: "20px", maxHeight: 150 }}
                                >
                                    <InputLabel id="demo-simple-select-label">
                                        Select Community
                                    </InputLabel>

                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        style={{ backgroundColor: "white" }}
                                        label="Select Community"
                                        value={submissionCommunities}
                                        onChange={(event) => {
                                            setSubmissionProps({ submissionCommunities: event.target.value })
                                            setSubmissionProps({ submissionCommunity: event.target.value })
                                        }}
                                    // value={community}
                                    // onChange={(event) => setCommunity(event.target.value)}
                                    >
                                        {props.submissionCommunitiesNameMap && Array.isArray(props.submissionCommunitiesNameMap) &&
                                            props.submissionCommunitiesNameMap.map(function (d, idx) {
                                                return (
                                                    <MenuItem key={idx} value={d.community_id}>
                                                        {d.name}
                                                    </MenuItem>
                                                );
                                            })
                                        }

                                        {props.submissionCommunitiesNameMap && !Array.isArray(props.submissionCommunitiesNameMap) && Object.keys(props.submissionCommunitiesNameMap).map(function (key, index) {
                                            return (
                                                <MenuItem key={index} value={key}>
                                                    {props.submissionCommunitiesNameMap[key]}
                                                </MenuItem>
                                            );
                                        })}

                                    </Select>
                                </FormControl>
                                : null}

                            {submissionMode == "reply" ?
                                <div>
                                    <br />
                                    <h6 align="center">
                                        Or by connecting an existing submission
                                    </h6>
                                    <TextField
                                        margin="dense"
                                        id="message"
                                        name="message"
                                        value={connection}
                                        onChange={(event) => setConnection(event.target.value)}
                                        label="Paste Connection ID"
                                        fullWidth
                                        variant="standard"
                                    />
                                </div>
                                : null}
                        </DialogContent>

                        <DialogActions>
                            <Button onClick={props.handle_close}>Cancel</Button>
                            <Button onClick={handleSubmit}>Save</Button>
                        </DialogActions>
                        <Snackbar open={openSnackbar} autoHideDuration={6000} >
                            <Alert
                                severity={severity}
                                sx={{ width: "100%" }}
                            >
                                {message}
                            </Alert>
                        </Snackbar>
                    </div >}
                </>
            </div>
    )
}
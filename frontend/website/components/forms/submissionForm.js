import katex from "katex";
import "katex/dist/katex.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import rehypeSanitize from "rehype-sanitize";


import jsCookie from "js-cookie";
import React, { useState } from "react";

import dynamic from 'next/dynamic'
import { FormControl, InputLabel, Select } from "@mui/material";
import Button from "@mui/material/Button";

import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import Box from '@mui/material/Box';

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const AUTOCOMPLETE_ENDPOINT = baseURL_client + "autocomplete"


const SUB_WEB_ENDPOINT = process.env.NEXT_PUBLIC_FROM_CLIENT + "submissions/";


export default function SubmissionForm(props) {

    // in props:
    // communityNameMap
    // method (reply, create, edit)
    // source_url, title, description (empty text if not there, needed on edit)
    // submission_id (empty text if not there, needed on edit)


    // States for Alerts
    const [openSnackbar, setOpenSnackbar] = React.useState(false);
    const [severity, setSeverity] = React.useState("error");
    const [message, setMessage] = React.useState("");

    // must always pass (make empty if creating)
    const [sourceURL, setSourceURL] = useState(props.source_url)
    const [title, setTitle] = useState(props.title)
    const [description, setDescription] = useState(props.description)

    const [suggestions, setSuggestions] = useState(null)

    const [community, setCommunity] = useState("")

    const [connection, setConnection] = useState("")

    const [currentQuery, setCurrentQuery] = useState("")

    const handleAutoSuggestClick = async (event) => {

        const regex = /\[\[([^\]]+)\]\]/i;
        var replacement_text = "[" + event.target.title + "](" + SUB_WEB_ENDPOINT + event.target.id + ")"
        var new_desc = description.replace(regex, replacement_text)
        setDescription(new_desc)
        setCurrentQuery("")
        setSuggestions(null)
    }

    const getSuggestions = async (text) => {

        if (text == currentQuery) {
            return
        }

        const res = await fetch(AUTOCOMPLETE_ENDPOINT + "?query=" + text + "&topn=5&cutoff=33", {
            method: "GET",
            headers: new Headers({
              Authorization: jsCookie.get("token"),
            }),
          });
          const response = await res.json();
          if (res.status == 200) {
            setSuggestions(response.suggestions.map((x) =>
                <Button onClick={handleAutoSuggestClick} id={x.id} title={x.label}>
                    {x.label} 
                </Button>
            ));
            setCurrentQuery(text)
          } else {
            console.log(response.message)
            setSuggestions(null)
          }
    }

    const setDescriptionListener = async (text) => {
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


    const handleSubmit = async (event) => {
        var DATA = {
            community: community,
            source_url: sourceURL,
            title: title,
            description: description
        }

        

        var URL = baseURL_client
        var METH = "POST"


        if (props.method == "create") {
            URL = URL + "submission/"

        } else if (props.method == "reply") {

            URL = URL + "connect/"
            DATA["connection_target"] = connection
            DATA["connection_source"] = props.submission_id

        } else if (props.method == "edit") {
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
            if (props.method == "edit" || props.method == "reply") {
                window.location.reload();
            } else {
                props.handle_close()
            }
        } else {
            setSeverity("error");
            setMessage(response.message);
            setOpenSnackbar(true);
        }
    };


    return (
        <div>
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
                    value={sourceURL}
                    onChange={(event) => setSourceURL(event.target.value)}
                />
                <TextField
                    margin="dense"
                    id="submissionTitle"
                    label="Submission Title"
                    fullWidth
                    variant="standard"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
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
                        value={description}
                        onChange={(value) => setDescriptionListener(value)}
                        highlightEnable={false}
                        preview="live"
                        maxHeight="400"
                        minHeight="200"
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
                </Box>

                {(props.method == "create" || props.method == "reply") ?
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
                            value={community}
                            onChange={(event) => setCommunity(event.target.value)}
                        >
                            {props.communityNameMap && Array.isArray(props.communityNameMap) &&
                                props.communityNameMap.map(function (d, idx) {
                                    return (
                                      <MenuItem key={idx} value={d.community_id}>
                                        {d.name}
                                      </MenuItem>
                                    ); 
                                })
                            }

                            {props.communityNameMap && !Array.isArray(props.communityNameMap) && Object.keys(props.communityNameMap).map(function (key, index) {
                                return (
                                    <MenuItem key={index} value={key}>
                                        {props.communityNameMap[key]}
                                    </MenuItem>
                                );
                            })}
                            
                        </Select>
                    </FormControl>
                    : null}

                {props.method == "reply" ?
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
                <Button onClick={handleSubmit}>Submit</Button>
            </DialogActions>
            <Snackbar open={openSnackbar} autoHideDuration={6000} >
                <Alert
                    severity={severity}
                    sx={{ width: "100%" }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </div>
    )
}
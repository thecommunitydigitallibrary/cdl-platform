import React, { useState } from "react";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";
import rehypeSanitize from "rehype-sanitize";

import katex from "katex";
import "katex/dist/katex.css";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { Box, Button, Grid, IconButton } from "@mui/material";
import dynamic from "next/dynamic";
import Hashtags from "./hashtags";
import SubmissionForm from "../forms/submissionForm";
import useSubmissionStore from "../../store/submissionStore";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });


const NoteEditor = (props) => {

    const {
        submissionTitle,
        originalDescription,
        submissionDescription,
        submissionCommunities,
        submissionSourceUrl,
        submissionIsAnonymous,
        submissionMode,
        submissionId,
        submissionIncomingConnections,
        submissionUsername,
        submissionLastModified,
        setSubmissionProps
    } = useSubmissionStore();

    const submissionDataResponse = props.data;
    const [title, setTitle] = useState("");
    // const [mode, setMode] = useState("view");
    const [content, setContent] = useState("");

    const isDisabled = submissionMode === "view";

    const getCodeString = (children) => {
        // get code string logic here
    };

    return (
        <div style={{ position: "relative", width: '100%' }}>
            <Grid container rowSpacing={0.5} direction={'column'}>
                <Grid item>
                    <SubmissionForm isAConnection={false} />
                </Grid>
                <Grid item>
                    <Hashtags submissionDataResponse={props.data} />
                </Grid>
            </Grid>

        </div >
    );
};

export default NoteEditor;

import React from "react";

import "katex/dist/katex.css";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { Grid } from "@mui/material";
import Hashtags from "./hashtags";
import SubmissionForm from "../forms/submissionForm";
import useSubmissionStore from "../../store/submissionStore";

const NoteEditor = (props) => {

    const { submissionMode } = useSubmissionStore();

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

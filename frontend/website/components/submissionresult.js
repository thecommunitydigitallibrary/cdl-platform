import Paper from "@mui/material/Paper";

import React, { useState, useContext } from "react";

function SubmissionResult(props) {
  return (
    <Paper
      elevation={0}
    //   id={"card_id" + props.search_idx}
      sx={{ width: "800px", padding: "0px 20px 0px 10px" }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ margin: "0px 0px 0px 0px" }}>
          <a
            style={{ fontSize: "24px" }}
            // href={props.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            props.explanation
          </a>
          <p
            style={{
              fontSize: "14px",
              color: "#808080",
              margin: "0px 0px 1px 0px",
            }}
          >
            props.display_url
          </p>
        </div>

      
      </div>
      {/* restricting text to only 250 characters per result to make it more uniform */}
      <p>props.highlighted_text.slice(0, 200)..</p>
    </Paper>
  );
}

export default SubmissionResult;

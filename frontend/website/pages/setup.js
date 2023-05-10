import Paper from "@mui/material/Paper";

import * as React from "react";
import VerticalLinearStepper from "../components/verticalstepper";

const steps = [
  {
    label: "Create an Account",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        An account can be created <a href="/auth">here</a>. 
        Please create an account using a valid email address. Please write
        down your password! Once you create an account, 
        navigate back to this step and continue the setup.
      </p>
    ),
  },
  {
    label: "Install the Chrome Extension",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        The Chrome extension can be downloaded from <a href="https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0">the Chrome Web Store</a>. After installing, don't forget to pin the newly-added extension to your browser.
      </p>
    ),
  },
  {
    label: "Log in to the Chrome Extension",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        After opening the extension, you should see a login screen. Please log
        in to the extension with the same credentials as you used for the
        website account that you created in Step 2.
      </p>
    ),
  },
  {
    label: "Start using the CDL!",
    description: (
      <p style={{ margin: "10px 0px 0px 0px" }}>
        Once you are logged in to the Chrome extension and to the website, you are ready to go! More details about submission, connections, and communities
        can be found on the next tab titled "Usage".
      </p>
    ),
  },
];

export default function Setup() {
  return (
    <Paper
      elevation={0}
      sx={{
        padding: "10px 20px 5px 20px",
        width: "1200px",
        display: "flex",
        flexDirection: "column",
        margin: "auto",
      }}
    >
      <h1 style={{ margin: "10px 0px 10px 0px" }}>
        {" "}
        Setting up the Community Digital Library{" "}
      </h1>
      The following instructions will walk you through account creation and Chrome extension setup.
      <VerticalLinearStepper steps={steps} />
    </Paper>
  );
}

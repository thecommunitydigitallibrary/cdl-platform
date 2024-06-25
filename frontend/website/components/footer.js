import React from "react";
import jsCookie from "js-cookie";
import Router from "next/router";

import Card from "@mui/material/Card";
import Button from "@mui/material/Button";

// Dialog related imports
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";

// Snackbar related imports
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Container from "./homepage/container";
import { Link } from "@mui/material";
import Image from "next/image";

import { BASE_URL_CLIENT, FEEDBACK_ENDPOINT } from "../static/constants"



// API and endpoints
function NavigateTo(route) {
  Router.push(route);
}

export default function Footer(props) {
  var style_params;
  if (props.alt) {
    style_params = {
      marginTop: "25px",
      width: "100%",
      borderRadius: "0px",
      left: "0",
      position: "absolute",
    };
  } else {
    style_params = {
      marginTop: "25px",
      width: "100%",
      position: "fixed",
      bottom: "0",
      left: "0",
      borderRadius: "0px",
    };
  }

  const navigationCol1 = {
    About: { label: "About", value: "/about" },
    Contribute: { label: "Contribute", value: "https://github.com/thecommunitydigitallibrary/cdl-platform" },
  };

  const navigationCol2 = {
    Setup: { label: "Setup Instructions", value: "/community/661056f76eff65a5d6228a9d" },
    PrivacyPolicy: { label: "Privacy Policy", value: "/privacy" },
    ReleaseLog: { label: "Release Log", value: "/releaselog" },
    Documentation: { label: "Documentation", value: "/documentation" }
  };

  // Necessary States for Alert Message
  const [showSnackbar, setSnackbarState] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("error");

  const handleClickSnackbar = () => {
    setSnackbarState(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarState(false);
  };

  const handleSubmitFeedback = async () => {
    var URL = BASE_URL_CLIENT + FEEDBACK_ENDPOINT;
    var feedback_message = document.getElementById("feedbackInput").value;
    console.log(feedback_message);
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        submission_id: "",
        message: feedback_message,
      }),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status == 200) {
      setSeverity("success");
    } else {
      setSeverity("error");
    }
    setMessage(response.message);
    handleClickSnackbar();
    handleCloseFeedbackModal();
  };

  // Necessary variables and functions for Feedback modal
  const [showFeedbackModal, setFeedbackModalOpen] = React.useState(false);
  const handleOpenFeedbackModal = () => {
    setFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setFeedbackModalOpen(false);
  };

  // Necessary variables and functions for Contact modal
  const [showContactModal, setContactModalOpen] = React.useState(false);
  const handleOpenContactModal = () => {
    setContactModalOpen(true);
  };

  const handleCloseContactModal = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setContactModalOpen(false);
  };

  function CopyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
      setSeverity("success");
      setMessage("Copied Kevin's email successfully!");
      handleClickSnackbar();
    } catch {
      setSeverity("error");
      setMessage("Couldn't copy Kevin's email to clipboard.");
      handleClickSnackbar();
    }
  }
  return (
    <>
      <div sx={{ position: 'absolute', bottom: 0 }} >
        <div className="grid max-w-screen-xl grid-cols-1 gap-10 pt-10 mx-auto border-t border-gray-100 dark:border-trueGray-700 lg:grid-cols-5 sm:p-2">
          <div className="lg:col-span-2">
            <div>
              {" "}
              <a href="/" className="flex items-center space-x-2 text-2xl font-medium text-blue-500 dark:text-gray-100 no-underline">
                <Image
                  src="/images/tree48.png"
                  alt="TextData"
                  width="32"
                  height="32"
                  className="w-8"
                />
                <span>TextData</span>
              </a>
            </div>

            <div className="max-w-md mt-4 text-gray-500 dark:text-gray-400">
              TextData is an online platform designed to remove the knowledge barriers of online information discovery by leveraging the collaboration of communities.
            </div>


          </div>

          <div>
            <div className="flex flex-wrap w-full -ml-3 lg:ml-0">
              {Object.entries(navigationCol1).map(([key, { label, value }]) => (
                <Link
                  key={key}
                  href={value}
                  className="w-full px-4 py-2 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-trueGray-700 no-underline"
                >
                  {label}
                </Link>
              ))}
              <p
                onClick={handleOpenFeedbackModal}
                className="w-full px-4 py-2 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-trueGray-700 no-underline"
                style={{ cursor: "pointer" }}
              >
                Feedback
              </p>
              <p
                onClick={handleOpenContactModal}
                className="w-full px-4 py-2 -mt-4 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-trueGray-700 no-underline"
                style={{ cursor: "pointer" }}
              >
                Contact
              </p>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap w-full -ml-3 lg:ml-0">
              {Object.entries(navigationCol2).map(([key, { label, value }]) => (
                <Link
                  key={key}
                  href={value}
                  className="w-full px-4 py-2 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-trueGray-700 no-underline"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="">
            <div>Social Media links</div>
            <div className="flex mt-3 space-x-5 text-gray-400 dark:text-gray-500">
              {/* <a
                href="https://github.com/thecommunitydigitallibrary/cdl-platform"
                target="_blank"
                rel="noopener">
                <span className="sr-only">Twitter</span>
                <Twitter />
              </a> */}
              <a
                href="https://www.linkedin.com/company/text-data/"
                target="_blank"
                rel="noopener">
                <span className="sr-only">Linkedin</span>
                <Linkedin />
              </a>
            </div>
          </div>
        </div>

        {/* Dialog for Feedback */}
        <Dialog open={showFeedbackModal} onClose={handleCloseFeedbackModal}>
          <DialogTitle>Feedback</DialogTitle>
          <DialogContent style={{ width: "500px" }}>
            <DialogContentText>
              If you have any suggestions or feedback, you may input
              it into the field below and submit it.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="feedbackInput"
              label=""
              fullWidth
              multiline
              variant="outlined"
              defaultValue=""
              rows={5}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFeedbackModal}>Cancel</Button>
            <Button onClick={handleSubmitFeedback}>Submit</Button>
          </DialogActions>
        </Dialog>
        {/* Dialog for Contact */}
        <Dialog open={showContactModal} onClose={handleCloseContactModal}>
          <DialogTitle>Get in Contact</DialogTitle>
          <DialogContent style={{ width: "500px" }}>
            <DialogContentText>
              <p>
                If you encounter an issues, please reach out to Kevin. His email
                is{" "}
                <p
                  onClick={() => CopyToClipboard("kjros2@illinois.edu")}
                  style={{
                    cursor: "pointer",
                    display: "inline-block",
                    color: "#3281a8",
                  }}
                >
                  kjros2@illinois.edu
                </p>{" "}
                (Click to copy the email).
              </p>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseContactModal}>OK</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={severity}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
}



const Twitter = ({ size = 24 }) => (
  <svg

    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor">
    <path d="M24 4.37a9.6 9.6 0 0 1-2.83.8 5.04 5.04 0 0 0 2.17-2.8c-.95.58-2 1-3.13 1.22A4.86 4.86 0 0 0 16.61 2a4.99 4.99 0 0 0-4.79 6.2A13.87 13.87 0 0 1 1.67 2.92 5.12 5.12 0 0 0 3.2 9.67a4.82 4.82 0 0 1-2.23-.64v.07c0 2.44 1.7 4.48 3.95 4.95a4.84 4.84 0 0 1-2.22.08c.63 2.01 2.45 3.47 4.6 3.51A9.72 9.72 0 0 1 0 19.74 13.68 13.68 0 0 0 7.55 22c9.06 0 14-7.7 14-14.37v-.65c.96-.71 1.79-1.6 2.45-2.61z" />
  </svg>
);

const Facebook = ({ size = 24 }) => (
  <svg

    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor">
    <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
  </svg>
);
const Instagram = ({ size = 24 }) => (
  <svg

    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor">
    <path d="M16.98 0a6.9 6.9 0 0 1 5.08 1.98A6.94 6.94 0 0 1 24 7.02v9.96c0 2.08-.68 3.87-1.98 5.13A7.14 7.14 0 0 1 16.94 24H7.06a7.06 7.06 0 0 1-5.03-1.89A6.96 6.96 0 0 1 0 16.94V7.02C0 2.8 2.8 0 7.02 0h9.96zm.05 2.23H7.06c-1.45 0-2.7.43-3.53 1.25a4.82 4.82 0 0 0-1.3 3.54v9.92c0 1.5.43 2.7 1.3 3.58a5 5 0 0 0 3.53 1.25h9.88a5 5 0 0 0 3.53-1.25 4.73 4.73 0 0 0 1.4-3.54V7.02a5 5 0 0 0-1.3-3.49 4.82 4.82 0 0 0-3.54-1.3zM12 5.76c3.39 0 6.2 2.8 6.2 6.2a6.2 6.2 0 0 1-12.4 0 6.2 6.2 0 0 1 6.2-6.2zm0 2.22a3.99 3.99 0 0 0-3.97 3.97A3.99 3.99 0 0 0 12 15.92a3.99 3.99 0 0 0 3.97-3.97A3.99 3.99 0 0 0 12 7.98zm6.44-3.77a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z" />
  </svg>
);

const Linkedin = ({ size = 24 }) => (
  <svg

    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor">
    <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.27 20.1H3.65V9.24h3.62V20.1zM5.47 7.76h-.03c-1.22 0-2-.83-2-1.87 0-1.06.8-1.87 2.05-1.87 1.24 0 2 .8 2.02 1.87 0 1.04-.78 1.87-2.05 1.87zM20.34 20.1h-3.63v-5.8c0-1.45-.52-2.45-1.83-2.45-1 0-1.6.67-1.87 1.32-.1.23-.11.55-.11.88v6.05H9.28s.05-9.82 0-10.84h3.63v1.54a3.6 3.6 0 0 1 3.26-1.8c2.39 0 4.18 1.56 4.18 4.89v6.21z" />
  </svg>
);

const Backlink = () => {
  return (
    <></>
  );
};

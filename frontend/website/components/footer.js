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

// API and endpoints
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const feedback_endpoint = "feedback/";

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
    var URL = baseURL_client + feedback_endpoint;
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
      <Card variant="outlined" sx={style_params}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            margin: "15px 0px",
          }}
        >
          <p
            onClick={() => NavigateTo("/about")}
            style={{ cursor: "pointer", margin: "0px 0px 0px 25px" }}
          >
            About
          </p>
          <p
            onClick={() => NavigateTo("/privacy")}
            style={{ cursor: "pointer", margin: "0px 0px 0px 25px" }}
          >
            Privacy Policy
          </p>
          <p
            onClick={handleOpenFeedbackModal}
            style={{ cursor: "pointer", margin: "0px 0px 0px 25px" }}
          >
            Feedback
          </p>
          <p
            onClick={handleOpenContactModal}
            style={{ cursor: "pointer", margin: "0px 0px 0px 25px" }}
          >
            Contact
          </p>
        </div>

        {/* Dialog for Feedback */}
        <Dialog open={showFeedbackModal} onClose={handleCloseFeedbackModal}>
          <DialogTitle>Feedback</DialogTitle>
          <DialogContent style={{ width: "500px" }}>
            <DialogContentText>
              If you have any suggestions or feedback for the CDL, you may input
              it into the field below and submit it.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="feedbackInput"
              label=""
              fullWidth
              multiline
              variant="standard"
              defaultValue=""
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
      </Card>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={2000}
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
    </>
  );
}

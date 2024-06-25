import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
// Import MaterialUI Components
import { Snackbar, Alert } from "@mui/material";
import { Paper, IconButton } from "@mui/material";
import { AddCircle, East, Add, ControlPoint } from "@mui/icons-material";

import { BASE_URL_CLIENT, COMMUNITIES_ENDPOINT } from "../../static/constants";

export default function CreateCommunityForm(props) {
  // States for Login/Create Account Alerts
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [severity, setSeverity] = React.useState("error");
  const [message, setMessage] = React.useState("");
  const handleClick = () => {
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const updateDropDownSearch = async () => {
    let resp = await fetch(BASE_URL_CLIENT + COMMUNITIES_ENDPOINT, {
      method: "GET",
      headers: new Headers({
        Authorization: props.auth_token,
        "Content-Type": "application/json",
      }),
    });
    const responseComm = await resp.json();
    localStorage.setItem("dropdowndata", JSON.stringify(responseComm));
  };

  const handleSubmit = async (event) => {
    // Get Text Field element, it's value is the name typed by user
    let text_field = document.getElementById("CreateCommunityInputField");
    if (text_field.value == "") {
      setSeverity("error");
      setMessage("Field should not be empty");
      handleClick();
      return;
    }
    event.preventDefault();
    var URL = BASE_URL_CLIENT + COMMUNITIES_ENDPOINT;
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        community_name: text_field.value,
      }),
      headers: new Headers({
        Authorization: props.auth_token,
        "Content-Type": "application/json",
      }),
    });

    const response = await res.json();
    if (res.status == 200) {
      setSeverity("success");
      setMessage(response.message);
      handleClick();
      // updating dropdown data when new comm is created
      updateDropDownSearch();
      handleClose();
      window.location.reload();
    } else {
      setSeverity("error");
      setMessage(response.message);
      handleClick();
    }
    handleClose();
  };

  return (
    <div>
      <Paper
        sx={{
          borderRadius: "15px",
          padding: "10%",
          width: "275px",
          height: "250px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2>Create</h2>
        <p style={{ overflow: "auto" }}>
          Create a community for a class, for a reading group, or for your own
          personal archives.
        </p>
        <IconButton
          style={{
            margin: "0px",
            width: "50px",
            height: "50px",
            alignSelf: "start",
          }}
          size="large"
          onClick={handleClickOpen}
        >
          <ControlPoint sx={{ fontSize: "45px" }} />
        </IconButton>
      </Paper>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> What's the Community Name?</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="CreateCommunityInputField"
            label="Community Name"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
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
  );
}

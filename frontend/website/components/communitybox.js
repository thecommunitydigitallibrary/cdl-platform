import {
  Paper,
  IconButton,
  ButtonGroup,
  Button,
  Alert,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Key, Logout, Edit, VerifiedUser, Person } from "@mui/icons-material";

import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import jsCookie from "js-cookie";
import useUserDataStore from "../store/userData";
import useQuickAccessStore from "../store/quickAccessStore";
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { BASE_URL_CLIENT, LEAVE_COMMUNITY_ENDPOINT, FOLLOW_COMMUNITY_ENDPOINT, COMMUNITIES_ENDPOINT } from "../static/constants";

export default function CommunityBox(props) {
  // Necessary States for Alert Message
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("error");

  const { setUserDataStoreProps } = useUserDataStore();

  const { communityData, setcommunityData } = useQuickAccessStore();

  const [isPublic, setPublic] = useState(props.is_public)
  const [followDeck, setFollowDeck] = useState(props.followDeck)


  const handleClick = () => {
    setOpen(true);
  };
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  // Necessary variables and functions for edit
  const [openEdit, setOpenEdit] = useState(false);
  const handleClickEdit = () => {
    setOpenEdit(true);
  };

  const handleCloseEdit = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenEdit(false);
  };

  const updateDropDownSearch = async () => {
    let resp = await fetch(BASE_URL_CLIENT + COMMUNITIES_ENDPOINT, {
      method: "GET",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const responseComm = await resp.json();
    console.log(responseComm)
    setUserDataStoreProps({ userCommunities: responseComm.community_info });
    setUserDataStoreProps({ userFollowedCommunities: responseComm.followed_community_info });
    setcommunityData(responseComm.community_info);
    localStorage.setItem("dropdowndata", JSON.stringify(responseComm));
  };

  const handlePublic = async (event) => {
    if (isPublic) {
      setPublic(false)
    } else {
      setPublic(true)
    }
  }

  const handleSubmitEdit = async () => {
    var URL = BASE_URL_CLIENT + COMMUNITIES_ENDPOINT;
    let title_field = document.getElementById("editCommunityName");
    let desc_field = document.getElementById("editCommunityDescription");
    let pinned = document.getElementById("editCommunityPinned");
    let is_public = isPublic;
    if (title_field.value == "") {
      setSeverity("error");
      setMessage("Community Name field should not be empty");
      handleClick();
      return;
    }
    const res = await fetch(URL, {
      method: "PATCH",
      body: JSON.stringify({
        community_name: title_field.value,
        community_id: props.communityId,
        community_description: desc_field.value,
        community_pinned: pinned.value,
        community_is_public: is_public
      }),
      headers: new Headers({
        Authorization: props.auth,
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status == 200) {
      setSeverity("success");
      setMessage(response.message);
      handleClick();
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

  const copyJoinKey = (event) => {
    try {
      navigator.clipboard.writeText(props.joinKey);
      setSeverity("success");
      setMessage("Join key copied to clipboard");
      handleClick();
    } catch {
      setSeverity("error");
      setMessage("Could not copy join key to clipboard");
      handleClick();
    }
  };
  // Necessary variables and functions for leaving a community
  const [openLeave, setOpenLeave] = useState(false);
  const handleClickLeave = () => {
    setOpenLeave(true);
  };

  const handleCloseLeave = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenLeave(false);
  };

  const leaveCommunity = async (event) => {
    var URL = BASE_URL_CLIENT + LEAVE_COMMUNITY_ENDPOINT;
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        community_id: props.communityId,
      }),
      headers: new Headers({
        Authorization: props.auth,
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
  };

  const unfollowCommunity = async (event) => {

    var URL = BASE_URL_CLIENT + FOLLOW_COMMUNITY_ENDPOINT;
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        community_id: props.communityId,
        command: "unfollow"
      }),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
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
    }

    else {
      setSeverity("error");
      setMessage(response.message);
      handleClick();
    }
  }



  return (
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
      <h3 style={{ fontSize: "28px" }} color="blue" >
        <a href={props.link} target="_blank">{props.children.slice(0, 35)}</a>
        {props.children.length > 35 ? ".." : ""}
      </h3>
      <Tooltip
        title={
          <Typography color="inherit">
            {props.description != ""
              ? props.description
              : "No description has been added for this community."}
          </Typography>
        }
        placement="right-start"
        enterDelay={500}
        arrow
      >
        <div style={{ overflow: "auto", height: "65%" }}>
          <p style={{ textOverflow: "auto" }}>
            {" "}
            {props.description != ""
              ? props.description
              : "No description has been added for this community."}
          </p>
        </div>
      </Tooltip>

      <ButtonGroup
        sx={{
          marginTop: "auto",
          marginLeft: "-5px",
          marginBottom: "-10px",
          display: "flex",
        }}
      >
        {props.isAdmin ? (
          <Tooltip title={<Typography>Copy Join Key</Typography>}>
            <IconButton
              style={{ marginRight: "5px" }}
              size="small"
              onClick={copyJoinKey}
            >
              <Key />
            </IconButton>
          </Tooltip>
        ) : null}

        {/* // Visibility toggle not intended for next release
          <Tooltip title="Toggle Permissions">
            <IconButton size="small">
              <Visibility />
            </IconButton>
            
          </Tooltip> */}

        {props.isAdmin ? (
          <Tooltip title={<Typography>Edit Details</Typography>}>
            <IconButton size="small" onClick={handleClickEdit}>
              <Edit />
            </IconButton>
          </Tooltip>
        ) : null}
        {props.isAdmin ? (
          <Tooltip title={<Typography>Admin</Typography>}>
            <VerifiedUser
              sx={{
                marginLeft: "5px",
                marginTop: "5px",
                color: "#2c97e8",
              }}
            />
          </Tooltip>
        ) : (
          <Tooltip title={<Typography>User</Typography>}>
            <Person
              sx={{
                marginLeft: "5px",
                marginTop: "5px",
                color: "#2c97e8",
              }}
            />
          </Tooltip>
        )}
        {
          <Tooltip title={<Typography>{followDeck ? "Unfollow Community" : "Leave Community"}</Typography>}>
            <IconButton
              style={{ marginLeft: "auto", marginRight: "-10px" }}
              size="small"
              onClick={handleClickLeave}
            >
              <Logout />
            </IconButton>
          </Tooltip>
        }
      </ButtonGroup>
      <Dialog open={openEdit} onClose={handleCloseEdit}>
        <DialogTitle style={{ width: "500px" }}>
          {" "}
          Edit Community Details{" "}
        </DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="editCommunityName"
            label="Community Name"
            fullWidth
            variant="standard"
            defaultValue={props.children}
          />

          <TextField
            autoFocus
            margin="dense"
            id="editCommunityDescription"
            label="Community Description"
            fullWidth
            variant="standard"
            defaultValue={props.description}
          />

          <TextField
            autoFocus
            margin="dense"
            id="editCommunityPinned"
            label="Pinned Submissions (IDs separated by commas)"
            fullWidth
            variant="standard"
            defaultValue={props.pinned}
          />
          <FormGroup>
            <FormControlLabel control={<Checkbox defaultChecked={isPublic} onChange={handlePublic} />} label="Public" />
          </FormGroup>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button onClick={handleSubmitEdit}>Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openLeave} onClose={handleCloseLeave}>
        {followDeck ? <DialogTitle style={{ width: "500px" }}> Unfollow Community? </DialogTitle> :
          <DialogTitle style={{ width: "500px" }}> Leave Community? </DialogTitle>
        }
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave {props.name}?
          </DialogContentText>
        </DialogContent>
        {props.isAdmin ? (
          <Alert severity="info">You are an admin for this community.</Alert>
        ) : null}
        <DialogActions>
          <Button onClick={handleCloseLeave}>Cancel</Button>
          <Button style={{ color: "red" }} onClick={() => { followDeck ? unfollowCommunity() : leaveCommunity() }}>

            I'm Sure
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

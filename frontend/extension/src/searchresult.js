import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
 
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import MoreVert from "@mui/icons-material/MoreVert";
import LocalLibraryRoundedIcon from '@mui/icons-material/LocalLibraryRounded';
import ThumbDownRoundedIcon from '@mui/icons-material/ThumbDownRounded';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import TagIcon from '@mui/icons-material/Tag';
import FeedbackIcon from "@mui/icons-material/Feedback";
import ShareIcon from "@mui/icons-material/Share";

import React, { useState } from "react";
import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Alert
} from "@mui/material";
import { Close, Launch } from "@mui/icons-material";

// DIFFERENT FOR WEBSITE AND EXTENSION
const baseURL = localStorage.getItem('backendSource') + "api/";
const websiteURL = localStorage.getItem('backendSource');

const submissionEndpoint = "submissions";
const relJudgmentEndpoint = "submitRelJudgments";
const postFeedbackEndpoint = "feedback";
const searchEndpoint = "search";



function SearchResult(props) {

const [message, setMessage] = React.useState("");
const [severity, setSeverity] = React.useState("");
const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };


  const submitRelevanceJudgements = async function (rel) {
    let URL = baseURL + relJudgmentEndpoint;
    
    // Judgement key-value pair
    let judgement = {};
    judgement[props.result_hash] = rel;

    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify(judgement),
      headers: new Headers({
        Authorization: props.auth_token,
        "Content-Type": "application/json",
      }),
    });

    const response = await res.json();
    if (res.status === 200) {
      setSeverity("success");
    } else {
      setSeverity("error");
    }
    setMessage(response.message);
    handleClick();
  };


  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenOptionsMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseOptionsMenu = () => {
    setAnchorElUser(null);
  };

  const [openFeedbackForm, setOpenFeedbackForm] = React.useState(false);

  const handleClickOpenFeedbackForm = () => {
    setOpenFeedbackForm(true);
  };

  const handleCancelFeedbackForm = () => {
    setFeedbackMessage("")
    setOpenFeedbackForm(false)
    handleCloseOptionsMenu()
  }

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const handleMessageType = event => {
    setFeedbackMessage(event.target.value);
  };


  const handleCreateFeedbackForm = async (event) => {
    //send feedback
    var URL = baseURL + postFeedbackEndpoint + "/"
    const res = await fetch(URL,
      {
        method: "POST",
        body: JSON.stringify({
          "submission_id": props.submission_id,
          "message": feedbackMessage
        }),
        headers: new Headers({
          "Authorization": localStorage.getItem('authToken'),
          "Content-Type": "application/json"
        })
      })
    const response = await res.json();
    setOpenFeedbackForm(false);
    setFeedbackMessage("");
    handleCloseOptionsMenu();
  }

  const [shareUrlLink, setShareUrlLink] = useState('')
  const [connectionID, setConnectionID] = useState('')
  const [snackBarMessage,setSnackBarMessage] = useState('');


  const handleClickOptionsMenu = (event, option, param) => {
    // console.log('clicked ' + option);

    switch (option) {
      case "view":
        //DIFFERENT FOR EXTENSION
        window.open(websiteURL + submissionEndpoint + "/" + param)
        break;
      case "share":
        handleShareUrl(param)
        handleCloseOptionsMenu()
        break;
      case "feedback":
        handleClickOpenFeedbackForm()
        break;
      case "connID":
        handleGetConnectionID(param)
        handleCloseOptionsMenu()
        break;
      default:
        break;
    }
  };
  const handleCloseSnackbar = (event, reason) => {
    setOpenShareUrlSuccess(false);
  };

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnackbar}
      >
        <Close fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  const [openShareUrlSuccess, setOpenShareUrlSuccess] = React.useState(false);

  async function copyPageUrl(linkToCopy) {
    try {
      await navigator.clipboard
        .writeText(linkToCopy)
        .then(() => {
          setOpenShareUrlSuccess(true);
        })
        .catch(() => {
          setShareUrlLink("Error sharing URL");
        });
    } catch (err) {
      // console.error("Failed to copy: ", err);
    }
  }

  const handleShareUrl = (subId) => {
    if(subId){
      var shareLink = websiteURL+ submissionEndpoint + "/" + subId
      setShareUrlLink(shareLink)
      setSnackBarMessage("Link copied: " +  shareLink)
      copyPageUrl(shareLink)
    }
    else{
      setShareUrlLink('Error sharing URL')
    }
  };

  const handleGetConnectionID = (subId) => {
    if(subId){
      setConnectionID(subId)
      setSnackBarMessage("Connection ID copied: "+subId)
      copyPageUrl(subId)
    }
    else{
      setConnectionID('Error getting Connection ID')
    }
  };

  if(props.hashtags){
    var hashtag_results = props.hashtags.map(function(item){
      return(
        <a 
        href={websiteURL + "search?query=" + encodeURIComponent(item) + "&community=all&page=0"} 
        target="_blank"
        rel="noopener noreferrer" 
        style = {{ fontSize:"15px",
          display: "inline", paddingRight : "15px"}}
        >{item}</a>
      );
    });
  }

  if (props.communities_part_of) {
    var communityNamesList = Object.keys(props.communities_part_of).map(
      function (key) {
        return (
          <a
            href={websiteURL + searchEndpoint + "?community=" + key + "&page=0"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:"inline",
              paddingRight:"15px",
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontWeight: "500",
              fontSize: "0.8125rem",
              lineHeight: "1.75",
              letterSpacing: "0.02857em",
              textTransform: "uppercase",
              color: "#1976d2",
              padding: "3px 7px",
              marginRight: "5px",
              textDecoration: "none",
              background: "aliceblue"
            }}
          >
            {props.communities_part_of[key]}
        </a>
        );
      }
    );
  } else {
    var communityNamesList = [];
  }

  let image_url;
  if (props.display_url != null) {
    let domain = props.display_url.split(">")[0].trim();
    image_url = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32";
  } else {
    image_url = "https://t1.gstatic.com/faviconV2";
  }

  return (
    <Paper
      elevation={0}
      id={"card_id" + props.search_idx}
      sx={{ width: '100%', float:"left"}}
    >
      <div>
      <div style={{ display: "flex" }}>
        <div>
        <img
          style={{
            width: "20px",
            height: "20px",
            paddingTop: "3px",
            paddingRight: "5px",
            alignItems: 'flex-end',
          }}
            src={image_url}
        />
       </div>
        <div style={{ margin: "0px 0px 0px 0px"}}>
          <a 
            style={{ 
              fontSize: "17px",
              width: "100%",
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
             }}
            href={props.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {props.explanation} 
          </a>
        </div>
        
        <ButtonGroup sx={{ marginLeft: "auto", height: "35px" }}>
          <Dialog open={openFeedbackForm}>
            <DialogTitle>
              {" "}
              Feedback for{" "}
              <a
                style={{ fontSize: "20px" }}
                href={props.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.explanation}
              </a>
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="message"
                name="message"
                value={feedbackMessage}
                onChange={handleMessageType}
                label="Description"
                fullWidth
                variant="standard"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelFeedbackForm}>Cancel</Button>
              <Button onClick={handleCreateFeedbackForm}>Send</Button>
            </DialogActions>
          </Dialog>
          <Tooltip title="Options">
            <IconButton size="small" onClick={handleOpenOptionsMenu}>
              <MoreVert />
            </IconButton>
          </Tooltip>
          <Snackbar
              open={openShareUrlSuccess}
              autoHideDuration={6000}
              onClick={handleCloseSnackbar}
              message={snackBarMessage} //"Link copied: "+shareUrlLink
              action={action}
              onClose={() => setOpenShareUrlSuccess(false)}
            />
          <Menu
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseOptionsMenu}
          >
            <MenuItem
              name="view"
              onClick={(event) => handleClickOptionsMenu(event, "view", props.submission_id)}>
              <ListItemIcon>
                <Launch />
              </ListItemIcon>
              <ListItemText
              >View Submission
              </ListItemText>
            </MenuItem>
            <MenuItem
              name="feedback"
              onClick={(event) => handleClickOptionsMenu(event, "feedback")}>
              <ListItemIcon>
                <FeedbackIcon />
              </ListItemIcon>
              <ListItemText
              >Feedback</ListItemText>
            </MenuItem>
            <MenuItem
              name="shareurl"
              value={props.submission_id}
              onClick={(event) => handleClickOptionsMenu(event, "share", props.submission_id)}>
              <ListItemIcon>
                <ShareIcon />
              </ListItemIcon>
              <ListItemText
              >Share URL</ListItemText>
            </MenuItem>
            <MenuItem
              name="connID"
              onClick={(event) => handleClickOptionsMenu(event, "connID", props.submission_id)}>
              <ListItemIcon>
                <Launch />
              </ListItemIcon>
              <ListItemText
              >Get Connection ID
              </ListItemText>
            </MenuItem>
          </Menu>
        </ButtonGroup>
      </div>

      <p
          style={{
          fontSize: "14px",
          marginTop: "0px",
          color: "#808080",
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
          >
          {props.display_url}
      </p>
     
      <p style={{fontSize: "15px", 
          marginTop: "-11px",
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          }}>
          {props.highlighted_text && props.highlighted_text.length > 0 && (
            <span dangerouslySetInnerHTML={{ __html: props.highlighted_text }}></span>
          )}
      </p>


      {props.hashtags !== undefined && props.hashtags.length !== 0 &&
      <div style={{ display:"flex", marginTop:"-20px", width:"100%"}}>
          <div style={{ width:"5%", float:"left", paddingRight:"5px"}}>
          <Tooltip title="Hashtags">
            <TagIcon style={{ paddingTop:"19px", verticalAlign: "middle", height: "22px", color: "#1976d2" }}/>
          </Tooltip> 
          </div>
          <div style={{ overflowX:"auto" }}>
          <p>{hashtag_results}</p>
         </div>
      </div>}
      </div> 

      <div style={{ display:"flex", marginTop:"-10px",width:"100%"}}>

        <div style={{ width:"5%", float:"left", paddingRight:"5px"}}>
        <Tooltip title="Communities">
            <LocalLibraryRoundedIcon style={{ paddingTop:"20px", verticalAlign: "middle", height: "20px", color: "#1976d2" }}/>
        </Tooltip> 
        </div>

        <div style={{ width: "75%", float: "left", overflowX: "auto" }}>
        {communityNamesList && communityNamesList.length !== 0 ? (
          <p style={{ verticalAlign: "top", whiteSpace: "nowrap", marginBottom: "auto" }}>
            {communityNamesList}
          </p>
        ) : (
          <p style={{ verticalAlign: "top", whiteSpace: "nowrap", marginBottom: "auto" }}>
            Webpage
          </p>
        )}
        </div>

        {props.show_relevant ? (
          <div style={{ width:"25%", float: "right"}}>
            <Tooltip title="Relevant">
            <Button
              value={1}
              onClick={() => submitRelevanceJudgements(1)}
              size="small"
              variant="text"
              style={{
                float: "right",
                minWidth: "0px",
                paddingTop:"20px",
                paddingLeft: "4px",
                paddingRight: "2px"
              }}
              startIcon={<ThumbUpRoundedIcon  value={1}/>}
            >
            </Button>
            </Tooltip>

            <Tooltip title="Not Relevant">
            <Button
              value={0}
              onClick={() => submitRelevanceJudgements(0)}
              size="small"
              variant="text"
              style={{
                margin: "0px 5px 0px 0px",
                float: "right",
                minWidth: "0px",
                paddingTop:"20px",
                paddingLeft: "8px",
                paddingRight: "2px"
              }}
              startIcon={<ThumbDownRoundedIcon value = {0}/>}
            >
            </Button>
            </Tooltip>
          </div>
        ) : null}
      
      </div>  
      <hr />
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default SearchResult;
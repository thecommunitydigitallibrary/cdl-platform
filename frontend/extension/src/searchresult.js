/*global chrome*/

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

  const openWebsite = async (url) => {
    chrome.tabs.create({url: url, active: false});
  }



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
          <button 
            style={{ 
              background: "None",
              border: "None",
              fontSize: "17px",
              width: "100%",
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: "left",
              color: "blue",
              textDecoration: "underline"
             }}
            onClick={() => openWebsite(props.redirect_url)}
          >
            {props.title} 
          </button>
        </div>
        
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
          {props.description && props.description.length > 0 && (
            <span>{props.description }</span>
          )}
      </p>

      </div> 
      
      
      {communityNamesList && communityNamesList.length !== 0 && (
        <div style={{ display:"flex", marginTop:"-10px",width:"100%"}}>

          <div style={{ width:"5%", float:"left", paddingRight:"5px"}}>
            <Tooltip title="Communities">
                <LocalLibraryRoundedIcon style={{ paddingTop:"20px", verticalAlign: "middle", height: "20px", color: "#1976d2" }}/>
            </Tooltip> 
          </div>
          <div style={{ width: "75%", float: "left", overflowX: "auto" }}>
            <p style={{ verticalAlign: "top", whiteSpace: "nowrap", marginBottom: "auto" }}>
              {communityNamesList}
            </p>
          </div>
        </div>
        )
      }
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
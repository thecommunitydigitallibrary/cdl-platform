import jsCookie from "js-cookie";

import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Router from 'next/router';

import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import ThumbDownRoundedIcon from "@mui/icons-material/ThumbDownRounded";
import ThumbUpRoundedIcon from "@mui/icons-material/ThumbUpRounded";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import MoreVert from "@mui/icons-material/MoreVert";
import TagIcon from '@mui/icons-material/Tag';
import FeedbackIcon from "@mui/icons-material/Feedback";
import ShareIcon from "@mui/icons-material/Share";

import { Snackbar, Alert, Box, Typography } from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { Bookmark, BookmarkAddOutlined, Close, Launch } from "@mui/icons-material";

import rehypeSanitize from "rehype-sanitize";
import CommunityDisplay from "./communityDisplay";


const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const websiteURL = process.env.NEXT_PUBLIC_FROM_CLIENT;

const submissionEndpoint = "submissions/";
const relJudgmentEndpoint = "submitRelJudgments";
const postFeedbackEndpoint = "feedback";
const searchEndpoint = "search";

function SearchResult(props) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("");
  const [paperWidth, setPaperWidth] = React.useState("100%");
  const [paperMargin, setPaperMargin] = React.useState("15px 10px");
  const [paperMarginX, setPaperMarginX] = React.useState("20%");

  useEffect(() => {
    setPaperMargin("15px 10px");
    if (props.paperWidth != undefined && props.paperWidth != "" && props.paperWidth != null)
      setPaperWidth(props.paperWidth);
    if (props.paperMargin != undefined && props.paperMargin != "" && props.paperMargin != null)
      setPaperMargin(props.paperMargin);
    if (props.paperMarginX != undefined && props.paperMarginX != null)
      setPaperMarginX(props.paperMarginX);
  }, []);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    event.preventDefault();
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const submitRelevanceJudgements = async function (event, rel) {
    event.preventDefault();
    let URL = baseURL_client + relJudgmentEndpoint;
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
    if (res.status == 200) {
      setSeverity("success");
    } else {
      setSeverity("error");
    }
    setMessage(response.message);
    handleClick();
  };

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenOptionsMenu = (event) => {
    event.preventDefault();
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
    setFeedbackMessage("");
    setOpenFeedbackForm(false);
    handleCloseOptionsMenu();
  };

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const handleMessageType = (event) => {
    setFeedbackMessage(event.target.value);
  };

  const handleCreateFeedbackForm = async (event) => {
    //send feedback
    var URL = baseURL_client + postFeedbackEndpoint + "/";
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        submission_id: props.submission_id,
        message: feedbackMessage,
      }),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    setOpenFeedbackForm(false);
    setFeedbackMessage("");
    handleCloseOptionsMenu();
  };

  const [shareUrlLink, setShareUrlLink] = useState("");
  const [connectionID, setConnectionID] = useState("");
  const [snackBarMessage, setSnackBarMessage] = useState("");

  const handleClickOptionsMenu = (event, option, param) => {
    switch (option) {
      case "view":
        // because the router does not work when viewing a submission and clicking a connection
        window.open(websiteURL + "submissions/" + param, "_blank");
        handleCloseOptionsMenu();
        //Router.push(
        //  websiteURL + "submissions/" + param
        //)
        break;
      case "share":
        handleShareUrl(param);
        handleCloseOptionsMenu();
        break;
      case "feedback":
        handleClickOpenFeedbackForm();
        break;
      case "connID":
        handleGetConnectionID(param);
        handleCloseOptionsMenu();
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

  /*
   * Need to fix this as navigator.clipboard results in undefined error on azure when using http. will be fixed when moved to https
   * get rid of alerts
   */
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
    if (subId) {
      var shareLink = websiteURL + submissionEndpoint + subId;
      setShareUrlLink(shareLink);
      setSnackBarMessage("Link copied: " + shareLink);
      copyPageUrl(shareLink);
    } else {
      setShareUrlLink("Error sharing URL");
    }
  };

  const handleGetConnectionID = (subId) => {
    if (subId) {
      setConnectionID(subId);
      setSnackBarMessage("Connection ID copied: " + subId);
      copyPageUrl(subId);
    } else {
      setConnectionID("Error getting Connection ID");
    }
  };

  if (props.hashtags) {
    var hashtag_results = props.hashtags.map(function (item) {
      return (
        <a
          href={websiteURL + "search?query=" + encodeURIComponent(item) + "&community=all&page=0"}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "14px",
            display: "inline", paddingRight: "15px"
          }}
        >{item}</a>
      );
    });
  }

  if (props.communities_part_of) {
    var communityNamesList = Object.keys(props.communities_part_of).map(
      function (key) {
        return (
          <>
            <CommunityDisplay k={key} />
          </>
        );
      }
    );
  } else {
    var communityNamesList = [];
  }

  let image_url;
  if (props.display_url != null) {
    let domain = props.display_url.split(">")[0].trim();
    image_url =
      "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32";
  } else {
    image_url = "https://t1.gstatic.com/faviconV2";
  }

  return (
    <Paper
      elevation={0}
      id={"card_id" + props.search_idx}
      className="mt-2"
      sx={{
        // width: '85%',
        minWidth: '600px',
        padding: "15px",
        border: "1px solid #ddd",
        margin: 'auto',
        wordBreak: 'break-word'
      }}
    >
      <a href={websiteURL + "submissions/" + props.submission_id} style={{ textDecoration: "none", color: "unset" }} target="_blank" rel="noopener noreferrer">
        <div style={{ display: "flex" }}>
          <div
            style={{
              marginRight: "7px",
              alignSelf: "center",
              paddingTop: "0"
            }}
          >
            <div>
              <img
                style={{
                  width: "18px",
                  height: "18px",
                  verticalAlign: "baseline",
                }}
                src={image_url}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <div>
              <Tooltip title={props.explanation}>
                <a
                  style={{
                    fontSize: "18px", maxWidth: '100%', display: '-webkit-box', WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: '1', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}
                  href={props.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {props.explanation}
                </a>
              </Tooltip>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "#808080",
                margin: "0",
              }}
            >
              {props.display_url} | {new Date(parseInt(props.time)).toLocaleDateString("en-us")} {props.username && " | " + props.username}
            </p>
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
                <DialogContentText></DialogContentText>
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
              autoHideDuration={2000}
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
                onClick={(event) =>
                  handleClickOptionsMenu(event, "view", props.submission_id)
                }
              >
                <ListItemIcon>
                  <Launch />
                </ListItemIcon>
                <ListItemText>View Submission</ListItemText>
              </MenuItem>
              <MenuItem
                name="feedback"
                onClick={(event) => handleClickOptionsMenu(event, "feedback")}
              >
                <ListItemIcon>
                  <FeedbackIcon />
                </ListItemIcon>
                <ListItemText>Feedback</ListItemText>
              </MenuItem>
              <MenuItem
                name="shareurl"
                value={props.submission_id}
                onClick={(event) =>
                  handleClickOptionsMenu(event, "share", props.submission_id)
                }
              >
                <ListItemIcon>
                  <ShareIcon />
                </ListItemIcon>
                <ListItemText>Share URL</ListItemText>
              </MenuItem>
              <MenuItem
                name="connID"
                onClick={(event) =>
                  handleClickOptionsMenu(event, "connID", props.submission_id)
                }
              >
                <ListItemIcon>
                  <Launch />
                </ListItemIcon>
                <ListItemText>Get Connection ID</ListItemText>
              </MenuItem>
            </Menu>
          </ButtonGroup>
        </div>

        {/* restricting text to only 500 characters per result to make it more uniform */}
        <p style={{
          fontSize: '14px', marginTop: '1%', marginBottom: '1%', textAlign: 'justify', maxWidth: '100%',
          display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: '5', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {props.highlighted_text && props.highlighted_text.length > 0 && (
            <span dangerouslySetInnerHTML={{ __html: props.highlighted_text }}></span>
          )}
        </p>

        {props.hashtags !== undefined && props.hashtags.length !== 0 &&
          <div style={{ display: "flex", alignItems: "center", marginBottom: '1%' }}>
            <Tooltip title="Hashtags">
              <TagIcon style={{ height: "20px", color: "#1976d2", marginRight: '5px' }} />
            </Tooltip>
            <Typography variant="body2">{hashtag_results}</Typography>
          </div>
        }

        <div
          style={{
            display: "flex",
            width: "100%",
          }}
        >
          <div style={{ marginRight: '5px' }}>
            <Tooltip title="Communities">
              <LocalLibraryRoundedIcon
                style={{ height: '20px', color: "#1976d2" }}
              />
            </Tooltip>
          </div>

          <div style={{ float: "left", overflowX: "auto", width: "100%" }}>

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
            <div style={{ float: "right", display: "flex" }}>
              <Tooltip title="Relevant">
                <Button
                  value={1}
                  onClick={(event) => submitRelevanceJudgements(event, 1)}
                  size="small"
                  id="RelevantButton"
                  variant="text"
                  style={{
                    float: "right",
                    minWidth: "0px"
                  }}
                  startIcon={<ThumbUpRoundedIcon value={1} />}
                ></Button>
              </Tooltip>
              <Tooltip title="Not Relevant">
                <Button
                  value={0}
                  onClick={(event) => submitRelevanceJudgements(event, 0)}
                  size="small"
                  id="notRelevantButton"
                  variant="text"
                  startIcon={<ThumbDownRoundedIcon value={0} />}
                  style={{
                    marginLeft: '10%',
                    float: "right",
                    minWidth: "0px"
                  }}
                ></Button>
              </Tooltip>
            </div>
          ) : null}

        </div>


        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} onClick={(event) => { event.preventDefault() }}>
          <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
            {message}
          </Alert>
        </Snackbar>
      </a>
    </Paper >
  );
}

export default SearchResult;

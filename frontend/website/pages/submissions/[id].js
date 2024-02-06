import jsCookie from "js-cookie";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SearchResult from "../../components/searchresult";
import Footer from "../../components/footer";
import SubmissionForm from "../../components/forms/submissionForm"
import Error from "next/error";
import dynamic from 'next/dynamic'
import { FormControl, Grid, InputLabel, OutlinedInput, Select } from "@mui/material";

import { getCodeString } from 'rehype-rewrite';


import Header from "../../components/header";

import Paper from "@mui/material/Paper";
import TagIcon from '@mui/icons-material/Tag';
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import Delete from "@mui/icons-material/Delete";
import DeleteIcon from "@mui/icons-material/Delete";
import FeedbackIcon from "@mui/icons-material/Feedback";
import AddLinkIcon from "@mui/icons-material/AddLink";
import ShareIcon from "@mui/icons-material/Share";
import ActionButton from "../../components/buttons/actionbutton";
import Edit from "@mui/icons-material/Edit";
import Close from "@mui/icons-material/Close";
import Launch from "@mui/icons-material/Launch";
import Save from "@mui/icons-material/Save";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import ReactDOMServer from 'react-dom/server';
import SpriteText from 'three-spritetext';

import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";

import Box from "@mui/system/Box";
import Head from "next/head";

import katex from "katex";
import "katex/dist/katex.css";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import rehypeSanitize from "rehype-sanitize";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });


const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  loading: () => <p>Loading...</p>, ssr: false
})

// import ForceGraph3D, { ForceGraphMethods } from "react-force-graph-3d";

const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const websiteURL = process.env.NEXT_PUBLIC_FROM_CLIENT;

const getSubmissionEndpoint = "submission/";
const searchEndpoint = "search";

export default function SubmissionResult({ errorCode, data, id, target }) {
  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("error");
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(800);
  const [source, setSource] = useState("");
  const [graph, setGraph] = useState({ "nodes": [], "links": [] });
  const [graphSet, setGraphSet] = useState(new Set());
  const graphRef = useRef(graph);
  const sourceRef = useRef(source);



  const colorNodeBackground = (node) => {
    switch (node.type) {
      case "current": return "rgb(255, 204, 0, 0.7)";
      case "submission": return "rgba(19, 41, 75, 0.7)";
      case "webpage": return "rgba(232, 74, 39, 0.7)";
      case "visited": return "rgba(125, 81, 175, 0.7)";
      default: return "rgba(173, 59, 59, 0.7)";
    }
  }

  const handleNodeLabel = useCallback(
    (node) => {
      let desc = node.desc ? <p>{node.desc}</p> : null;
      let tooltip = <div style={{ background: "#fff", color: "#000000de", padding: "15px", border: "1px solid #0000001f", borderRadius: "5px" }}>
        <h6>{node.label}</h6>
        {desc}
      </div>;
      return ReactDOMServer.renderToString(tooltip, {});
    },
    []
  );

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  // Necessary variables and functions for leaving a community
  const [openDelete, setOpenDelete] = React.useState(false);

  const handleClickDelete = () => {
    setOpenDelete(true);
  };

  const handleCloseDelete = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenDelete(false);
  };

  const [openEdit, setOpenEdit] = React.useState(false);

  const handleClickEdit = () => {
    setOpenEdit(true);
  };

  const handleCloseEdit = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenEdit(false);
  };


  const [submissionDataResponse, setSubmissionDataResponse] = React.useState(
    []
  );


  const deleteSubmissionEntirely = async (event) => {
    // Get the searchId required for POST request
    let submission = submissionDataResponse.submission;
    var submissionId = submission.submission_id;
    var URL = baseURL_client + getSubmissionEndpoint + submissionId;

    if (submission.can_delete) {
      const res = await fetch(URL, {
        method: "DELETE",
        headers: new Headers({
          Authorization: jsCookie.get("token"),
        }),
      });

      const response = await res.json();

      if (response.status == "ok") {
        setSeverity("success");
        setMessage("Deleted submission from all communities successfully!");
        handleClick();
        handleCloseDelete();
      }
    } else {
      setSeverity("error");
      setMessage(
        "Only the original poster of this submission can delete this."
      );
      handleClick();
    }
  };

  const deleteSubmissionfromCommunity = async (event) => {
    // Stop the form from submitting and refreshing the page.
    event.preventDefault();
    console.log("removing from these communities", removeCommunityIDList);
    // Get the searchId required for POST request
    for (let i = 0; i < removeCommunityIDList.length; ++i) {
      var URL =
        baseURL_client +
        "submission/" +
        submissionDataResponse.submission.submission_id;
      const res = await fetch(URL, {
        method: "DELETE",
        body: JSON.stringify({
          community: removeCommunityIDList[i],
        }),
        headers: new Headers({
          Authorization: jsCookie.get("token"),
        }),
      });

      const response = await res.json();
      if (response.status == "ok") {
        setSeverity("success");
        setMessage("Submission removed from community.");
        handleClick();
        handleCloseDelete();
        window.location.reload();
      } else {
        setSeverity("error");
        setMessage(response.message);
        handleClick();
      }
    }
  };

  const saveSubmission = async (event) => {
    // Stop the form from submitting and refreshing the page.
    event.preventDefault();
    console.log("adding to these communities", saveCommunityIDList);
    var i;
    for (i = 0; i < saveCommunityIDList.length; i++) {
      //addToNewCommunity(saveCommunityIDList[i])
      var URL =
        baseURL_client +
        "submission/" +
        submissionDataResponse.submission.submission_id;
      const res = await fetch(URL, {
        method: "PATCH",
        body: JSON.stringify({
          community: saveCommunityIDList[i], //i
        }),
        headers: new Headers({
          Authorization: jsCookie.get("token"),
          "Content-Type": "application/json",
        }),
      });

      const response = await res.json();
      if (response.status == "ok") {
        setSeverity("success");
        setMessage("Saved submission successfully!");
        handleClick();
        window.location.reload();
      } else {
        setSeverity("error");
        setMessage(response.message);
        handleClick();
      }
    }
  };

  const [anchorElUser, setAnchorElUser] = React.useState(null);


  const handleCloseOptionsMenu = () => {
    setAnchorElUser(null);
  };

  const [feedbackMessage, setFeedbackMessage] = React.useState("");

  const [openFeedbackForm, setOpenFeedbackForm] = React.useState(false);

  const handleClickOpenFeedbackForm = () => {
    setOpenFeedbackForm(true);
  };

  const handleCancelFeedbackForm = () => {
    setFeedbackMessage("");
    setOpenFeedbackForm(false);
    handleCloseOptionsMenu();
  };

  const handleMessageType = (event) => {
    setFeedbackMessage(event.target.value);
  };

  const handleCreateFeedbackForm = async (event) => {
    //send feedback
    var URL = baseURL_client + "feedback" + "/";
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        submission_id: submissionDataResponse.submission.submission_id,
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

  const [shareUrlLink, setShareUrlLink] = React.useState("");


  const [openConnectForm, setOpenConnectForm] = React.useState(false);

  const handleClickOpenConnectForm = () => {
    setOpenConnectForm(true);
  };

  const handleCancelConnectForm = () => {
    setOpenConnectForm(false);
    handleCloseOptionsMenu();
  };





  const handleClickOptionsMenu = (event, option, param) => {
    console.log("clicked " + option);
    switch (option) {
      case "share":
        handleShareUrl(param);
        handleCloseOptionsMenu();
        break;
      case "feedback":
        handleClickOpenFeedbackForm();
        break;
      case "connect":
        handleClickOpenConnectForm();
        break;
      default:
        break;
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    setOpenShareUrlSuccess(false);
    setLoading(false);
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
  const [isLoading, setLoading] = React.useState(false);

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
      console.error("Failed to copy: ", err);
    }
  }

  const handleShareUrl = (subId) => {
    if (subId) {
      setShareUrlLink(websiteURL + "submissions/" + subId);
      copyPageUrl(shareUrlLink);
    } else {
      setShareUrlLink("Error sharing URL");
    }
  };

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };
  const [removeCommunityID, setRemoveCommunityID] = React.useState([]);
  const [saveCommunityID, setSaveCommunityID] = React.useState([]);
  const [removeCommunityIDList, setRemoveCommunityIDList] = React.useState([]);
  const [saveCommunityIDList, setSaveCommunityIDList] = React.useState([]);
  const [communityNameMap, setCommunityNameMap] = React.useState({});

  const mapCommunitiesToNames = (commResponse) => {
    let idNameMap = {};
    for (var key in commResponse) {
      idNameMap[key] = commResponse[key].name;
    }
    return idNameMap;
  };

  const callGraphAPI = async (submission_id) => {
    const res = await fetch(baseURL_client + "graph/" + submission_id, {
      method: "GET",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    return await res.json();
  }

  const getGraphData = async () => {
    setSource(id);
    const response = await callGraphAPI(id);
    if (response.status === "ok") {
      setGraph(response.data);
      for (let i = 0; i < response.data.nodes.length; ++i) {
        graphSet.add(response.data.nodes[i].id);
      }
      setGraphSet(graphSet);
    } else {
      console.log(response);
    }
    if (target != null) {
      handleNodeVisit({ id: target });
    }
  }

  const fgRef = useRef();

  const handleNodeVisit = useCallback((node) => {
    let newGraph = graphRef.current;
    for (let i = 0; i < newGraph.nodes.length; ++i) {
      if (newGraph.nodes[i].id === node.id) {
        newGraph.nodes[i]["type"] = "visited";
      }
    }
    setGraph(newGraph);
  }, [graph, setGraph]);

  const handleNodeAdd = useCallback((node, data) => {
    console.log("DATA", data);
    let newGraph = graph;
    console.log("OLD", newGraph);

    console.log("OLD Set", graphSet);
    for (let i = 0; i < data.nodes.length; ++i) {
      if (!graphSet.has(data.nodes[i].id)) {
        let nde = data.nodes[i];
        nde["index"] = data.nodes.length;
        newGraph.nodes.push(nde);
      }
    }

    for (let i = 0; i < data.links.length; ++i) {
      if (!graphSet.has(data.links[i].target)) {
        let lnk = data.links[i];
        lnk["index"] = data.links.length;
        lnk["source"] = node;
        lnk["target"] = data.nodes[data.nodes.length - 1];
        newGraph.links.push(lnk);
        graphSet.add(data.links[i].target);
      }
    }
    setGraphSet(graphSet);
    console.log("NEW  Set", graphSet);
    console.log("NEW", newGraph);
    setGraph(newGraph);
  }, [graph, setGraph]);

  const handleNodeClick = useCallback(
    async (node) => {
      setLoading(true);
      const res = await fetch(baseURL_client + "submission/" + node.id, {
        method: "GET",
        headers: new Headers({
          Authorization: jsCookie.get("token"),
          "Content-Type": "application/json",
        }),
      });
      handleNodeVisit(node);
      const response = await res.json();
      if (response.status === "ok") {
        setSubmissionDataResponse(response);
      } else {
        console.log(response);
      }

      // Complete Loading and Change URL

      setLoading(false);
      const nextURL = websiteURL + 'submissions/' + sourceRef.current + "?target=" + node.id;
      window.history.replaceState(null, "", nextURL);
    },
    [graph, setGraph]
  );

  const getSubmissionData = () => {
    if (data.status === "ok") {
      setSubmissionDataResponse(data);
      setCommunityNameMap(mapCommunitiesToNames(data.submission.communities));

      let sharableCommunityIds = [];
      let removableCommnuityIds = [];

      const userCommunityIds = Object.keys(data.submission.communities);

      sharableCommunityIds = userCommunityIds.filter(
        (x) => data.submission.communities[x]["valid_action"] == "save"
      );
      removableCommnuityIds = userCommunityIds.filter(
        (x) => data.submission.communities[x]["valid_action"] == "remove"
      );

      if (saveCommunityID && sharableCommunityIds.length > 0) {
        setSaveCommunityID(sharableCommunityIds);
      } else {
        setSaveCommunityID([]);
      }

      if (removeCommunityID && removableCommnuityIds.length > 0) {
        setRemoveCommunityID(removableCommnuityIds);
      } else {
        setRemoveCommunityID([]);
      }
    }
  };

  const handleSaveDropdownChange = (event) => {
    const {
      target: { value },
    } = event;

    setSaveCommunityIDList(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  const handleRemoveDropdownChange = (event) => {
    const {
      target: { value },
    } = event;
    setRemoveCommunityIDList(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  useEffect(() => {
    sourceRef.current = source;
    graphRef.current = graph;
  }, [graph, source]);

  useEffect(() => {
    setHeight(window.innerHeight - 88.6)
    setWidth((window.innerWidth / 2) - 40)
    getSubmissionData();
    getGraphData();
  }, []);

  // useEffect(() => {
  //    fgRef.current.d3Force('link').distance(link => 500).strength(link => -300);
  //  }, []);


  if (submissionDataResponse.submission && submissionDataResponse.submission.hashtags) {
    var hashtag_results = submissionDataResponse.submission.hashtags.map(function (item) {
      return (
        <a
          href={"/search?query=" + encodeURIComponent(item) + "&community=all&page=0"}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "15px",
            display: "inline", paddingRight: "15px"
          }}
        >{item}</a>
      );
    });
  }

  if (submissionDataResponse.submission && submissionDataResponse.submission.communities_part_of) {
    var communityNamesList = Object.keys(
      submissionDataResponse.submission.communities_part_of
    ).map(function (key) {
      return (
        <a
          href={websiteURL + searchEndpoint + "?community=" + key + "&page=0"}
          target="_blank"
          rel="noopener noreferrer"
          style={{
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
            background: "aliceblue",
          }}
        >
          {submissionDataResponse.submission.communities_part_of[key]}
        </a>
      );
    });
  } else {
    var communityNamesList = [];
  }

  var page_title = " - TextData"

  if (submissionDataResponse.submission) {
    page_title = submissionDataResponse.submission.explanation + page_title
  } else {
    page_title = "Submission" + page_title
  }

  return (
    <>
      <Head>
        <title>{page_title}</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>
      <Header />
      <div className="allResults" style={{ display: "flex" }}>
        {submissionDataResponse.submission && (
          <Paper
            elevation={0}
            sx={{
              marginLeft: "10px",
              width: "50%",
              padding: "0px 20px 0px 10px",
            }}
          >
            <div style={{ display: "flex" }}>
              <div style={{ margin: "0px 0px 0px 0px" }}>
                <a
                  style={{
                    fontSize: "28px",
                    color: "black",
                    textDecoration: "none",
                  }}
                  href={submissionDataResponse.submission.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {submissionDataResponse.submission.explanation}

                  <ListItemIcon>
                    <Launch />
                  </ListItemIcon>
                </a>
              </div>
              <Dialog open={openFeedbackForm}>
                <DialogTitle>
                  {" "}
                  Feedback for{" "}
                  <a
                    style={{ fontSize: "18px" }}
                    href={submissionDataResponse.submission.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {submissionDataResponse.submission.explanation}
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

              <Dialog open={openConnectForm} fullWidth maxWidth="md">
                <SubmissionForm
                  dialog_title="Reply by creating a new submission"
                  method="reply"
                  communityNameMap={communityNameMap}
                  source_url=""
                  title=""
                  description=""
                  submission_id={submissionDataResponse.submission.submission_id}
                  handle_close={handleCancelConnectForm}
                />
              </Dialog>

              <Snackbar
                open={openShareUrlSuccess}
                autoHideDuration={2000}
                onClick={handleCloseSnackbar}
                message={"Link copied: " + shareUrlLink}
                action={action}
                onClose={() => setOpenShareUrlSuccess(false)}
              />

              <Snackbar
                open={isLoading}
                autoHideDuration={2000}
                onClick={handleCloseSnackbar}
                message={"Loading Submission. Please Wait."}
                action={action}
                onClose={() => setOpenShareUrlSuccess(false)}
              />

              <br />
            </div>

            <div>
              <p
                style={{
                  fontSize: "18px",
                  color: "#808080",
                  margin: "0px 0px 0px 0px",
                }}
              >
                {submissionDataResponse.submission.display_url} | {new Date(parseInt(submissionDataResponse.submission.time)).toLocaleDateString("en-us")}
              </p>
            </div>



            {submissionDataResponse.submission && submissionDataResponse.submission.hashtags !== undefined && submissionDataResponse.submission.hashtags.length !== 0 &&
              <div style={{ display: "flex", width: "100%" }}>
                <div style={{ marginRight: '5px' }}>
                  <Tooltip title="Hashtags">
                    <TagIcon style={{ height: "20px", color: "#1976d2" }} />
                  </Tooltip>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <p margin-bottom='auto'>{hashtag_results}</p>
                </div>
              </div>}

            <div
              style={{
                display: "flex",
                width: "100%",
              }}
            >
              <div style={{ float: "left", minWidth: "fit-content" }}>
                <Tooltip title="Communities">
                  <LocalLibraryRoundedIcon
                    style={{ height: "21px", color: "#1976d2" }}
                  />
                </Tooltip>{" "}
                {communityNamesList.length > 0 && submissionDataResponse.submission.type === "user_submission"
                  ? communityNamesList.map((link, i) => [i > 0, link])
                  : ""}
                {submissionDataResponse.submission.type === "webpage" && "Webpage"}
              </div>

            </div>

            {submissionDataResponse.submission.username && "Submitted by " + submissionDataResponse.submission.username}



            <Grid
              container
              direction="row"
              alignItems={"center"}
              justifyContent="space-between"
              sx={{ my: 1 }}
            >
              <Grid className="counter" item sx={{ width: "33%" }}>
                <Box
                  sx={{
                    my: 1,
                    px: 2,
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-evenly",
                    alignItems: "center",
                    border: "1px solid rgba(0, 0, 0, 0.25)",
                    borderRadius: "4px",
                    "& svg": {
                      m: 1.5,
                    },
                    "& hr": {
                      mx: 0.5,
                    },
                  }}
                >
                  <Typography>Views: </Typography>
                  {submissionDataResponse.submission.stats["views"]}
                  <Divider
                    orientation="vertical"
                    variant="middle"
                    flexItem
                    sx={{ height: 22 }}
                  />
                  <Typography>Clicks: </Typography>
                  {submissionDataResponse.submission.stats["clicks"]}
                  <Divider orientation="vertical" variant="middle" flexItem />
                  <Typography>Shares: </Typography>
                  {submissionDataResponse.submission.stats["shares"]}
                </Box>
              </Grid>

              {submissionDataResponse.submission && submissionDataResponse.submission.type === "user_submission" &&
                <Grid item sx={{ width: "66%" }} className="addRemoveCommunities">
                  <Grid container sx={{ flexFlow: "nowrap" }}>
                    <Grid item sx={{ width: "50%" }}>
                      {(
                        <Grid container alignItems="center" sx={{ flexFlow: "nowrap" }}>
                          <Grid item sx={{ width: "80%" }} className="addRemoveText">
                            <div>
                              <FormControl
                                sx={{ width: "100%" }}
                                size="small"
                              >
                                <InputLabel id="demo-multiple-checkbox-label">
                                  Remove Community
                                </InputLabel>
                                <Select
                                  labelId="demo-multiple-checkbox-label"
                                  id="demo-multiple-checkbox"
                                  value={removeCommunityIDList}
                                  onChange={handleRemoveDropdownChange}
                                  input={
                                    <OutlinedInput label="Remove Community" />
                                  }
                                  sx={{ borderRadius: "4px 0 0 4px" }}
                                  renderValue={(selected) =>
                                    selected
                                      .map((x) => communityNameMap[x])
                                      .join(", ")
                                  }
                                  MenuProps={MenuProps}
                                >
                                  {removeCommunityID.map((item) => (
                                    <MenuItem key={item} value={item}>
                                      <Checkbox
                                        checked={
                                          removeCommunityIDList.indexOf(item) > -1
                                        }
                                      />
                                      <ListItemText
                                        primary={communityNameMap[item]}
                                      />
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </div>
                          </Grid>
                          <Grid item sx={{ marginRight: "10px" }}>
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                sx={{ background: "#ddd", borderRadius: "0 4px 4px 0", padding: "8px" }}
                                onClick={deleteSubmissionfromCommunity}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      )}
                    </Grid>
                    <Grid item sx={{ width: "50%" }}>
                      { }
                      <Grid container alignItems="center" sx={{ flexFlow: "nowrap" }}>
                        <Grid item sx={{ width: "80%" }} className="addRemoveText">
                          <div>
                            <FormControl
                              sx={{ width: "100%" }}
                              size="small"
                            >
                              <InputLabel
                                id="demo-multiple-checkbox-label"
                                sx={{ width: 185 }}
                              >
                                Add Community
                              </InputLabel>
                              <Select
                                labelId="demo-multiple-checkbox-label"
                                id="demo-multiple-checkbox"
                                value={saveCommunityIDList}
                                onChange={handleSaveDropdownChange}
                                sx={{ borderRadius: "4px 0 0 4px" }}
                                input={
                                  <OutlinedInput label="Add Community" />
                                }
                                renderValue={(selected) =>
                                  selected
                                    .map((x) => communityNameMap[x])
                                    .join(", ")
                                }
                                MenuProps={MenuProps}
                              >
                                {saveCommunityID.map((item) => (
                                  <MenuItem key={item} value={item}>
                                    <Checkbox
                                      checked={
                                        saveCommunityIDList.indexOf(item) > -1
                                      }
                                    />
                                    <ListItemText
                                      primary={communityNameMap[item]}
                                    />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </div>
                        </Grid>
                        <Grid item sx={{ marginRight: "0px" }}>
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              sx={{ background: "#ddd", borderRadius: "0 4px 4px 0", padding: "8px" }}
                              onClick={saveSubmission}>
                              <Save />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              }
            </Grid>
            <div style={{ display: "flex" }}>
              <div style={{ width: "20%" }}>
                <ActionButton
                  type="filled"
                  variant="contained"
                  name="connect"
                  style={{ width: "95%", padding: "8px" }}
                  action={(event) =>
                    handleClickOptionsMenu(
                      event,
                      "connect",
                      submissionDataResponse.submission.submission_id
                    )
                  }
                >
                  <AddLinkIcon /> &nbsp; Reply
                </ActionButton>
              </div>
              <div style={{ width: "20%" }}>
                <ActionButton
                  type="filled"
                  variant="contained"
                  name="shareurl"
                  id="shareIcon"
                  className="shareIcon"
                  style={{ width: "95%", padding: "8px" }}
                  value={submissionDataResponse.submission.submission_id}
                  action={(event) =>
                    handleClickOptionsMenu(
                      event,
                      "share",
                      submissionDataResponse.submission.submission_id
                    )
                  }
                >
                  <ShareIcon />
                  &nbsp;Share URL
                </ActionButton>
              </div>
              <div style={{ width: "20%" }}>
                <ActionButton
                  type="filled"
                  variant="contained"
                  name="feedback"
                  style={{ width: "95%", padding: "8px" }}
                  action={(event) => handleClickOptionsMenu(event, "feedback")}
                >
                  <FeedbackIcon />
                  &nbsp;Feedback
                </ActionButton>
              </div>
              {submissionDataResponse.submission && submissionDataResponse.submission.can_delete && (
                <div style={{ width: "20%" }}>
                  <ActionButton
                    type="filled"
                    style={{ width: "95%", padding: "8px" }}
                    variant="contained"
                    action={handleClickEdit}
                  >
                    <Edit />
                    &nbsp; Edit
                  </ActionButton>
                </div>
              )}
              {submissionDataResponse.submission && submissionDataResponse.submission.can_delete && (
                <div style={{ width: "20%" }}>
                  <ActionButton
                    color="error"
                    type="filled"
                    style={{ width: "95%", padding: "8px" }}
                    variant="contained"
                    action={handleClickDelete}
                  >
                    <DeleteIcon />
                    &nbsp; DELETE
                  </ActionButton>
                </div>
              )}
            </div>
            <br></br>
            <div data-color-mode="light">
              <MDEditor
                value={submissionDataResponse.submission.highlighted_text}
                preview="preview"
                height={400}
                maxHeight={1000}
                minHeight={200}
                hideToolbar={false}
                previewOptions={{
                  rehypePlugins: [[rehypeSanitize]],
                  components: {
                    code: ({ inline, children = [], className, ...props }) => {
                      const txt = children[0] || "";
                      if (inline) {
                        if (
                          typeof txt === "string" &&
                          /^\$\$(.*)\$\$/.test(txt)
                        ) {
                          const html = katex.renderToString(
                            txt.replace(/^\$\$(.*)\$\$/, "$1"),
                            {
                              throwOnError: false,
                            }
                          );
                          return (
                            <code dangerouslySetInnerHTML={{ __html: html }} />
                          );
                        }
                        return <code>{txt}</code>;
                      }
                      const code =
                        props.node && props.node.children
                          ? getCodeString(props.node.children)
                          : txt;
                      if (
                        typeof code === "string" &&
                        typeof className === "string" &&
                        /^language-katex/.test(className.toLocaleLowerCase())
                      ) {
                        const html = katex.renderToString(code, {
                          throwOnError: false,
                        });
                        return (
                          <code
                            style={{ fontSize: "150%" }}
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
                        );
                      }
                      return <code className={String(className)}>{txt}</code>;
                    },
                  },
                }}
              />
            </div>
            <Grid
              container
              width={1}
              margin="auto"
              justifyContent={"flex-start"}
              spacing={4}
            ></Grid>
            <hr />
            <div className="allResults">
              {submissionDataResponse.submission.connections.length > 0 ? (
                <>
                  {submissionDataResponse.submission.connections.map(
                    (d, index) => (
                      <>
                        <div key={index}>
                          <SearchResult
                            search_idx={index}
                            redirect_url={d.redirect_url}
                            display_url={d.display_url}
                            submission_id={d.submission_id}
                            result_hash={d.result_hash}
                            highlighted_text={d.highlighted_text}
                            explanation={d.explanation}
                            hashtags={d.hashtags}
                            time={d.time}
                            communities_part_of={d.communities_part_of}
                            auth_token={jsCookie.get("token")}
                            show_relevant={true}
                            paperWidth={"100%"}
                            paperMarginX={"0%"}
                          ></SearchResult>
                        </div>
                      </>
                    )
                  )
                  }

                </>
              ) : (

                <Typography sx={{ fontSize: 14, color: "grey" }}>
                  There are no replies.
                </Typography>
              )}
            </div>


            <Dialog open={openEdit} fullWidth maxWidth="md">
              <SubmissionForm
                method="edit"
                dialog_title="Edit Submission Details"
                source_url={submissionDataResponse.submission.raw_source_url}
                title={submissionDataResponse.submission.explanation}
                description={submissionDataResponse.submission.highlighted_text}
                submission_id={submissionDataResponse.submission.submission_id}
                username={submissionDataResponse.submission.username}
                handle_close={handleCloseEdit}
              />
            </Dialog>

            <Dialog open={openDelete} onClose={handleCloseDelete}>
              <DialogTitle style={{ width: "500px" }}>
                {" "}
                Delete Submission{" "}
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete this submission? This will
                  remove the submission from all communities.
                </DialogContentText>
              </DialogContent>

              <DialogActions>
                <Button onClick={handleCloseDelete}>Cancel</Button>
                <Button
                  style={{ color: "red" }}
                  onClick={deleteSubmissionEntirely}
                >
                  I'm Sure
                </Button>
              </DialogActions>
            </Dialog>
            <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
              <Alert
                onClose={handleClose}
                severity={severity}
                sx={{ width: "100%" }}
              >
                {message}
              </Alert>
            </Snackbar>
          </Paper>
        )}
        <Paper
          elevation={0}
          sx={{
            marginLeft: "10px",
            width: "50%",
            padding: 0
          }}>
          <Legend />
          <ForceGraph3D
            ref={fgRef}
            graphData={graph}
            width={width}
            height={height}
            d3Force="link"
            distance={300}
            backgroundColor={'#e5e5e5'}
            onNodeClick={handleNodeClick}
            nodeLabel={handleNodeLabel}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.25}
            nodeThreeObject={node => {
              let label = node.label.length > 30 ? node.label.substring(0, 30) + '...' : node.label;
              const sprite = new SpriteText(label);
              sprite.backgroundColor = colorNodeBackground(node);
              sprite.color = "#fff";
              sprite.padding = [1.5, 1.5];
              sprite.textHeight = 2;
              sprite.fontWeight = 700;
              sprite.fontSize = 90;
              sprite.borderRadius = 4;
              return sprite;
            }}
            // zoomToFit={(20)}
            linkThreeObjectExtend={true}
            linkWidth={1}
            cameraPosition={(0, 0, 0)}
            linkThreeObject={(link) => {
              const sprite = new SpriteText("RELATED");
              sprite.fontWeight = 700;
              sprite.color = 'rgba(0,0,0,0.7)';
              sprite.textHeight = 3;
              return sprite;
            }}
            linkPositionUpdate={(sprite, { start, end }) => {
              const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
                [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
              })));

              Object.assign(sprite.position, middlePos);
            }}
            linkColor={() => 'rgba(0,0,0,0.7)'}
            linkDirectionalParticles={1}
          />
        </Paper>
      </div>
      <Footer />
    </>
  );
}

const Legend = () => {
  const legendStyle = {
    position: 'absolute',
    padding: '10px',
    zIndex: "100"
  };

  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
  };

  const colorBoxStyle = (backgroundColor) => ({
    width: '20px',
    height: '20px',
    marginRight: '10px',
    backgroundColor,
    borderRadius: "1000px"
  });

  return (
    <div style={legendStyle}>
      <div style={legendItemStyle}>
        <span style={colorBoxStyle("rgb(255, 204, 0, 0.7)")}></span>
        <span>Current Submission</span>
      </div>
      <div style={legendItemStyle}>
        <span style={colorBoxStyle("rgba(19, 41, 75, 0.7)")}></span>
        <span>User Submission</span>
      </div>
      <div style={legendItemStyle}>
        <span style={colorBoxStyle("rgba(232, 74, 39, 0.7)")}></span>
        <span>Scrapped Webpage</span>
      </div>
      <div style={legendItemStyle}>
        <span style={colorBoxStyle("rgba(125, 81, 175, 0.7)")}></span>
        <span>Visited Submission</span>
      </div>
      {/* Add more legend items here */}
    </div>
  );
};

// This gets called on every request
export async function getServerSideProps(context) {
  // Fetch data from external API
  if (
    context.req.cookies.token === "" ||
    context.req.cookies.token === undefined
  ) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  } else {
    const id = context.query.id;
    var target = null
    if (context.query.hasOwnProperty("target")) {
      target = context.query.target
    }
    //const target = context.query.target;
    let URL = baseURL_server + getSubmissionEndpoint + ((target == null) ? id : target);
    const res = await fetch(URL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });
    const data = await res.json();
    const errorCode = res.ok ? false : res.status;

    return {
      props: { errorCode, data, id, target },
    };
  }
}

import { useRouter } from "next/router";
import jsCookie from "js-cookie";
import React, { useEffect, useState, useCallback, useRef } from "react";
import SearchResult from "../../components/searchresult";
import Footer from "../../components/footer";
import Error from "next/error";
import dynamic from 'next/dynamic'
import {
  FormControl,
  Grid,
  InputLabel,
  OutlinedInput,
  Select,
} from "@mui/material";

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
import FeedbackIcon from "@mui/icons-material/Feedback";
import AddLinkIcon from "@mui/icons-material/AddLink";
import ShareIcon from "@mui/icons-material/Share";
import ActionButton from "../../components/buttons/actionbutton";
import DeleteIcon from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Close from "@mui/icons-material/Close";
import Launch from "@mui/icons-material/Launch";
import Save from "@mui/icons-material/Save";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import ReactDOMServer from 'react-dom/server';

import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import SpriteText from 'three-spritetext';

import Box from "@mui/system/Box";
import Head from "next/head";

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  loading: () => <p>Loading...</p>, ssr: false
})

const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const websiteURL = process.env.NEXT_PUBLIC_FROM_CLIENT;

const getSubmissionEndpoint = "submission/";
const searchEndpoint = "search";

export default function SubmissionResult({ errorCode, data }) {
  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("error");
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(800);
  const [source, setSource] =  useState("");
  const [graph, setGraph] = useState({"nodes": [], "links": []})
  const graphRef = useRef(graph);
  const sourceRef = useRef(source);

  const drawNormalNode = useCallback((node) => {
        const sprite = new SpriteText(node.label ? node.label : node.id, 5);
        sprite.color = "#fff";
        sprite.backgroundColor = colorNodeBackground(node.type);
        sprite.padding = [8, 4];
        sprite.textHeight = 2;
        sprite.borderRadius = 10;
        sprite.fontWeight = 700;

        return sprite;
    }, []);

    const colorNodeBackground = (type) => {
        switch (type) {
            case "current": return "#154f83";
            case "nearby" : return "#26bdab";
            case "visited": return "#d38327";
            default: return "#f1f2f3";
        }
    }



    const handleBackgroundClick = useCallback(
        (node) => {
            // console.log(node);
            // d3.selectAll("#node-info-container").remove();
            // // Aim at node from outside it
            // const distance = 200;
            // const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            // fgRef.current.cameraPosition(
            //     { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            //     node, // lookAt ({ x, y, z })
            //     3000 // ms transition duration
            // );
        },
        []
    );

    const handleNodeHover = useCallback(
        (node) => {
            // console.log(node);
            // d3.selectAll("#node-info-container").remove();
            // // Aim at node from outside it
            // const distance = 200;
            // const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            // fgRef.current.cameraPosition(
            //     { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            //     node, // lookAt ({ x, y, z })
            //     3000 // ms transition duration
            // );
        },
        []
    );

    const handleNodeLabel = useCallback(
        (node) => {
            // console.log("NODE", node);
            // d3.selectAll("#node-info-container").remove();
            // // Aim at node from outside it
            // const distance = 200;
            // const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            // fgRef.current.cameraPosition(
            //     { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            //     node, // lookAt ({ x, y, z })
            //     3000 // ms transition duration
            // );
          let desc = node.desc ? <p>{node.desc}</p> : null;
          let tooltip = <div style={{background: "#fff", color: "#000000de", padding: "15px", border: "1px solid #0000001f", borderRadius: "4px"}}>
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

  const editSubmission = async (event) => {
    var submissionCommunities = Object.keys(
      submissionDataResponse["submission"]["communities_part_of"]
    );

    for (let i = 0; i < submissionCommunities.length; ++i) {
      var URL =
        baseURL_client +
        "submission/" +
        submissionDataResponse.submission.submission_id;
      var getExplanation = document.getElementById("editExplanation");
      var getHighlightedText = document.getElementById("editHighlightedText");
      var getURL = document.getElementById("editURL");
      var error = false;
      const res = await fetch(URL, {
        method: "PATCH",
        body: JSON.stringify({
          community_id: submissionCommunities[i],
          explanation: getExplanation.value,
          highlighted_text: getHighlightedText.value,
          url: getURL.value,
        }),
        headers: new Headers({
          Authorization: jsCookie.get("token"),
          "Content-Type": "application/json",
        }),
      });
      const response = await res.json();
      if (response.status == "ok") {
        setSeverity("success");
        setMessage(response.message);
        handleClick();
        handleCloseEdit();
        window.location.reload();
      } else {
        setSeverity("error");
        setMessage(response.message);
        handleClick();
      }
    }
  };

  const router = useRouter();
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
          community_id: removeCommunityIDList[i],
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
          community_id: saveCommunityIDList[i], //i
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

  const handleOpenOptionsMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

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

  const [connectUrl, setConnectUrl] = React.useState("");

  const [openConnectForm, setOpenConnectForm] = React.useState(false);

  const handleClickOpenConnectForm = () => {
    setOpenConnectForm(true);
  };

  const handleCancelConnectForm = () => {
    setConnectUrl("");
    setOpenConnectForm(false);
    handleCloseOptionsMenu();
  };

  const handleConnectUrlType = (event) => {
    setConnectUrl(event.target.value);
  };

  const handleCreateConnectForm = async (event) => {
    var URL = baseURL_client + "connect/";
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        connection_source: submissionDataResponse.submission.submission_id,
        connection_target: connectUrl,
      }),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    console.log(response, connectUrl);
    setOpenConnectForm(false);
    setConnectUrl("");
    handleCloseOptionsMenu();
    window.location.reload();
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

  const getGraphData = async () => {
    console.log("ABC", data);
    setSource(data.submission.submission_id);
    const res = await fetch(baseURL_client + "graph/" + data.submission.submission_id, {
      method: "GET",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (response.status === "ok") {
      // console.log(response.data);
      setGraph(response.data);

    } else {
      console.log(response);
    }
  }

    const fgRef = useRef();

    const handleNodeClick = useCallback(
        async (node) => {
          setLoading(true);
          const res = await fetch( baseURL_client + "submission/" + node.id, {
            method: "GET",
            headers: new Headers({
              Authorization: jsCookie.get("token"),
              "Content-Type": "application/json",
            }),
          });
          let newGraph = graphRef.current;
          for (let i = 0; i < newGraph.nodes.length; ++i) {
            if (newGraph.nodes[i].id === node.id) {
                console.log("node", node.id);
                newGraph.nodes[i]["type"] = "visited";
            }
          }
          console.log(newGraph);
          setGraph(newGraph);
          const response = await res.json();
          if (response.status === "ok") {
            // console.log(response);
            setSubmissionDataResponse(response);
          } else {
            console.log(response);
          }
          setLoading(false);
          const nextURL = websiteURL + 'submissions/' + sourceRef.current + "?target=" + node.id;
          window.history.replaceState(null, "", nextURL);

          // d3.selectAll("#node-info-container").remove();
          // // Aim at node from outside it
          // const distance = 200;
          // const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          // fgRef.current.cameraPosition(
          //     { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
          //     node, // lookAt ({ x, y, z })
          //     3000 // ms transition duration
          // );
        },
        [graph, setGraph]
    );

  const getSubmissionData = () => {
    if (data.status == "ok") {
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


  if(data.submission.hashtags){
    var hashtag_results = data.submission.hashtags.map(function(item){
      return(
        <a 
        href={ "/search?query=" + encodeURIComponent(item) + "&community=all&page=0" } 
        target="_blank"
        rel="noopener noreferrer" 
        style = {{ fontSize:"15px",
          display: "inline", paddingRight : "15px"}}
        >{item}</a>
      );
    });
  }

  if (data.submission.communities_part_of) {
    var communityNamesList = Object.keys(
      data.submission.communities_part_of
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
          {data.submission.communities_part_of[key]}
        </a>
      );
    });
  } else {
    var communityNamesList = [];
  }

  return (
    <>
      <Head>
        <title>Submission - The CDL</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>
      <Header />
      <div className="allResults" style={{display: "flex"}}>
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
                    href={data.submission.redirect_url}
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

              <Dialog open={openConnectForm}>
                <DialogTitle>
                  {" "}
                  Add connection for{" "}
                  <a
                    style={{ fontSize: "20px" }}
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
                    value={connectUrl}
                    onChange={handleConnectUrlType}
                    label="Paste Connection ID"
                    fullWidth
                    variant="standard"
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCancelConnectForm}>Cancel</Button>
                  <Button onClick={handleCreateConnectForm}>Add</Button>
                </DialogActions>
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
                {submissionDataResponse.submission.display_url}
              </p>
            </div>

            
            
              {data.submission.hashtags !== undefined && data.submission.hashtags.length !== 0 &&
              <div style={{ display:"flex", width:"100%"}}>
                  <div style={{ width:"5%", float:"left", paddingRight:"5px"}}>
                  <Tooltip title="HashTags">
                    <TagIcon style={{ height: "22px", color: "#1976d2" }}/>
                  </Tooltip> 
                  </div>
                  <div>
                  <p>{hashtag_results}</p>
                  </div>
              </div>}

              <div
                style={{
                  display: "flex",
                  margin: "10px 0px 0px -5px",
                  width: "100%",
                }}
              >
                <div style={{ float: "left", minWidth: "fit-content" }}>
                  <Tooltip title="Communities">
                    <LocalLibraryRoundedIcon
                      style={{ height: "21px", color: "#1976d2" }}
                    />
                  </Tooltip>{" "}
                  {communityNamesList.length > 0
                    ? communityNamesList.map((link, i) => [i > 0, link])
                    : "None"}
                </div>

          <div style={{display: "flex", width: "85%"}}>
        <div style={{ marginRight: '5px'}}>
          <Tooltip title="Submitted Time">
            <ScheduleRounded
              style={{ height:'20px', color: "#1976d2" }}
            />
          </Tooltip>
        </div>

        <div style={{float: "left", overflowX: "auto" }}>
          <p style={{ verticalAlign: "top", whiteSpace: "nowrap", marginBottom: "auto" }}>
            <Tooltip title={data.submission.time}>
            <a
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
          >{data.submission.time}
          </a>
          </Tooltip>

          </p>
        </div>
          </div>
                
              </div>

              

            <Grid
              container
              direction="row"
              alignItems={"center"}
              justifyContent="space-between"
              sx={{ my: 1 }}
            >
              <Grid item sx={{width: "33%"}}>
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
                  <Typography>Views:</Typography>
                  {submissionDataResponse.submission.stats["views"]}
                  <Divider
                    orientation="vertical"
                    variant="middle"
                    flexItem
                    sx={{ height: 22 }}
                  />
                  <Typography>Clicks:</Typography>
                  {submissionDataResponse.submission.stats["clicks"]}
                  <Divider orientation="vertical" variant="middle" flexItem />
                  <Typography>Shares:</Typography>
                  {submissionDataResponse.submission.stats["shares"]}
                </Box>
              </Grid>

              {data.submission.type === "user_submission" &&
                <Grid item sx={{width: "66%"}}>
                  <Grid container>
                    <Grid item>
                      {(
                        <Grid container alignItems="center">
                          <Grid item>
                            <div>
                              <FormControl
                                sx={{maxWidth: 225, minWidth: 225}}
                                size="small"
                              >
                                <InputLabel id="demo-multiple-checkbox-label">
                                  Remove from Community
                                </InputLabel>
                                <Select
                                  labelId="demo-multiple-checkbox-label"
                                  id="demo-multiple-checkbox"
                                  value={removeCommunityIDList}
                                  onChange={handleRemoveDropdownChange}
                                  input={
                                    <OutlinedInput label="Remove from Community"/>
                                  }
                                  sx={{borderRadius: "4px 0 0 4px"}}
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
                          <Grid item sx={{marginRight: "10px"}}>
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                sx={{background: "#ddd", borderRadius: "0 4px 4px 0", padding: "8px"}}
                                onClick={deleteSubmissionfromCommunity}
                              >
                                <Delete/>
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      )}
                    </Grid>
                    <Grid item>
                      <Grid container alignItems="center">
                        {/* save */}
                        <Grid item>
                          <div>
                            <FormControl
                              sx={{ maxWidth: 225, minWidth: 225 }}
                              size="small"
                            >
                              <InputLabel
                                id="demo-multiple-checkbox-label"
                                sx={{ width: 225 }}
                              >
                                Save to Community
                              </InputLabel>
                              <Select
                                labelId="demo-multiple-checkbox-label"
                                id="demo-multiple-checkbox"
                                value={saveCommunityIDList}
                                onChange={handleSaveDropdownChange}
                                sx={{borderRadius: "4px 0 0 4px"}}
                                input={
                                  <OutlinedInput label="Save to Community" />
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
                        <Grid item sx={{marginRight: "0px"}}>
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              sx={{background: "#ddd", borderRadius: "0 4px 4px 0", padding: "8px"}}
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
              <div style={{width: "20%"}}>
                <ActionButton
                  type="filled"
                  variant="contained"
                  name="connect"
                  style={{width: "95%", padding: "8px"}}
                  action={(event) =>
                    handleClickOptionsMenu(
                      event,
                      "connect",
                      submissionDataResponse.submission.submission_id
                    )
                  }
                >
                  <AddLinkIcon /> &nbsp; Connect
                </ActionButton>
              </div>
              <div style={{width: "20%"}}>
                <ActionButton
                  type="filled"
                  variant="contained"
                  name="shareurl"
                  style={{width: "95%", padding: "8px"}}
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
              <div style={{width: "20%"}}>
                <ActionButton
                  type="filled"
                  variant="contained"
                  name="feedback"
                  style={{width: "95%", padding: "8px"}}
                  action={(event) => handleClickOptionsMenu(event, "feedback")}
                >
                  <FeedbackIcon />
                  &nbsp;Feedback
                </ActionButton>
              </div>
              {submissionDataResponse.submission.can_delete && (
                <div style={{width: "20%"}}>
                  <ActionButton
                    type="filled"
                    style={{width: "95%", padding: "8px"}}
                    variant="contained"
                    action={handleClickEdit}
                  >
                    <Edit />
                    &nbsp; Edit
                  </ActionButton>
                </div>
              )}
              {submissionDataResponse.submission.can_delete && (
                <div style={{width: "20%"}}>
                  <ActionButton
                    color="error"
                    type="filled"
                    style={{width: "95%", padding: "8px"}}
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
            <Typography sx={{ fontSize: 16 }}>
              {submissionDataResponse.submission.highlighted_text}
            </Typography>
            <Grid
              container
              width={1}
              margin="auto"
              justifyContent={"flex-start"}
              spacing={4}
            ></Grid>
            <div>
              <Typography sx={{ fontSize: 18, marginTop: 2 }}>
                Connections:
              </Typography>
              {submissionDataResponse.submission.connections.length > 0 ? (
                <>
                  {submissionDataResponse.submission.connections.map(
                    (d, index) => (
                      <>
                        <SearchResult
                          search_idx={index}
                          redirect_url={d.redirect_url}
                          display_url={d.display_url}
                          submission_id={d.submission_id}
                          result_hash={d.result_hash}
                          highlighted_text={d.highlighted_text}
                          explanation={d.explanation}
                          auth_token={jsCookie.get("token")}
                          show_relevant={true}
                        ></SearchResult>
                      </>
                    )
                  )}
                </>
              ) : (
                <Typography sx={{ fontSize: 14, color: "grey", marginLeft: 2 }}>
                  None available
                </Typography>
              )}
            </div>
            <Dialog open={openEdit} onClose={handleCloseEdit}>
              <DialogTitle style={{ width: "500px" }}>
                {" "}
                Edit Submission Details{" "}
              </DialogTitle>
              <DialogContent>
                <DialogContentText></DialogContentText>
                <TextField
                  autoFocus
                  margin="dense"
                  id="editURL"
                  label="Submission URL"
                  fullWidth
                  variant="standard"
                  multiline
                  defaultValue={
                    submissionDataResponse.submission.raw_source_url
                  }
                />
                <TextField
                  autoFocus
                  margin="dense"
                  id="editExplanation"
                  label="Submission Title"
                  fullWidth
                  variant="standard"
                  defaultValue={submissionDataResponse.submission.explanation}
                />
                <TextField
                  autoFocus
                  margin="dense"
                  id="editHighlightedText"
                  label="Description"
                  fullWidth
                  variant="standard"
                  multiline
                  defaultValue={
                    submissionDataResponse.submission.highlighted_text
                  }
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseEdit}>Cancel</Button>
                <Button onClick={editSubmission}>Save</Button>
              </DialogActions>
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
          <ForceGraph3D
            ref={fgRef}
            graphData={graph}
            width={width}
            height={height}
            backgroundColor={'#e5e5e5'}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            //nodeThreeObject={drawNormalNode}
            nodeAutoColorBy="type"
            linkAutoColorBy="source"
            nodeLabel={handleNodeLabel}
            linkColor={() => 'rgba(0,0,0,0.7)'}
            onNodeHover={handleNodeHover}
            linkDirectionalParticles={1}
        />
          </Paper>
      </div>
      <Footer />
    </>
  );
}

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
    var URL = baseURL_server + getSubmissionEndpoint + context.query.id;
    const res = await fetch(URL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });
    const data = await res.json();
    const errorCode = res.ok ? false : res.status;

    return {
      props: { errorCode, data },
    };
  }
}

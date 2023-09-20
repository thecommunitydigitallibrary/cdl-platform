import React, { useContext, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import InputLabel from "@mui/material/InputLabel";
import jsCookie from "js-cookie";

import Router from "next/router";

import {
  AppBar,
  Avatar,
  Box,
  Card,
  Button,
  createTheme,
  Divider,
  Grid,
  IconButton,
  ListItemText,
  makeStyles,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  LinearProgress,
  ListItemIcon,
  ListItemButton,
  ListItem,
} from "@mui/material";

import SearchBarHeader from "./forms/searchBarHeader";
import DrawerComp from "../components/homepage/drawer"
import AppContext from "./appContext";

import { Add, Upload } from "@mui/icons-material";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Image from "next/image";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";

// Example of JSON, this is displayed to frontend.
const json_example = `{
  "data": [
    {
      "source_url": "https://textdata.org/about",
      "description": "About the CDL",
      "title": "This page contains information about the CDL."
    },
    {
      "source_url": "https://www.google.com/",
      "description": "Google Search",
      "title": "The classic home page for Google."
    }
  ]
}
`;
// Expectied fields in each submission
const expected_submission_fields = ["source_url", "description", "title"];
// Separate function for checking each field, hopefully this allows for reusability
async function validateSubmissionField(
  field_type,
  value,
  errors = [],
  idx = null
) {
  if (field_type == "source_url") {
    if (value == null || value == undefined) {
      errors.push(
        `Submission ${idx}: Invalid type (null or undefined) for ${field_type}`
      );
      return false;
    } else if (value == "") {
      errors.push(
        `Submission ${idx}: Expected a non-empty value for ${field_type}`
      );
      return false;
    }
  } else if (field_type == "description") {
    if (value == null || value == undefined) {
      errors.push(
        `Submission ${idx}: Invalid type (null or undefined) for ${field_type}`
      );
      return false;
    } else if (value == "") {
      errors.push(
        `Submission ${idx}: Expected a non-empty value for ${field_type}`
      );
      return false;
    }
  } else if (field_type == "title") {
    if (value == null || value == undefined) {
      errors.push(
        `Submission ${idx}: Invalid type (null or undefined) for ${field_type}`
      );
      return false;
    } else if (value == "") {
      errors.push(
        `Submission ${idx}: Expected a non-empty value for ${field_type}`
      );
      return false;
    }
  }
  return true;
}

function Header(props) {
  // State variable for showing batch upload or single submission
  const [batch, setBatchOption] = useState(false);
  // JSON parsed from file upload
  const [uploadJSON, setUploadJSON] = useState(null);
  // Issues received from backend
  const [foundIssues, setFoundIssues] = useState({});
  // State variables corresponding to the first check (JSON or not)
  const [has_uploaded, setUploaded] = useState(false);
  const [upload_status, setUploadStatus] = useState("error");
  const [upload_status_message, setUploadStatusMessage] = useState("");
  // State variables corresponding to second check (passes validation)
  const [has_validated, setValidated] = useState(false);
  const [validate_status, setValidateStatus] = useState("error");
  const [validate_status_message, setValidateStatusMessage] = useState("");
  // State variables corresponding to third check (successful upload to backend)
  const [has_submit_batch, setSubmitBatch] = useState(false);
  const [submit_batch_status, setSubmitBatchStatus] = useState("error");
  const [submit_batch_message, setSubmitBatchMessage] = useState("");
  // State variable to show/hide error button for error log
  const [view_submit_errors, setSubmitErrors] = useState(false);
  const [show_progress, setShowProgress] = useState(false);
  // Function that checks each submission in the JSON.
  async function validateSubmissionJSON(input) {
    // Function for validating each submission. Checks if each key is present,
    // and also checks if the values are okay or not.
    async function validateSubmission(submission, issues, idx) {
      var submission_fields = Object.keys(submission);
      if (submission_fields.length != expected_submission_fields.length)
        return false;
      var errors = [];
      for (let i = 0; i < expected_submission_fields.length; ++i) {
        // Check if submitted JSON has each key that we need
        var check_field = expected_submission_fields[i];
        if (!submission_fields.includes(check_field)) {
          errors.push(
            `Submission ${idx}: Missing ${expected_submission_fields[i]}.`
          );
        }

        var field_value = submission[check_field];
        await validateSubmissionField(check_field, field_value, errors, idx);
        if (errors.length != 0) issues[idx] = errors;
      }
    }

    var issues = {};
    for (let i = 0; i < input.length; ++i) {
      let each_submission = input[i];
      await validateSubmission(each_submission, issues, i);
    }
    return issues;
  }
  // Necessary States for Alert Message
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("error");
  const handleClick = () => {
    setOpen(true);
  };
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };
  const [selected_community, setCommunity] = useState("");
  const handleSelectCommunity = async (event) => {
    setCommunity(event.target.value);
  };

  // Necessary variables and functions for edit
  const [openSubmission, setOpenSubmission] = useState(false);
  const handleClickSubmission = () => {
    setOpenSubmission(true);
  };

  const handleCloseSubmission = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    // This closes the submission modal.
    setOpenSubmission(false);
    // Resets all of the state variables for components inside the modal.
    setSubmitErrors(false);
    setBatchOption(false);
    setUploaded(false);
    setValidated(false);
    setSubmitBatch(false);
    setCommunity("");
  };
  const createNewSubmission = async (event) => {

    if (batch) {

      if (uploadJSON == null) {
        setUploadStatus("error");
        setUploadStatusMessage("A file hasn't been uploaded.");
        setUploaded(true);
        return;
      }

      // Assumes the file has been parsed and saved to uploadJSON
      var ret_issues = await validateSubmissionJSON(uploadJSON["data"]);
      var URL = baseURL_client + createSubmissionEndpoint + "batch/";
      // After validating the JSON, if we find any issues (client side)
      // such as missing fields or invalid entries, show Alert message
      if (Object.keys(ret_issues).length > 0) {
        // Issues found with JSON
        setValidateStatus("error");
        setValidateStatusMessage("Issues found with JSON data!");
        setValidated(true); // Show the first Alert in the modal
        return;
      }
      setValidateStatus("success");
      setValidateStatusMessage("No issues found with JSON data!");
      setValidated(true);

      if (selected_community == "") {
        setSeverity("error");
        setMessage("A community must be selected.");
        handleClick();
        return;
      }
      setShowProgress(true);
      // Send Request
      let res = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({
          data: uploadJSON["data"],
          community: selected_community,
        }),
        headers: new Headers({
          Authorization: jsCookie.get("token"),
          "Content-Type": "application/json",
        }),
      });

      let resJson = await res.json();
      if (res.status === 200) {
        setSeverity("success");
        setMessage("Added batch of submissions successfully!");
        handleCloseSubmission();
        handleClick();
        setShowProgress(false);
        return;
      } else {
        setSubmitBatchStatus("error");
        setSubmitBatchMessage("Issues found with some submissions.");
        setFoundIssues(JSON.stringify(resJson.message));
        setSubmitBatch(true); // Show third Alert message
        setSubmitErrors(true); // Show the button to copy error log
        setShowProgress(false);
        return;
      }
    } else {
      let formData = new FormData();
      var URL = baseURL_client + createSubmissionEndpoint;
      var getSubmissionTitle = document.getElementById("submissionTitle");
      var getSubmissionURL = document.getElementById("submissionURL");
      var getSubmissionDescription = document.getElementById(
        "submissionDescription"
      );
      // Check inputs to determine whether they are valid
      // Use the validateSubmissionField function to check values
      if (
        !(await validateSubmissionField("source_url", getSubmissionURL.value))
      ) {
        console.log("source url invalid");
        setSeverity("error");
        setMessage(`"source_url" field is invalid.`);
        handleClick();
        return;
      } else if (
        !(await validateSubmissionField(
          "highlighted_text",
          getSubmissionDescription.value
        ))
      ) {
        setSeverity("error");
        setMessage(`"highlighted_text" field is invalid.`);
        handleClick();
        return;
      } else if (
        !(await validateSubmissionField(
          "explanation",
          getSubmissionTitle.value
        ))
      ) {
        setSeverity("error");
        setMessage(`"explantion" field is invalid.`);
        handleClick();
        return;
      }
      formData.append("community", selected_community);
      formData.append("source_url", getSubmissionURL.value);
      formData.append("highlighted_text", getSubmissionDescription.value);
      formData.append("explanation", getSubmissionTitle.value);
      const res = await fetch(URL, {
        method: "POST",
        body: formData,
        headers: new Headers({
          Authorization: jsCookie.get("token"),
        }),
      });
      const response = await res.json();
      if (res.status == 200) {
        setSeverity("success");
        setMessage(response.message);
        handleClick();
        handleCloseSubmission();
      } else {
        setSeverity("error");
        setMessage(response.message);
        handleClick();
      }
    }
  };

  const myContext = useContext(AppContext);
  const theme = createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        mdPlus: 990, // Custom breakpoint between md and lg
        lg: 1280,
        xl: 1920,
      },
    },
  });
  const [loggedOut, setLoggedOut] = useState(false);
  const [dropdowndata, setDropDownData] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };


  const getCommunitiesEndpoint = "getCommunities";
  const updateDropDownSearch = async () => {
    let resp = await fetch(baseURL_client + getCommunitiesEndpoint, {
      method: "GET",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const responseComm = await resp.json();
    localStorage.setItem("dropdowndata", JSON.stringify(responseComm));
    setDropDownData(responseComm);
  };

  useEffect(() => {
    if (window.localStorage.getItem("dropdowndata")) {
      setDropDownData(JSON.parse(window.localStorage.getItem("dropdowndata")));
    } else {
      updateDropDownSearch();
      // window.location.reload()
    }
    setLoggedOut(
      jsCookie.get("token") == "" || jsCookie.get("token") == undefined
    );
  }, [jsCookie.get("token")]);

  useEffect(() => {
  }, [dropdowndata]);

  const createSubmissionEndpoint = "submission/";
  const settings = [
    {
      label: "Notes",
      value: "notes",
    },
    {
      label: "Communities",
      value: "communities",
    },
    {
      label: "Submissions",
      value: "ownSubmissions",
    },
    {
      label: "Make Submission",
      value: "indexSubmission",
    },
  ];

  const loggedOutSettings = [
    {
      label: "Setup",
      value: "setup",
    },
    {
      label: "FAQ",
      value: "faq",
    },
    {
      label: "Release Log",
      value: "releaselog",
    }
  ];

  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const isMedium = useMediaQuery(theme.breakpoints.down("mdPlus"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const logout = async (event) => {
    event.preventDefault();
    jsCookie.remove("token");
    localStorage.removeItem("dropdowndata");
    Router.push("/");
  };

  const handleUserClickMenu = (event, option) => {
    if (option == "communities") {
      Router.push("/communities");
    } else if (option == "ownSubmissions") {
      Router.push("/search?own_submissions=True&community=all");
    } else if (option == "notes") {
      Router.push("/notes");
    } else if (option == "about") {
      Router.push("/about");
    } else if (option == "documentation") {
      Router.push("/documentation");
    } else if (option != "logout") {
      Router.push("/logout");
    } else {
      logout(event);
    }
  };


  // for some reason, adding && != undefined makes box render weirdly
  if (!loggedOut) {
    return (
      <ThemeProvider theme={theme}>
        <AppBar>
          <Toolbar >
            <Grid
              container
              justifyContent={"space-between"}
              alignItems={"center"}
              sx={{ minHeight: "65px", overflow: "hidden" }}
            >
              <Grid className="flex items-center space-x-2 text-2xl mr-2 mt-2 font-medium text-white-500 dark:text-white-100">
                <a href="/">
                  <a>
                    <Image
                      src="/images/tree48.png"
                      alt="CDL"
                      width="40"
                      height="40"
                      className="w-8"
                    />
                  </a>
                </a>
              </Grid>
              <Grid item sx={{ flexGrow: 1 }}>
                {props.renderSearchBar != undefined ? (
                  <Typography className="user_name" fontSize={15}>
                    &nbsp; Welcome, {dropdowndata.username}
                  </Typography>
                ) : (
                  <SearchBarHeader dropdowndata={dropdowndata.community_info} isMedium={isMedium} isSmall={isSmall} />
                )}
              </Grid>

              {isMedium ? (
                <Grid item>
                  <DrawerComp
                    settings={settings}
                    handleUserClickMenu={handleUserClickMenu}
                    handleClickSubmission={handleClickSubmission}
                    username={dropdowndata.username}
                    style={{ position: 'sticky', top: '0', right: '0' }}
                  />
                </Grid>
              ) : (
                <>
                  {settings.map((setting) => (
                    <>

                      {setting.value == 'indexSubmission' ?
                        <Grid item sx={{ flexGrow: 0 }}>
                          <MenuItem onClick={handleClickSubmission}>
                            <Tooltip title="Index a submission">
                              <Add />
                            </Tooltip>
                          </MenuItem>
                        </Grid>
                        :
                        <Grid item sx={{ flexGrow: 0 }}>
                          <MenuItem
                            key={setting.value}
                            value={setting.value}
                            variant="outline"
                            onClick={(event) =>
                              handleUserClickMenu(event, setting.value)
                            }
                          >
                            {setting.label}
                          </MenuItem>
                        </Grid>
                      }
                    </>
                  ))}

                  <Grid item sx={{ flexGrow: 0, ml: "1%" }}>
                    <Tooltip title="Account Information">
                      <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <Avatar />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Box>
                    <Menu
                      sx={{ mt: "45px", flexGrow: 0 }}
                      id="menu-appbar"
                      anchorEl={anchorElUser}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      open={Boolean(anchorElUser)}
                      onClose={handleCloseUserMenu}
                    >
                      <MenuItem>
                        <Typography noWrap>
                          Hello, {dropdowndata.username}
                        </Typography>
                      </MenuItem>

                      <Divider sx={{ borderColor: "black" }} />
                      <MenuItem variant="outline" onClick={() => {
                        Router.push("/about");
                      }}>
                        <Typography>About</Typography>
                      </MenuItem>

                      <MenuItem variant="outline" onClick={() => {
                        Router.push("/documentation");
                      }}>
                        <Typography>Documentation</Typography>
                      </MenuItem>
                      <Divider sx={{ borderColor: "black", mx: "5%" }} />

                      <MenuItem>
                        <Button
                          variant="contained"
                          size="small"
                          color="error"
                          onClick={(event) =>
                            handleUserClickMenu(event, "logout")
                          }
                          className="text-white bg-red-500 rounded-md no-underline"
                        >
                          Logout
                        </Button>
                      </MenuItem>
                    </Menu>
                  </Box>
                </>
              )}
            </Grid>
          </Toolbar>
          <Dialog open={openSubmission} onClose={handleCloseSubmission}>
            <DialogTitle style={{ width: "500px" }}>
              {" "}
              Index a Submission{" "}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                To index a submission, you'll need to have the URL for the
                website, a title for your submission, and a description that
                explains the topic.
              </DialogContentText>
              {!batch ? null : (
                <DialogContentText>
                  Below is an example of how the JSON should be formatted.
                </DialogContentText>
              )}
              {!batch ? (
                <div>
                  <TextField
                    autoFocus
                    margin="dense"
                    id="submissionURL"
                    label="Submission URL"
                    fullWidth
                    variant="standard"
                    defaultValue=""
                  />
                  <TextField
                    margin="dense"
                    id="submissionTitle"
                    label="Submission Title"
                    fullWidth
                    variant="standard"
                    defaultValue=""
                  />
                  <TextField
                    margin="dense"
                    id="submissionDescription"
                    label="Submission Description"
                    fullWidth
                    multiline
                    variant="standard"
                    defaultValue=""
                  />{" "}
                </div>
              ) : (
                <div>
                  <pre>{json_example}</pre>
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <input
                      id="fileupload"
                      type="file"
                      onChange={() => {
                        // File API related code. Grab input element, then send the
                        // first file (we only allow singular uploads) to FileReader.
                        var fileInput = document.getElementById("fileupload");
                        let fileReader = new FileReader();
                        fileReader.readAsText(fileInput.files[0]);
                        fileReader.onloadend = function () {
                          setSubmitErrors(false);
                          setUploaded(false);
                          setValidated(false);
                          setSubmitBatch(false);
                          // Try parsing file, make sure it is a JSON.
                          try {
                            // Save the JSON in a state variable to use in other functions
                            setUploadJSON(JSON.parse(fileReader.result));
                            setUploadStatus("success");
                            setUploadStatusMessage("File is a valid JSON.");
                            setUploaded(true);
                          } catch {
                            setUploadStatus("error");
                            setUploadStatusMessage(
                              "Could not parse the file. Please double check it is formatted correctly."
                            );
                            setUploaded(true);
                            fileInput.value = null; // Clear value if upload was not successful
                            setUploadJSON(null);
                            return;
                          }
                        };
                      }}
                    ></input>
                    <Button
                      sx={{ marginLeft: "auto" }}
                      onClick={() => {
                        navigator.clipboard.writeText(json_example);
                        setSeverity("success");
                        setMessage("Copied example to clipboard!");
                        handleClick();
                      }}
                    >
                      Copy Example
                    </Button>
                  </div>
                  {has_uploaded ? (
                    <Alert sx={{ marginTop: "10px" }} severity={upload_status}>
                      {upload_status_message}
                    </Alert>
                  ) : null}
                  {has_validated ? (
                    <Alert
                      sx={{ marginTop: "10px" }}
                      severity={validate_status}
                    >
                      {validate_status_message}
                    </Alert>
                  ) : null}
                  {show_progress ? <LinearProgress /> : null}
                  {has_submit_batch ? (
                    <div>
                      <Alert
                        sx={{ marginTop: "10px" }}
                        severity={submit_batch_status}
                      >
                        {submit_batch_message}
                      </Alert>
                      {view_submit_errors ? (
                        <Button
                          sx={{ margin: "5px" }}
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(foundIssues);
                            setSeverity("success");
                            setMessage("Copied error log to clipboard!");
                            handleClick();
                          }}
                        >
                          Copy Error Log
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
              <FormControl
                sx={{ minWidth: 200, marginTop: "20px", maxHeight: 150 }}
              >
                <InputLabel id="demo-simple-select-label">
                  Select Community
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  style={{ backgroundColor: "white" }}
                  label="Select Community"
                  value={selected_community}
                  onChange={handleSelectCommunity}
                >
                  {dropdowndata.community_info &&
                    dropdowndata.community_info.map(function (d, idx) {
                      return (
                        <MenuItem key={idx} value={d.community_id}>
                          {d.name}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBatchOption(!batch)}>
                {!batch ? "Batch Upload" : "Single"}
              </Button>
              <Button onClick={handleCloseSubmission}>Cancel</Button>
              <Button onClick={createNewSubmission}>Submit</Button>
            </DialogActions>
          </Dialog>
          <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
            <Alert
              onClose={handleClose}
              severity={severity}
              sx={{ width: "100%" }}
            >
              {message}
            </Alert>
          </Snackbar>
        </AppBar>
      </ThemeProvider>
    );
  } else {
    return (
      <AppBar>
        <Toolbar>

          <div style={{ position: 'sticky', top: '0', right: '0', zIndex: '50' }} className="w-full">
            <nav className="container relative flex flex-wrap items-center justify-between mx-auto lg:justify-between xl:px-0">

              <div className="flex items-center space-x-2 text-2xl font-medium text-white-500 dark:text-white-100">
                <a href="/">
                  <a>
                    <Image
                      src="/images/tree48.png"
                      alt="CDL"
                      width="40"
                      height="40"
                      className="w-8"
                    />
                  </a>
                </a>
                <span className="mb-2">CDL</span>
              </div>

              {/* Add links below based on what to show on About page when logged out */}

              {/* Desktop Menu */}
              {/* <div className="hidden text-center lg:flex lg:items-center">
                <ul className="items-center justify-end flex-1 pt-6 list-none lg:pt-0 lg:flex">
                  {Object.entries(loggedOutSettings).map(([key, item]) => (

                    <li key={key}>
                      <a className="no-underline" href={`/${item.value}`}>
                        <a className="block px-4 py-2 text-white rounded-md dark:text-white-300 hover:text-white-500 focus:text-white-500 focus:bg-white-100 dark:focus:bg-white-800 focus:outline-none no-underline">
                          {item.label}
                        </a>
                      </a>
                    </li>
                  ))}
                </ul>
              </div> */}

              <div className="mr-3 space-x-4 lg:flex nav__item ">
                {!loggedOut ? (
                  <a href="/" className="w-full px-6 py-2 text-center text-white bg-blue-500 rounded-md lg:ml-5 no-underline">
                    Home
                  </a>
                ) : (
                  <a href="/auth" className="w-full px-6 py-2 text-center text-white bg-blue-500 rounded-md lg:ml-5 no-underline">
                    Log in
                  </a>
                )}

                {/* WIP- Dark mode */}
                {/* <ThemeChanger /> */}

              </div>

              {/* If we decide to add more links to the header, we'll need a collapsabel drawer but not rn. So commenting it out: */}

              {/* {isMedium ? (
                <Grid item>
                  <DrawerComp
                    settings={loggedOutSettings}
                    handleUserClickMenu={handleUserClickMenu}
                    handleClickSubmission={handleClickSubmission}
                    username={dropdowndata.username}
                    style={{ position: 'sticky', top: '0', right: '0' }}
                  />
                </Grid>
              ) : <></>} */}
            </nav>
          </div>

          <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
            <Alert
              onClose={handleClose}
              severity={severity}
              sx={{ width: "100%" }}
            >
              {message}
            </Alert>
          </Snackbar>
        </Toolbar>
      </AppBar>
    );
  }
}

export default Header;
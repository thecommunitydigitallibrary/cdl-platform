/*global chrome*/
import * as React from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import FormData from "form-data";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from "rehype-sanitize";
import { getCodeString } from 'rehype-rewrite';
import katex from "katex";
import "katex/dist/katex.min.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function ImgMediaCard({ setUrlState }) {
  const [community, setCommunity] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [isAnonymous, setAnonymous] = React.useState(true);
  const [allCommunities, setAllCommunities] = React.useState([]);
  const [description, setDesciption] = React.useState("");
  const [url, setUrl] = React.useState("");

  const [open, setOpen] = React.useState(false);
  const [sever, setSever] = React.useState("");
  const [message, setMessage] = React.useState("");
  const baseURL = localStorage.getItem('backendSource') + "api/";

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const handleAnonymous = async (event) => {
    if (isAnonymous) {
      setAnonymous(false)
    } else {
      setAnonymous(true)
    }
  }

  const handleChange = (event) => {
    setCommunity(event.target.value);
  };

  let getSelectionText = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      var url = tabs[0].url;
      window.source_url = url;
      var hasHttp = url.includes("http") || url.includes("https");
      if (!hasHttp) {
        setSever("info");
        setMessage("The extension may not work on this URL.");
        handleClick();
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: () => getSelection().toString(),
        },
        (result) => {
          if (result === undefined) {
            setDesciption("");
          } else {
            setUrlState(url, result[0].result);
            setDesciption(result[0].result);
            setUrl(url);
          }
        }
      );
    });
  };

  let getCommunities = async () => {
    try {
      var config = await fetch(baseURL + "getCommunities", {
        method: "get",
        headers: {
          Authorization: localStorage.getItem("authToken"),
          "Content-Type": "application/json",
        },
      });

      let response = await config.json();
      if (response.status === "ok") {
        setAllCommunities(response.community_info);
      } else {
        setSever("error")
        setMessage(response.message);
        handleClick();
      }
    } catch (error) {
      setSever("error");
      setMessage("Unable to fetch your communities, Please try again.");
      handleClick();
    }
  };


  React.useEffect(() => {
    getCommunities();
    getSelectionText();
  }, []);

  const onChangeDescription = (e) => setDesciption(e.target.value);

  const onChangeTitle = (e) => setTitle(e.target.value);

  const onClear = () => {
    setTitle("");
    setDesciption("");
    setCommunity("");
  }



  const onSubmit = async () => {
    try {
      var data = new FormData();
      if (title === "") {
        setSever("error");
        setMessage("Please enter a submission title.");
        handleClick();
        return;
      } else if (community === "") {
        setSever("error");
        setMessage("Please select a community.");
        handleClick();
        return;
      }
      var hasHttp = url.includes("http") || url.includes("https");
      if (!hasHttp) {
        setSever("error");
        setMessage("Sorry, the extension doesn't work on this URL.");
        handleClick();
        return;
      }

      // In the submission schema, the user entered title is named as explanation and 
      // user highlighted text and/or description on the source url is named as highlighted_text. 
      data.append("explanation", title);
      data.append("source_url", url);
      data.append("highlighted_text", description);
      data.append("community", community);
      data.append("anonymous", isAnonymous);

      let res = await fetch(baseURL + "submission/", {
        method: "post",
        headers: {
          Authorization: localStorage.getItem("authToken"),
        },
        body: data,
      });

      let response = await res.json();
      if (response.status === "ok") {
        setSever("success");
        setMessage("Your submission was successfully saved");
        handleClick();
        setTitle("");
        setCommunity("");
        setDesciption("");
        setTimeout(() => {
        }, 2000);
      } else {
        setSever("error");
        // console.log(response.message);
        setMessage(response.message);
        handleClick();
      }
    } catch (error) {
      setSever("error");
      setMessage("Error occurred. Please submit again!");
      handleClick();
    }
  };

  return (
    <div>
      <Box
        component="form"
        sx={{
          "& .MuiTextField-root": { width: "100%" },
          marginTop: "10px",
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          id="outlined-multiline-static"
          multiline
          rows={2}
          value={title}
          onChange={onChangeTitle}
          placeholder="Title"
        />
      </Box>
      <Box
        component="form"
        sx={{
          "& .MuiTextField-root": { width: "100%" },
          marginTop: "20px",
          marginBottom: "20px"
        }}>
        <MDEditor
          variant="standard"
          value={description}
          onChange={setDesciption}
          highlightEnable={false}
          preview="live"
          height={200}
          minHeight="100%"
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
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="2vh"
      >
        <FormControl style={{ width: "100%", maxHeight: 100 }}>
          <InputLabel id="demo-simple-select-label">Community</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={community}
            style={{ textAlign: "left" }}
            label="Community"
            onChange={handleChange}
          >
            {allCommunities.length > 0 &&
              allCommunities.map((community) => (
                <MenuItem
                  key={community.community_id}
                  value={community.community_id}
                >
                  {community.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>
      <FormGroup>
        <FormControlLabel control={<Checkbox defaultChecked={isAnonymous} onChange={handleAnonymous} />} label="Anonymous" />
      </FormGroup>
      <div style={{ display: "flex", marginTop: "20px" }}>
        <Button variant="contained" style={{ padding: 14, width: "48%", marginRight: "20px" }}
          onClick={onClear}>
          CLEAR
        </Button>
        <Button variant="contained" style={{ padding: 14, width: "48%" }} onClick={onSubmit}>
          SAVE
        </Button>
      </div>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={sever} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
      <br></br>
    </div>
  );
}
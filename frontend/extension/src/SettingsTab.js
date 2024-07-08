/*global chrome*/
import * as React from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormLabel";
import FormLabel from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel"
import Radio from "@mui/material/Radio"
import RadioGroup from "@mui/material/RadioGroup"
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import TextField from "@mui/material/TextField"
import {createTheme, ThemeProvider} from "@mui/material/styles";

const TEXTDATA_URL = "https://textdata.org/";
const LOCALHOST_DEFAULT = "http://localhost:8080/";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


const theme = createTheme();

export default function ImgMediaCard({setUrlState}) {

  let backendSource = localStorage.getItem('backendSource');

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("");


  const [selectedValue, setSelectedValue] = React.useState((backendSource === null || backendSource === TEXTDATA_URL) ? TEXTDATA_URL : 'other');
  const [disabled, setDisabled] = React.useState(selectedValue !== "other");
  const [source, setSource] = React.useState(selectedValue === "other" ? backendSource : LOCALHOST_DEFAULT);
  const [defaultTab, setDefaultTab] = React.useState(localStorage.getItem('defaultTab') === null ? "find" : localStorage.getItem('defaultTab'));
  const handleClick = () => {
    setOpen(true);
  };

  const onSourceChange = (event) => {
    setSource(event.target.value);
  }

  const logout = () => {
    localStorage.removeItem('authToken')
  }

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
    if (event.target.value === "other") {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  const handleDefaultTabChange = (event) => {
    setDefaultTab(event.target.value);
  };


  React.useEffect(() => {
  }, []);

  const onDefault = () => {
    setDefaultTab("save");
    setSelectedValue(TEXTDATA_URL);
    setSource(LOCALHOST_DEFAULT);
    setDisabled(true);
  }

  const onSubmit = () => {
    try {
      const backend = selectedValue === "other" ? source : selectedValue;
      localStorage.setItem('backendSource', backend);
      localStorage.setItem('defaultTab', defaultTab);
      setSeverity("success");
      setMessage("Extension Settings Saved!");
      if (backendSource !== backend) {
        logout();
      }

      handleClick();
    } catch (error) {
      setSeverity("error");
      setMessage("Error occurred. Please try to save again!");
      handleClick();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        component="form"
        sx={{
          "& .MuiTextField-root": {width: "100%"},
          marginTop: "10px",
        }}
        noValidate
        autoComplete="off"
      >
        <FormControl>
          <FormLabel id="demo-controlled-radio-buttons-group">Default Tab</FormLabel>
          <RadioGroup
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={defaultTab}
            onChange={handleDefaultTabChange}
          >
            <FormControlLabel value="save" control={<Radio/>} label="Save"/>
            <FormControlLabel value="find" control={<Radio/>} label="Find"/>
          </RadioGroup>
          <FormLabel id="demo-controlled-radio-buttons-group">Backend Source</FormLabel>
          <RadioGroup
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={selectedValue}
            onChange={handleChange}
          >
            <FormControlLabel value={TEXTDATA_URL} control={<Radio/>} label="textdata.org"/>
            <FormControlLabel value="other" control={<Radio/>} label="other"/>
            <TextField
              sx={{ml: 1, flex: 1}}
              value={source}
              onChange={onSourceChange}
              style={{margin: 0}}
              placeholder="Enter backend source"
              id="margin-none"
              disabled={disabled}
            />
          </RadioGroup>
        </FormControl>
      </Box>


      <div style={{display: "flex", marginTop: "20px"}}>
        <Button variant="contained" style={{padding: 14, width: "48%", marginRight: "20px"}}
                onClick={onDefault}>
          DEFAULT
        </Button>
        <Button variant="contained" style={{padding: 14, width: "48%"}} onClick={onSubmit}>
          SAVE
        </Button>
      </div>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{width: "100%"}}>
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import Snackbar from "@mui/material/Snackbar";
import {useNavigate} from "react-router-dom";
import MuiAlert from "@mui/material/Alert";

const theme = createTheme();

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function SignIn({setUrlState}) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [sever, setSever] = React.useState("");
  const baseURL = localStorage.getItem('backendSource') + "api/";
  const loginEndpoint = baseURL + "users/login"
  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let username = data.get("username");
    let password = data.get("password");

    if (username === "") {
      setSever("error");
      setMessage("Username field cannot be empty");
      handleClick();
      return;
    } else if (password === "") {
      setSever("error");
      setMessage("Password field cannot be empty");
      handleClick();
      return;
    }

    try {
      let res = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      let response = await res.json();
      if (response.status === "ok") {
        setSever("success");
        setMessage("Successfully logged in!");
        handleClick();
        navigate("/");
        localStorage.setItem("authToken", response.token);
      } else {
        setSever("error");
        setMessage(response.message)
        handleClick();
      }
    } catch (err) {
      setSever("error");
      setMessage("Something went wrong! Please try again later.");
      handleClick();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{mt: 1}}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Username or Email"
              name="username"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{mt: 3, mb: 2}}
              style={{padding: "14px"}}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={sever} sx={{width: "100%"}}>
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

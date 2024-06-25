import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect } from "react";
import Router from "next/router";
import jsCookie from "js-cookie";
import ActionButton from "../components/buttons/actionbutton";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Head from "next/head";
import { LinearProgress } from "@mui/material";
import useUserDataStore from "../store/userData";
import useQuickAccessStore from "../store/quickAccessStore";

import { BASE_URL_CLIENT, COMMUNITIES_ENDPOINT, LOGIN_ENDPOINT, CREATE_ACCOUNT_ENDPOINT, RESET_PW_REQUEST_ENDPOINT } from "../static/constants";

const minUsernameLength = "2";
const minPasswordLength = "6";

export default function ({ data }) {
  // URL is reset=True&hash=<token>

  const router = useRouter();
  let { queryParam } = router.query;

  const [resetParam, setResetParam] = useState(
    queryParam ? queryParam.reset : false
  );
  const [hashParam, setHashParam] = useState(queryParam ? queryParam.hash : "");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [create_email, setCreateEmail] = useState("");
  const [create_username, setCreateUsername] = useState("");
  const [create_password, setCreatePassword] = useState("");
  const [check_password, setCheckPassword] = useState("");
  const [matches, setMatches] = useState(true);
  const [matchesReset, setMatchesReset] = useState(true);
  const [authMode, setAuthMode] = useState(resetParam ? "resetMode" : "signin");
  const [pwdResetReqSent, setPwdResetReqSent] = useState(false);

  const [resetEmailInput, setResetEmailInput] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");

  // States for Login/Create Account Alerts
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("error");
  const [authMessage, setAuthMessage] = useState("");


  const { communityData, setcommunityData } = useQuickAccessStore();
  const [showProgress, setShowProgress] = useState(false);
  const { userCommunities, isLoggedOut, setLoggedOut, setUserDataStoreProps } = useUserDataStore();

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
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
    // community_info

    setUserDataStoreProps({ userCommunities: responseComm.community_info });
    setUserDataStoreProps({ userFollowedCommunities: responseComm.followed_community_info });
    setcommunityData(responseComm.community_info);
    localStorage.setItem("dropdowndata", JSON.stringify(responseComm));
  };

  let handleSignin = async (e) => {
    e.preventDefault();
    setShowProgress(true)
    try {
      let res = await fetch(BASE_URL_CLIENT + LOGIN_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      let resJson = await res.json();
      if (res.status === 200) {
        jsCookie.set("token", resJson.token);
        setLoggedOut(false);

        // adding dropdown data to local storage
        updateDropDownSearch();
        setShowProgress(false)
        Router.push("/");
      } else {
        setShowProgress(false)
        setSeverity("error");
        setAuthMessage(
          "Either the password is incorrect, or this user does not exist."
        );
        handleClick();
      }
    } catch (err) {

      setShowProgress(false)
      setSeverity("error");
      setAuthMessage("Something went wrong! Please try again later.");
      handleClick();
    }
  };
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setShowProgress(true)
    try {
      if (create_password !== check_password) {
        setSeverity("error");
        setAuthMessage("Passwords should match");
        handleClick();
        return;
      }
      let res = await fetch(BASE_URL_CLIENT + CREATE_ACCOUNT_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          username: create_username,
          email: create_email,
          password: create_password,
        }),
      });
      let resJson = await res.json();
      if (res.status === 200) {
        jsCookie.set("token", resJson.token);
        setLoggedOut(false);
        updateDropDownSearch();
        setShowProgress(false)
        Router.push("/");
      } else {
        setShowProgress(false)
        setSeverity("error");
        setAuthMessage(resJson.message);
        handleClick();
      }
    } catch (err) {

      setShowProgress(false)
      setSeverity("error");
      setAuthMessage("Something went wrong! Please try again later.");
      handleClick();
    }
  };

  const changeAuthMode = (mode) => {
    setAuthMode(mode);
  };

  const handleResetEmail = async (e) => {
    e.preventDefault();
    setShowProgress(true)
    try {
      if (resetEmailInput === "") {
        return alert("Please enter a valid email inside the text box.");
      } else {
        let res = await fetch(
          BASE_URL_CLIENT + RESET_PW_REQUEST_ENDPOINT,
          {
            method: "POST",
            body: JSON.stringify({
              email: resetEmailInput,
            }),
          }
        );
        let resJson = await res.json();

        if (res.status === 200) {
          setPwdResetReqSent(true);
          setShowProgress(false)
        } else {
          setShowProgress(false)
          setSeverity("error");
          setAuthMessage(resJson.message);
          handleClick();
          return;
        }
      }
    } catch (error) {

      setShowProgress(false)
      setSeverity("error");
      setAuthMessage("Could not request a password reset.");
      handleClick();
      changeAuthMode("signin");
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (resetPassword !== resetPasswordConfirm) {
      setSeverity("error");
      setAuthMessage("Passwords do not match.");
      handleClick();
      return;
    }
    try {
      const res = await fetch(BASE_URL_CLIENT + CREATE_ACCOUNT_ENDPOINT, {
        method: "PATCH",
        body: JSON.stringify({
          token: hashParam,
          password: resetPasswordConfirm,
        }),
      });

      const resJson = await res.json();
      if (res.status === 200) {
        jsCookie.set("token", resJson.token);
        updateDropDownSearch();
        Router.push("/");
      } else {
        setSeverity("error");
        setAuthMessage(resJson.message);
        handleClick();
        return;
      }
    } catch (error) {
      setSeverity("error");
      setAuthMessage("Something went wrong. Please try again later");
      handleClick();
      return;
    }
  };

  useEffect(() => {
    if (jsCookie.get("token") != undefined) {
      // log the user out if logged in
      // alternative was to redirect to homepage, but that can cause infinite loop (when token is invalid but defined)
      jsCookie.remove("token");
    }
    if (!router.isReady) return;
    queryParam = router.query;
    setResetParam(router.query.reset);
    if (router.query.reset) {
      setHashParam(router.query.hash);
      setAuthMode("resetMode");
    }
  }, [router.isReady]);

  if (isLoggedOut === true) {
    if (authMode === "signin") {
      return (
        <div className="Auth-form-container" >
          <Head>
            <title>Sign In - TextData</title>
            <link rel="icon" href="/images/tree32.png" />
          </Head>

          <form className="Auth-form" id="signin" onSubmit={handleSignin}>

            <div className="Auth-form-content">
              <h3 className="Auth-form-title">
                <a href="/about">TextData</a>
              </h3>

              <div className="form-group mt-3">
                <label>Username or Email</label>
                <input
                  type="text"
                  className="form-control mt-1"
                  name="username"
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                  placeholder="Enter Username or Email"
                />
              </div>
              <div className="form-group mt-3">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control mt-1"
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  placeholder="Enter Password"
                />
              </div>
              <p align="right">
                <Button onClick={() => changeAuthMode("resetPassword")}>
                  <Typography variant="caption">Forgot Password?</Typography>
                </Button>
              </p>
              <div className="d-grid gap-2 mt-3 text-center">
                <ActionButton form="Auth-form" type="submit" variant="contained" style={{ fontSize: '0.875rem' }}>
                  Sign In
                </ActionButton>
                {showProgress ?
                  <LinearProgress value={showProgress} /> : null}
              </div>
              <div align="center" style={{ marginTop: 10 }}>
                Not registered yet?  {" "}
                <div style={{ display: "inline-block" }}>

                  <button className="appearance-none text-blue-500 underline cursor-pointer"
                    onClick={() => changeAuthMode("signup")}>
                    Create Account
                  </button>

                </div>
              </div>
            </div>
          </form>
          <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
            <Alert
              onClose={handleClose}
              severity={severity}
              sx={{ width: "100%" }}
            >
              {authMessage}
            </Alert>
          </Snackbar>
        </div>
      );
    } else if (authMode === "signup")
      return (
        <div className="Auth-form-container">
          <Head>
            <title>Create an Account - TextData</title>
            <link rel="icon" href="/images/tree32.png" />
          </Head>
          <form className="Auth-form" onSubmit={handleCreateAccount}>
            <div className="Auth-form-content">
              <h3 className="Auth-form-title">
                <a href="/about">TextData</a>
              </h3>

              <div className="form-group mt-3">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control mt-1"
                  name="create_email"
                  onChange={(e) => setCreateEmail(e.target.value)}
                  value={create_email}
                  placeholder="Enter Email"
                />
              </div>
              <div className="form-group mt-3">
                <label>Username</label>
                <input
                  type="text"
                  className="form-control mt-1"
                  name="create_username"
                  onChange={(e) => setCreateUsername(e.target.value)}
                  value={create_username}
                  placeholder="Enter Username"
                  minLength={minUsernameLength}
                />
              </div>
              <div className="form-group mt-3">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control mt-1"
                  name="create_password"
                  onChange={(e) => setCreatePassword(e.target.value)}
                  value={create_password}
                  placeholder="Enter Password"
                  minLength={minPasswordLength}
                />
              </div>
              <div className="form-group mt-3">
                <label>Repeat Password</label>
                <input
                  type="password"
                  className="form-control mt-1"
                  name="check_password"
                  onChange={(e) => {
                    if (create_password != e.target.value) {
                      setMatches(false);
                    } else {
                      setMatches(true);
                    }
                    setCheckPassword(e.target.value);
                  }}
                  value={check_password}
                  placeholder="Repeat Password"
                  minLength={minPasswordLength}
                />
                {matches ? null : (
                  <Alert sx={{ marginTop: "15px" }} severity="error">
                    Passwords do not match!
                  </Alert>
                )}
              </div>
              <div className="d-grid gap-2 mt-3 text-center">
                <ActionButton form="Auth-form" type="submit" variant="contained" style={{ fontSize: '0.875rem' }}>
                  Create Account
                </ActionButton>

                {showProgress ?
                  <LinearProgress value={showProgress} /> : null}
              </div>
              <div className="text-center" style={{ marginTop: 10 }}>
                Already registered?{" "}
                <div style={{ display: "inline-block" }}>

                  <button className="appearance-none text-blue-500 underline cursor-pointer"
                    onClick={() => changeAuthMode("signin")}>
                    Log in
                  </button>
                </div>
              </div>
            </div>
          </form>
          <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
            <Alert
              onClose={handleClose}
              severity={severity}
              sx={{ width: "100%" }}
            >
              {authMessage}
            </Alert>
          </Snackbar>
        </div>
      );
    else if (authMode === "resetPassword")
      return (
        <div className="Auth-form-container">
          <Head>
            <title>Request Password Reset - TextData</title>
            <link rel="icon" href="/images/tree32.png" />
          </Head>
          <div className="d-grid gap-2 mt-3">
            <form className="Auth-form" onSubmit={handleResetEmail}>
              <div className="Auth-form-content">
                <h3 className="Auth-form-title">
                  <a>Reset Password</a>
                </h3>
                {pwdResetReqSent ? (
                  <p>
                    {" "}
                    Success! You will shortly receive an email from no-reply@textdata.org containing the password reset link.
                    Note that the link will expire in 72 hours.
                  </p>
                ) : (
                  <p>
                    {" "}
                    Please enter the email address for the account requesting the
                    password reset.
                  </p>
                )}
                <div className="form-group mt-3">
                  <label>Email</label>
                  {pwdResetReqSent ? (
                    <input
                      type="email"
                      className="form-control mt-1"
                      name="create_email"
                      disabled={true}
                      value={resetEmailInput}
                      placeholder="Reset request for"
                    />
                  ) : (
                    <input
                      type="email"
                      className="form-control mt-1"
                      name="create_email"
                      onChange={(e) => setResetEmailInput(e.target.value)}
                      value={resetEmailInput}
                      placeholder="Enter Email"
                    />
                  )}
                </div>

                {pwdResetReqSent ? (
                  <Grid item className="d-grid gap-2 mt-3">
                    <ActionButton
                      form="Auth-form"
                      type="submit"
                      variant="contained"
                      style={{ fontSize: '0.875rem' }}
                      action={() => changeAuthMode("signin")}
                    >
                      Done
                    </ActionButton>
                  </Grid>
                ) : (
                  <Grid container justifyContent="space-evenly">
                    <Grid item className="d-grid gap-2 mt-3">
                      <ActionButton
                        form="Auth-form"
                        type="submit"
                        variant="contained"
                        style={{ fontSize: '0.875rem' }}
                      >
                        Submit
                      </ActionButton>
                    </Grid>
                    <Grid item className="d-grid gap-2 mt-3">
                      <ActionButton
                        form="Auth-form"
                        type="submit"
                        variant="contained"
                        style={{ fontSize: '0.875rem' }}
                        action={() => changeAuthMode("signin")}
                      >
                        Cancel
                      </ActionButton>
                    </Grid>
                  </Grid>
                )}
              </div>
            </form>{" "}
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
              <Alert
                onClose={handleClose}
                severity={severity}
                sx={{ width: "100%" }}
              >
                {authMessage}
              </Alert>
            </Snackbar>
          </div>
        </div>
      );
    else if (authMode === "resetMode")
      return (
        <div className="Auth-form-container">
          <Head>
            <title>Reset Password - TextData</title>
            <link rel="icon" href="/images/tree32.png" />
          </Head>
          <div className="d-grid gap-2 mt-3">
            <form className="Auth-form" onSubmit={handleResetRequest}>
              <div className="Auth-form-content">
                <h3 className="Auth-form-title">
                  <a>Reset Password</a>
                </h3>
                <div className="form-group mt-3">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control mt-1"
                    name="create_password"
                    onChange={(e) => setResetPassword(e.target.value)}
                    value={resetPassword}
                    placeholder="Enter Password"
                    minlength={minPasswordLength}
                  />
                </div>
                <div className="form-group mt-3">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    className="form-control mt-1"
                    name="check_password"
                    onChange={(e) => {
                      if (resetPassword != e.target.value) {
                        setMatchesReset(false);
                      } else {
                        setMatchesReset(true);
                      }
                      setResetPasswordConfirm(e.target.value);
                    }}
                    value={resetPasswordConfirm}
                    placeholder="Repeat Password"
                    minlength={minPasswordLength}
                  />
                  {matchesReset ? null : (
                    <Alert sx={{ marginTop: "15px" }} severity="error">
                      Passwords do not match!
                    </Alert>
                  )}
                </div>
                <div className="d-grid gap-2 mt-3">
                  <ActionButton
                    form="Auth-form"
                    type="submit"
                    variant="contained"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Confirm
                  </ActionButton>
                </div>
                <p align="right">
                  <Button onClick={() => changeAuthMode("resetPassword")}>
                    <Typography variant="caption">
                      Request another link
                    </Typography>
                  </Button>
                </p>
              </div>
            </form>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
              <Alert
                onClose={handleClose}
                severity={severity}
                sx={{ width: "100%" }}
              >
                {authMessage}
              </Alert>
            </Snackbar>
          </div>
        </div>
      );
    else return <div>Refresh</div>;
  }
  else return <div>
    <LinearProgress value={true} />
  </div>;
}

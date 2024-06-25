import { useState } from "react";
import jsCookie from "js-cookie";
import { Start, Key, VerifiedUser, Person } from "@mui/icons-material";
import { Card, Tooltip, IconButton, Typography } from "@mui/material";
import { Snackbar, Alert } from "@mui/material";
import useCommunitiesStore from "../store/communitiesStore";
import useUserDataStore from "../store/userData";
import useQuickAccessStore from "../store/quickAccessStore";

import { BASE_URL_CLIENT, COMMUNITIES_ENDPOINT, JOIN_COMMUNITY_ENDPOINT } from "../static/constants"


function CommunityHistoryEntry(props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("error");


  const { setUserDataStoreProps } = useUserDataStore();

  const { communityData, setcommunityData } = useQuickAccessStore();

  const handleClick = () => {
    setOpen(true);
  };
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const copyJoinKey = (event) => {
    try {
      navigator.clipboard.writeText(props.joinKey);
      setSeverity("success");
      setMessage("Join key copied to clipboard");
      handleClick();
    } catch {
      setSeverity("error");
      setMessage("Could not copy join key to clipboard");
      handleClick();
    }
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

    setUserDataStoreProps({ userCommunities: responseComm.community_info });
    setUserDataStoreProps({ userFollowedCommunities: responseComm.followed_community_info });
    setcommunityData(responseComm.community_info);
    localStorage.setItem('dropdowndata', JSON.stringify(responseComm))
  }

  const joinCommunity = async (event) => {
    var URL = BASE_URL_CLIENT + JOIN_COMMUNITY_ENDPOINT;
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        join_key: props.joinKey,
      }),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });

    const response = await res.json();
    if (res.status == 200) {
      setSeverity("success");
      setMessage(response.message);
      handleClick();
      handleClose();
      updateDropDownSearch();
      window.location.reload();
    } else {
      setSeverity("error");
      setMessage(response.message);
      handleClick();
    }
  };
  return (
    <div>
      <Card variant="outlined" sx={{ width: "75%", maxHeight: '200px', padding: "15px" }}>
        <div style={{ display: "flex" }}>
          <div>
            <h4>{props.name}</h4>
            <p>
              {" "}
              {props.description != ""
                ? props.description
                : "No description has been added for this community."}
            </p>
            <p>{props.time}</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Tooltip
                title={<Typography>Rejoin Community</Typography>}
                placement="right-start"
              >
                <IconButton size="small" onClick={joinCommunity}>
                  <Start />
                </IconButton>
              </Tooltip>
              <Tooltip
                title={<Typography>Copy Join Key</Typography>}
                placement="right-start"
              >
                <IconButton size="small" onClick={copyJoinKey}>
                  <Key />
                </IconButton>
              </Tooltip>
              {props.is_admin ? (
                <Tooltip
                  title={<Typography>Admin</Typography>}
                  placement="right-start"
                >
                  <VerifiedUser
                    sx={{
                      marginLeft: "5px",
                      marginTop: "7px",
                      color: "#2c97e8",
                    }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="User" placement="right-start">
                  <Person
                    sx={{
                      marginLeft: "5px",
                      marginTop: "7px",
                      color: "#2c97e8",
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </Card>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default function CommunityHistory(props) {
  const [log, setLog] = useState(props.data.left_communities.reverse());
  return log.map(function (community, idx) {
    return (
      <CommunityHistoryEntry
        communityId={community.community_id}
        name={community.name}
        description={community.description}
        joinKey={community.join_key}
        is_admin={community.is_admin}
        time={community.time}
      />
    );
  });
}

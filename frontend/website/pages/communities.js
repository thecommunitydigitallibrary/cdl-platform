import "bootstrap/dist/css/bootstrap.min.css";
import * as React from "react";
import { useEffect, useState } from "react";

import jsCookie from "js-cookie";
import Header from "../components/header";
import Head from "next/head";
import Footer from "../components/footer";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Box, Button } from "@mui/material";

import CommunityHistory from "../components/communityhistory";
import CommunitiesDeck from "../components/communitiesdeck";
import { styled } from "@mui/system";
import TabsUnstyled from "@mui/base/TabsUnstyled";
import TabsListUnstyled from "@mui/base/TabsListUnstyled";
import TabPanelUnstyled from "@mui/base/TabPanelUnstyled";
import { buttonUnstyledClasses } from "@mui/base/ButtonUnstyled";
import TabUnstyled, { tabUnstyledClasses } from "@mui/base/TabUnstyled";

const baseURL_server = process.env.NEXT_PUBLIC_FROM_SERVER + "api/";
const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const getCommunitiesEndpoint = "getCommunities";
const getCommunityHistoryEndpoint = "communityHistory";
const joinCommunityEndpoint = "joinCommunity";

let gap = "25px";
const blue = {
  50: "#F0F7FF",
  100: "#C2E0FF",
  200: "#80BFFF",
  300: "#66B2FF",
  400: "#3399FF",
  500: "#007FFF",
  600: "#0072E5",
  700: "#0059B2",
  800: "#004C99",
  900: "#003A75",
};

const grey = {
  50: "#f6f8fa",
  100: "#eaeef2",
  200: "#d0d7de",
  300: "#afb8c1",
  400: "#8c959f",
  500: "#6e7781",
  600: "#57606a",
  700: "#424a53",
  800: "#32383f",
  900: "#24292f",
};

const Tab = styled(TabUnstyled)`
  font-family: IBM Plex Sans, sans-serif;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: transparent;
  ${"" /* width: 100%; */}
  padding: 10px 12px;
  margin: 6px 6px;
  border: none;
  border-radius: 7px;
  display: flex;
  justify-content: center;

  &:hover {
    background-color: ${blue[400]};
  }

  &:focus {
    color: #fff;
    outline: 3px solid ${blue[200]};
  }

  &.${tabUnstyledClasses.selected} {
    background-color: #fff;
    color: ${blue[600]};
  }

  &.${buttonUnstyledClasses.disabled} {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabPanel = styled(TabPanelUnstyled)(
  ({ theme }) => `
  width: 100%;
  padding: 20px 20px;
  background: ${theme.palette.mode === "dark" ? grey[900] : "#fff"};
  `
);

const TabsList = styled(TabsListUnstyled)(
  ({ theme }) => `
  width: 165px;
  background-color: ${'#1976d2'};
  border-radius: 12px;
  margin: 20px;
  display: flex;
  align-items: center;
  justify-content: start;
  align-content: space-between;

  `
);
/*   box-shadow: 0px 4px 30px ${
    theme.palette.mode === "dark" ? grey[900] : grey[200]
  };*/
function Communities({ data, history_data }, props) {
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

  if (data.error) {
    return (
      <>
        <Header dropdowndata={props.dropdowndata} />
        <div className="allResults">
          <Head>
            <title>Manage Communities - TextData</title>
            <link rel="icon" href="/images/tree32.png" />
          </Head>
          <h1>Manage Communities</h1>
          <p>{data.message}</p>
        </div>
      </>
    );
  } else {
    return (
      <div>
        <Head>
          <title>Manage Communities - TextData</title>
          <link rel="icon" href="/images/tree32.png" />
        </Head>
        <Box sx={{ width: "100%" }}>
          <div style={{ margin: "25px" }}>
            <p>
              Communities are a way for users to save, search, and share
              submissions with respect to a specific topic or group. For more
              information regarding communities and their relationship with
              submissions, please see the usage information on the{" "}
              <a href="/about">About</a> page.
            </p>

          </div>
          <TabsUnstyled defaultValue={0}>
            <TabsList>
              <Tab>Joined</Tab>
              <Tab>History</Tab>
            </TabsList>
            <TabPanel value={0}>
              {" "}
              {/* <Header /> */}
              <CommunitiesDeck community_info={data.community_info} />
            </TabPanel>
            <TabPanel value={1}>
              {/* <Header /> */}
              <CommunityHistory
                auth={jsCookie.get("token")}
                data={history_data}
              />
            </TabPanel>
          </TabsUnstyled>
          <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
            <Alert
              onClose={handleClose}
              severity={severity}
              sx={{ width: "100%" }}
            >
              {message}
            </Alert>
          </Snackbar>
        </Box>
        {/* <Footer alt={true} /> */}
      </div>
    );
  }
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
    var communityURL = baseURL_server + getCommunitiesEndpoint;
    const fetchCommunities = await fetch(communityURL, {
      headers: new Headers({
        Authorization: context.req.cookies.token,
      }),
    });

    var historyURL = baseURL_server + getCommunityHistoryEndpoint;
    const fetchHistory = await fetch(historyURL, {
      method: "GET",
      headers: new Headers({
        Authorization: context.req.cookies.token,
        "Content-Type": "application/json",
      }),
    });
    if (fetchCommunities.status == 200 && fetchHistory.status == 200) {
      // Pass data to the page via props
      const data = await fetchCommunities.json();
      const history_data = await fetchHistory.json();
      return { props: { data, history_data } };
    } else {
      const data = { error: "Something went wrong. Please try again later" };
      return { props: { data } };
    }
  }
}

export default Communities;

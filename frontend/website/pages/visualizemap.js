import dynamic from "next/dynamic";
import Router, { useRouter } from 'next/router';
import jsCookie from "js-cookie";
import { Alert, Snackbar, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/header";
import Footer from "../components/footer";

// Dynamic imports for visualizations
const VisualizeComponent = dynamic(() => import("../components/visualizecomponent"), {
  ssr: false,
});
const HomeConnections = dynamic(() => import("./homeconnections"), {
  ssr: false,
});

const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";

export default function VisualizeMap() {
  // Declaration
  const router = useRouter();
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [height, setHeight] = useState(900);
  const [maxWidth, setMaxWidth] = useState(800);
  const [width, setWidth] = useState(800);
  // Home Connection Viz
  const [submissions, setSubmissions] = useState();

  // Necessary States for Alert Message
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("error");

  //use Effect
  useEffect(() => {
    //  Set Canvas width and height
    let wd = window.innerWidth;
    let ht = window.innerHeight;
    setWidth(wd);
    setHeight(ht);
  }, []);

  useEffect(() => {
    let obj = router.query;
    let src = "";
    let q = "";
    let cid = "";
    let ownSub = "False";

    if (obj != undefined || obj != null || obj != "") {
      src = obj["source"];
      q = obj["query"];
      cid = obj["community"];
      ownSub = obj["own_submissions"];

      if (q == undefined || q == null)
        q = "";
      if (cid == undefined || cid == null)
        cid = "all";
      if (ownSub == undefined || cid == null)
        ownSub = "";
    }
    setSource(src);
    setQuery(q);
    setCommunityId(cid);
    ownSub = ownSub.trim();
    getUserSubmissions(q, cid, ownSub);
  }, [router.asPath]);

  // Functions
  const getUserSubmissions = async (query, communityId, ownSub) => {
    let url = baseURL_client + "search?query=" + query + "&community=" + communityId + "&source=visualizeConnections";
    if (ownSub == "True") {
      url += "&own_submissions=True";
    }
    const res = await fetch(url, {
      method: "GET",
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (response.status === "ok") {
      let graphData = {
        nodes: response['nodes'],
        edges: response['edges']
      }
      setSubmissions(graphData);
    } else {
      setSeverity("error");
      setMessage(response.message);
      handleClick();
    }
  }

  // For alerts
  const handleClick = () => {
    setOpen(true);
  };
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const openHierarchicalView = (e) => {
    let url = router.pathname;
    if (!!router.query["query"]) {
      url += "?query=" + router.query["query"] + "&community=all" + "&levelfilter=" + router.query["levelfilter"];
    }
    else {
      url += "?community=" + router.query["community"] + "&communityName=" + router.query["communityName"] + "&levelfilter=" + router.query["levelfilter"];
    }
    window.location = url;
  }

  return (
    <>
      {
        source == "visualizeConnections" ? (
          <>
            <Head>
              <title>Visualize - TextData</title>
              <link rel="icon" href="/images/tree32.png" />
            </Head>
            <div
              style={{ backgroundColor: "#e5e5e5", borderRadius: "10px", width: width, height: height, marginLeft: '20px' }}>
              {submissions && (
                <>
                  <Button variant="outlined"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      marginLeft: "10px"
                    }}
                    onClick={openHierarchicalView}
                  >
                    Open Detailed View
                  </Button>
                  <HomeConnections
                    nds={submissions['nodes']}
                    eds={submissions['edges']}
                  />
                </>
              )
              }
            </div>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
              <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
                {message}
              </Alert>
            </Snackbar>
          </>
        ) :
          (
            <VisualizeComponent />
          )
      }
    </>
  )
};
import dynamic from "next/dynamic";
import { useRouter } from 'next/router';
import jsCookie from "js-cookie";
import { Alert, Snackbar } from "@mui/material";
import React, { useEffect, useState } from "react";
import Head from "next/head";

// Dynamic imports for visualizations
const HomeConnections = dynamic(() => import("./homeconnections"), {
  ssr: false,
});

import { BASE_URL_CLIENT, WEBSITE_SEARCH_ENDPOINT} from "../static/constants";


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
    if (!router.isReady)
      return;
    // Router is ready, safe to use router.query or other router properties/methods
    setQueryParams();
  }, [router.isReady, router.asPath]);

  // Functions
  const setQueryParams = () => {
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
  }

  const getUserSubmissions = async (query, communityId, ownSub) => {
    let url = BASE_URL_CLIENT + WEBSITE_SEARCH_ENDPOINT + "?query=" + query + "&community=" + communityId + "&source=website_visualize";
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
        edges: response['edges'],
        options: response['options']
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


  return (
    <>
            <Head>
              <title>Visualize - TextData</title>
              <link rel="icon" href="/images/tree32.png" />
            </Head>
            <div
              style={{ backgroundColor: "#e5e5e5", borderRadius: "10px", width: width, height: height, marginLeft: '20px' }}>
              {submissions && (
                <>
                  <HomeConnections
                    nds={submissions['nodes']}
                    eds={submissions['edges']}
                    opt={submissions['options']}
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
  )
};
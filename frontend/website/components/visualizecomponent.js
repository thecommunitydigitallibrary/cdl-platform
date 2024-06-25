import React, { useState, useEffect, useRef, useCallback } from 'react';
import Router, { useRouter } from 'next/router';
import jsCookie from "js-cookie";
import {
    forceCollide as d3ForceCollide
} from "d3-force";
import ForceGraph2D from "react-force-graph-2d";
import InfiniteScroll from "react-infinite-scroll-component";
import Tooltip from '@mui/material/Tooltip';
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import SearchResult from "./searchresult";
import Head from "next/head";
import { Alert, Box, Button, FormControlLabel, FormGroup, FormHelperText, FormLabel, Snackbar } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FilterAltIcon from '@mui/icons-material/FilterAlt';


import { BASE_URL_CLIENT, WEBSITE_SEARCH_ENDPOINT } from "../static/constants";

const graphRoot2 = "Loading...";
const graphData2 = {
    "nodes": [
        {
            "id": "Loading...",
            "type": "root",
            "title": "Loading...",
            "path": "Loading...",
            "leaf": "Loading...",
            "module": "null",
            "parent": "",
            "sub_list": "null"
        },
    ],
    "links": []
};
const levelMap = {
    "communities": "Communities",
    "hashtags": "Hashtags",
    "topics": "Topics",
    "metadescs": "Meta-descriptors",
    "ownSubmissions": "Own Submissions"
};

const VisualizeMap = () => {
    const router = useRouter();
    let obj = router.query;
    let cid = "";
    let cn = "";
    let q = "";
    let filter = "";
    let arr = [];
    if (obj != undefined || obj != null || obj != "") {
        cid = obj["community"]
        cn = obj["communityName"]
        q = obj["query"]
        filter = obj["levelfilter"];
        arr = filter.split(';');
    }
    const [isClient, setIsClient] = useState(false);
    const [communityId, setCommunityId] = useState(cid);
    const [communityName, setCommunityName] = useState(cn);
    const [query, setQuery] = useState(q);
    const fgRef = useRef();
    const [height, setHeight] = useState(900);
    const [maxWidth, setMaxWidth] = useState(800);
    const [width, setWidth] = useState(800);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [prevNodeId, setPrevNodeId] = useState(undefined);
    const [graphData, setGraphData] = useState(graphData2);
    const [nodesById, setNodeById] = useState();
    const [rootId, setRootId] = useState(graphRoot2);
    const [submissions, setSubmissions] = useState({
        md_name: "",
        submission_list: [],
    });
    const [checkState, setCheckState] = useState({
        communities: false,
        hashtags: false,
        topics: false,
        metadescs: false,
        ownSubmissions: false
    });
    const { communities, hashtags, topics, metadescs, ownSubmissions } = checkState;
    const [filterOrder, setFilterOrder] = useState(arr);
    const [leafNode, setLeafNode] = useState(filterOrder[filterOrder.length - 1]);
    const error = [communities, hashtags, topics, metadescs, ownSubmissions].filter((v) => v).length < 1;
    const [levelView, setLevelView] = useState("")

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

    const updateCheckState = () => {
        let newState = {};
        Object.keys(checkState).forEach(key => {
            newState[key] = checkState[key];
        })
        for (let fil of filterOrder) {
            newState[fil] = true;
        }
        setCheckState(newState);
    };

    const updateLevelView = () => {
        let op = [];
        for (let itr of filterOrder) {
            op.push(levelMap[itr]);
        }
        setLevelView(op.join(" > "));
    };

    const getCommunityDocuments = async () => {
        let url;
        if (communityId == "all")
            url = BASE_URL_CLIENT + WEBSITE_SEARCH_ENDPOINT + "?query=" + encodeURIComponent(query) + "&community=all&source=website_visualize&levelfilter=" + filterOrder.join(";");
        else
            url = BASE_URL_CLIENT + WEBSITE_SEARCH_ENDPOINT + "?community=" + communityId + "&source=website_visualize&levelfilter=" + filterOrder.join(";");
        const res = await fetch(url, {
            method: "GET",
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        const response = await res.json();
        if (response.status === "ok") {
            if (communityId == "all")
                setRootId(query);
            else
                setRootId(communityName);
            setGraphData(response);
            createNodeByIdMap(response);
        } else {
            setSeverity("error");
            setMessage(response.message);
            handleClick();
            return;
        }
    }

    function createNodeByIdMap(data) {
        let nodesById = Object.fromEntries(
            data.nodes.map((node) => [node.id, node])
        );

        // link parent/children
        data.nodes.forEach((node) => {
            node.collapsed = node.id !== rootId;
            node.childLinks = [];
        });
        for (let link of data.links) {
            if (typeof link.source == "object") {
                link = link.source;
            }
            nodesById[link.source].childLinks.push(link);
        }
        setNodeById(nodesById);
    }

    useEffect(() => {
        setIsClient(true);
        if (jsCookie.get("token") != undefined) {
            setLeafNode(filterOrder[filterOrder.length - 1]);
            updateCheckState();
            getCommunityDocuments();
            setHeight(window.innerHeight);
            let canvasWidth = window.innerWidth; //- 0.01 * window.innerWidth
            setMaxWidth(canvasWidth);
            setWidth(canvasWidth);
            createNodeByIdMap(graphData);
        } else {
            Router.push({
                pathname: "/auth",
            });
        }
    }, []);

    useEffect(() => {
        updateLevelView();
    }, [checkState]);

    useEffect(() => {
        updateCheckState();
    }, [filterOrder]);

    const getPrunedTree = useCallback(() => {
        const visibleNodes = [];
        const visibleLinks = [];
        (function traverseTree(node = nodesById[rootId]) {
            visibleNodes.push(node);
            if (node.collapsed) return;
            visibleLinks.push(...node.childLinks);
            node.childLinks
                .map((link) =>
                    typeof link.target === "object" ? link.target : nodesById[link.target]
                )
                .forEach(traverseTree);
        })();

        return { nodes: visibleNodes, links: visibleLinks };
    }, [nodesById]);

    const ForceTree = ({ data }) => {
        const [controls] = useState({ "DAG Orientation": "td" });
        const [prunedTree, setPrunedTree] = useState();

        useEffect(() => {
            setPrunedTree(getPrunedTree());
            // add collision force
            fgRef.current.d3Force(
                "collision",
                d3ForceCollide((node) => Math.sqrt(node.x + node.y + 100))
            );
        }, [nodesById]);

        const colorNodeBackground = (node) => {
            switch (node.type) {
                case "root":
                    return "#E27429";
                case "hashtags":
                    return "#5F9EA0";
                case "topics":
                    return "#CC1D7C";
                case "metadescs":
                    return "#964B00";
                case "communities":
                    return "#1876d2"
                case "ownSubmissions":
                    return "grey"
                default:
                    return "red";
            }
        };

        const handleNodeClick = useCallback((node) => {
            if (node.type === leafNode) {
                if (prevNodeId == undefined) {
                    if (!isModalOpen) {
                        setIsModalOpen(true);
                        let arrow = document.getElementById("arrow");
                        arrow.innerText = '>';
                        let windowWidth =
                            document.getElementById("graph-wrapper").clientWidth;
                        setWidth(windowWidth / 2);
                    }
                    setPrevNodeId(node.id);
                    node.collapsed = !node.collapsed;
                    let x = {
                        md_name: node.id,
                        submission_list: node.sub_list,
                    };
                    setSubmissions(x);
                } else if (prevNodeId != node.id) {
                    if (!isModalOpen) {
                        setIsModalOpen(true);
                        let arrow = document.getElementById("arrow");
                        arrow.innerText = '>';
                        let windowWidth =
                            document.getElementById("graph-wrapper").clientWidth;
                        setWidth(windowWidth / 2);
                    }
                    setPrevNodeId(node.id);
                    node.collapsed = !node.collapsed;
                    let x = {
                        md_name: node.id,
                        submission_list: node.sub_list,
                    };
                    setSubmissions(x);
                } else {
                    if (isModalOpen) {
                        setIsModalOpen(false);
                        let arrow = document.getElementById("arrow");
                        arrow.innerText = '<';
                        let windowWidth =
                            document.getElementById("graph-wrapper").clientWidth;
                        setWidth(windowWidth * 2);
                    } else {
                        setIsModalOpen(true);
                        let arrow = document.getElementById("arrow");
                        arrow.innerText = '>';
                        let windowWidth =
                            document.getElementById("graph-wrapper").clientWidth;
                        setWidth(windowWidth / 2);
                    }
                }
            } else {
                node.collapsed = !node.collapsed;
                setPrunedTree(getPrunedTree());
            }
        }, []);

        return (
            <>
                <ForceGraph2D
                    ref={fgRef}
                    width={width}
                    height={height}
                    graphData={prunedTree}
                    // dagMode={controls["DAG Orientation"]}
                    dagLevelDistance={40}
                    backgroundColor={"#e5e5e5"}
                    linkColor={() => "darkgrey"}
                    nodeRelSize={4}
                    nodeId="path"
                    nodeVal={(node) => node.title.length}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.title;
                        const fontSize = 22 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(
                            (n) => n + fontSize * 0.2
                        ); // some padding
                        ctx.fillStyle = "#e5e5e5";
                        ctx.fillRect(
                            node.x - bckgDimensions[0] / 2,
                            node.y - bckgDimensions[1] / 2,
                            ...bckgDimensions
                        );
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = colorNodeBackground(node);
                        ctx.fillText(label, node.x, node.y);

                        node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                    }}
                    onNodeDragEnd={(node) => {
                        node.fx = node.x;
                        node.fy = node.y;
                        node.fz = node.z;
                    }}
                    onNodeClick={handleNodeClick}
                    nodeAutoColorBy="type"
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={2}
                    d3VelocityDecay={0.3}
                    cooldownTicks={10}
                    onEngineStop={() => fgRef.current.zoomToFit(10)}
                />
            </>
        );
    };

    const collapseModal = () => {
        if (isModalOpen) {
            let arrow = document.getElementById("arrow");
            arrow.innerText = '<';
            let windowWidth = document.getElementById("graph-wrapper").clientWidth;
            setWidth(windowWidth * 2);
            setIsModalOpen(false);
        } else {
            let arrow = document.getElementById("arrow");
            arrow.innerText = '>';
            let windowWidth = document.getElementById("graph-wrapper").clientWidth;
            setWidth(windowWidth / 2);
            setIsModalOpen(true);
        }
    };

    const handleCheckBoxChange = (e) => {
        if (!!e.target.checked) {
            setFilterOrder([...filterOrder, e.target.name]);
        }
        else {
            let l = [...filterOrder];
            setFilterOrder(l.filter(function (i) { return i !== e.target.name }));
        }

        //Update the state of the checkbox
        setCheckState({
            ...checkState,
            [e.target.name]: e.target.checked,
        });
    };

    const handleFilterOnClick = (e) => {
        if (!!error) {
            setSeverity("error");
            setMessage("Check at least one Checkbox!");
            handleClick();
            return;
        }
        let url = router.pathname;
        if (!!router.query["query"]) {
            url += "?query=" + router.query["query"] + "&community=all" + "&levelfilter=" + filterOrder.join(";");
        }
        else {
            url += "?community=" + router.query["community"] + "&communityName=" + router.query["communityName"] + "&levelfilter=" + filterOrder.join(";");
        }
        window.location = url;
    };

    return (
        <>
            <Head>
                <title>Visualize - TextData</title>
                <link rel="icon" href="/images/tree32.png" />
            </Head>
            {isClient ? (
                <div className="graph" id="graph-outer-div"
                    style={{ display: "flex", position: "relative", zIndex: "1" }}>
                    <Box id={"filter-div"}
                        style={{
                            marginTop: "70px",
                            marginLeft: "1%",
                            zIndex: "2",
                            position: "absolute",
                            top: "0",
                            display: "flex",
                            fontSize: "14px",
                            alignItems: "flex-start",
                            flexDirection: "column"
                        }}
                    >
                        <FormControl
                            required
                            error={error}
                            component="fieldset"
                            sx={{ m: 3 }}
                            variant="standard"
                        >
                            <FormLabel component="legend" style={{ fontSize: "15px" }}>
                                HIERARCHICAL VIEW: <span style={{ fontWeight: "bold" }}>{levelView}</span>
                            </FormLabel>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox style={{ transform: "scale(.8)" }} checked={communities} onChange={handleCheckBoxChange} name="communities" />
                                    }
                                    label={<span style={{ fontSize: "14px" }}>Communities</span>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox style={{ transform: "scale(.8)" }} checked={ownSubmissions} onChange={handleCheckBoxChange} name="ownSubmissions" />
                                    }
                                    label={<span style={{ fontSize: "14px" }}>Own Submissions</span>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox style={{ transform: "scale(.8)" }} checked={hashtags} onChange={handleCheckBoxChange} name="hashtags" />
                                    }
                                    label={<span style={{ fontSize: "14px" }}>Hashtags</span>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox style={{ transform: "scale(.75)" }} checked={topics} onChange={handleCheckBoxChange} name="topics" />
                                    }
                                    label={<span style={{ fontSize: "14px" }}>Topics</span>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox style={{ transform: "scale(.75)" }} checked={metadescs} onChange={handleCheckBoxChange} name="metadescs" />
                                    }
                                    label={<span style={{ fontSize: "14px" }}>Meta-descriptors</span>}
                                />
                            </FormGroup>
                            <FormHelperText>Please select at least one level to display</FormHelperText>
                        </FormControl>
                        <Button
                            variant={"contained"}
                            onClick={handleFilterOnClick}
                            size="medium"
                            endIcon={<FilterAltIcon />}
                            style={{ transform: "scale(0.75)" }}
                        >
                            Filter
                        </Button>
                    </Box>
                    <Paper elevation={0} id="graph-wrapper" style={{ width: "inherit" }}>
                        {nodesById && <ForceTree data={graphData} />}
                    </Paper>
                    <div style={{
                        marginLeft: '-1.5%',
                        position: "relative",
                        zIndex: "200",
                        display: "flex"
                    }}>
                        <button title={"Collapse Modal"}
                            style={{ display: "flex", flexDirection: "column", marginTop: "70px" }}
                            onClick={collapseModal}>
                            <div id={"arrow-container"}>
                                <Tooltip title="Expand/Collapse">
                                    <div id={"arrow"} style={{
                                        fontSize: "40",
                                        fontWeight: "bolder",
                                        // boxShadow: "rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px",
                                        padding: "10px",
                                        border: "solid 1px #fff",
                                        borderRadius: "5px 0px 0px 5px",
                                        marginLeft: "-10px",
                                        background: "#fff",
                                        color: "#1876d2"
                                    }}>&#60;</div>
                                </Tooltip>
                            </div>
                        </button>
                    </div>
                    {!!isModalOpen && (
                        <Paper elevation={0} id="view-data-modal" className={"allResults"} style={{
                            width: maxWidth - width,
                            // boxShadow: "rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px"
                        }}>
                            <Grid container display={"flex"} direction={"row"} justifyContent={"center"}
                                alignItems={"center"}>
                                <Grid item sx={{ textAlign: 'center', display: 'flex', marginTop: "2%", }}>
                                    {
                                        submissions["md_name"].length > 0 ?
                                            (
                                                <h5>{!!submissions["md_name"].split("/")[1] && submissions["md_name"].split("/")[1]}
                                                    {!!submissions["md_name"].split("/")[2] && " > " + submissions["md_name"].split("/")[2]}
                                                    {!!submissions["md_name"].split("/")[3] && " > " + submissions["md_name"].split("/")[3]}
                                                    {!!submissions["md_name"].split("/")[4] && " > " + submissions["md_name"].split("/")[4]}
                                                </h5>
                                            )
                                            :
                                            (<h5>Please select a Meta-descriptor of any topic to see related
                                                submissions</h5>)
                                    }
                                </Grid>
                                <Grid container display={"flex"}>
                                    <InfiniteScroll
                                        style={{ height: height }}
                                        dataLength={submissions["submission_list"].length}
                                        loader="">
                                        <Grid item style={{
                                            padding: "1%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "10px"
                                        }}>
                                            {submissions["submission_list"] !== undefined && submissions["submission_list"].length !== 0 &&
                                                submissions["submission_list"].map(function (d, idx) {
                                                    return (
                                                        <div key={idx}>
                                                            <SearchResult
                                                                paperWidth={"95%"}
                                                                paperMargin={"auto"}
                                                                paperMarginX={""}
                                                                search_idx={idx}
                                                                redirect_url={d.redirect_url}
                                                                display_url={d.display_url}
                                                                submission_id={d.submission_id}
                                                                result_hash={d.result_hash}
                                                                hashtags={d.hashtags}
                                                                description={d.description}
                                                                title={d.title}
                                                                time={d.time}
                                                                communities_part_of={d.communities_part_of}
                                                                auth_token={jsCookie.get("token")}
                                                            ></SearchResult>
                                                        </div>
                                                    );
                                                })}
                                        </Grid>
                                    </InfiniteScroll>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}
                </div>
            ) : (
                "Loading..."
            )}
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
                    {message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default VisualizeMap;
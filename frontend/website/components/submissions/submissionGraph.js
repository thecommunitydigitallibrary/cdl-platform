import jsCookie from "js-cookie";
import { Paper } from '@mui/material';
import dynamic from 'next/dynamic';
import { React, useRef, useCallback, useState, useEffect } from 'react'
import { BASE_URL_CLIENT, WEBSITE_URL } from '../../static/constants';
import SpriteText from "three-spritetext";
import ReactDOMServer from 'react-dom/server';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
    loading: () => <p>Loading...</p>, ssr: false
})

const Legend = () => {
    const legendStyle = {
        position: 'absolute',
        padding: '10px',
        zIndex: "100"
    };

    const legendItemStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '5px',
    };

    const colorBoxStyle = (backgroundColor) => ({
        width: '20px',
        height: '20px',
        marginRight: '10px',
        backgroundColor,
        borderRadius: "1000px"
    });

    return (
        <div style={legendStyle}>
            <div style={legendItemStyle}>
                <span style={colorBoxStyle("rgb(255, 204, 0, 0.7)")}></span>
                <span>Current Submission</span>
            </div>
            <div style={legendItemStyle}>
                <span style={colorBoxStyle("rgba(19, 41, 75, 0.7)")}></span>
                <span>User Submission</span>
            </div>
            <div style={legendItemStyle}>
                <span style={colorBoxStyle("rgba(232, 74, 39, 0.7)")}></span>
                <span>Scrapped Webpage</span>
            </div>
            <div style={legendItemStyle}>
                <span style={colorBoxStyle("rgba(125, 81, 175, 0.7)")}></span>
                <span>Visited Submission</span>
            </div>
            {/* Add more legend items here */}
        </div>
    );
};

export default function SubmissionGraph({ id, target }) {


    const [width, setWidth] = useState(900);
    const [height, setHeight] = useState(800);
    const [source, setSource] = useState("");
    const [graph, setGraph] = useState({ "nodes": [], "links": [] });
    const [graphSet, setGraphSet] = useState(new Set());
    const graphRef = useRef(graph);
    const sourceRef = useRef(source);
    const fgRef = useRef();

    const callGraphAPI = async (submission_id) => {
        const res = await fetch(BASE_URL_CLIENT + "graph/" + submission_id, {
            method: "GET",
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        return await res.json();
    }

    const getGraphData = async () => {
        setSource(id);
        const response = await callGraphAPI(id);
        if (response.status === "ok") {
            setGraph(response.data);
            for (let i = 0; i < response.data.nodes.length; ++i) {
                graphSet.add(response.data.nodes[i].id);
            }
            setGraphSet(graphSet);
        } else {
            console.log(response);
        }
        if (target != null) {
            handleNodeVisit({ id: target });
        }
    }

    const colorNodeBackground = (node) => {
        switch (node.type) {
            case "current": return "rgb(255, 204, 0, 0.7)";
            case "submission": return "rgba(19, 41, 75, 0.7)";
            case "webpage": return "rgba(232, 74, 39, 0.7)";
            case "visited": return "rgba(125, 81, 175, 0.7)";
            default: return "rgba(173, 59, 59, 0.7)";
        }
    }

    const handleNodeLabel = useCallback(
        (node) => {
            let desc = node.desc ? <p>{node.desc}</p> : null;
            let tooltip = <div style={{ background: "#fff", color: "#000000de", padding: "15px", border: "1px solid #0000001f", borderRadius: "5px" }}>
                <h6>{node.label}</h6>
                {desc}
            </div>;
            return ReactDOMServer.renderToString(tooltip, {});
        },
        []
    );

    const handleNodeVisit = useCallback((node) => {
        let newGraph = graphRef.current;
        for (let i = 0; i < newGraph.nodes.length; ++i) {
            if (newGraph.nodes[i].id === node.id) {
                newGraph.nodes[i]["type"] = "visited";
            }
        }
        setGraph(newGraph);
    }, [graph, setGraph]);

    const handleNodeClick = useCallback(
        async (node) => {
            // setLoading(true);
            const res = await fetch(BASE_URL_CLIENT + "submission/" + node.id, {
                method: "GET",
                headers: new Headers({
                    Authorization: jsCookie.get("token"),
                    "Content-Type": "application/json",
                }),
            });
            handleNodeVisit(node);
            const response = await res.json();
            if (response.status === "ok") {
                setSubmissionDataResponse(response);
            } else {
                console.log(response);
            }

            // Complete Loading and Change URL

            // setLoading(false);
            const nextURL = WEBSITE_URL + 'submissions/' + sourceRef.current + "?target=" + node.id;
            window.history.replaceState(null, "", nextURL);
        },
        [graph, setGraph]
    );

    const handleNodeClickV2 = useCallback(
        async (node) => {
            const url = `${WEBSITE_URL}/submissions/${node.id}`;
            // Open the URL in a new tab
            window.open(url, '_blank'); // 
        },
        [graph, setGraph]
    );


    useEffect(() => {
        sourceRef.current = source;
        graphRef.current = graph;
    }, [graph, source]);

    useEffect(() => {
        setHeight(window.innerHeight / 1.25)
        setWidth(window.innerWidth / 1.1)
        getGraphData();
    }, []);

    return (
        <>
            <Paper width='100%'>
                <Legend />
                <ForceGraph3D
                    width={width}
                    height={height}
                    ref={fgRef}
                    graphData={graph}
                    d3Force="link"
                    distance={300}
                    zoom={1}
                    backgroundColor={'#e5e5e5'}
                    onNodeClick={handleNodeClickV2}
                    nodeLabel={handleNodeLabel}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    linkCurvature={0.25}
                    nodeThreeObject={node => {
                        let label = node.label.length > 30 ? node.label.substring(0, 30) + '...' : node.label;
                        const sprite = new SpriteText(label);
                        sprite.backgroundColor = colorNodeBackground(node);
                        sprite.color = "#fff";
                        sprite.padding = [1.5, 1.5];
                        sprite.textHeight = 2;
                        sprite.fontWeight = 700;
                        sprite.fontSize = 90;
                        sprite.borderRadius = 4;
                        return sprite;
                    }}
                    linkThreeObjectExtend={true}
                    linkWidth={1}
                    linkThreeObject={(link) => {
                        const sprite = new SpriteText("RELATED");
                        sprite.fontWeight = 700;
                        sprite.color = 'rgba(0,0,0,0.7)';
                        sprite.textHeight = 3;
                        return sprite;
                    }}
                    linkPositionUpdate={(sprite, { start, end }) => {
                        const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
                            [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
                        })));

                        Object.assign(sprite.position, middlePos);
                    }}
                    linkColor={() => 'rgba(0,0,0,0.7)'}
                    linkDirectionalParticles={1}
                />
            </Paper>
        </>
    )
}
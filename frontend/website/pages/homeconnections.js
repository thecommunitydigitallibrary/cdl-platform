"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Graph from "react-graph-vis";
// For Pop up
import "vis-network/styles/vis-network.css";

export default function HomeConnections({nds, eds}) {
    const [graph, setGraph] = useState({nodes: nds, edges: eds});
    const [tNodes, setTNodes] = useState(nds);
    const [tEdges, setTEdges] = useState(eds);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setTNodes(nds);
      setGraph(eds);
      setGraph({nodes: nds, edges: eds});
    }, [nds, eds])

  // const graph = {
  //   nodes: [
  //     {
  //       id: "65f36384478f5c5e4cccd254",
  //       label: "Test mention",
  //       title: "Test mention",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/65f36384478f5c5e4cccd254",
  //     },
  //     {
  //       id: "65b3d20d183e4526aef235ee",
  //       label: "Test",
  //       title: "Test",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/65b3d20d183e4526aef235ee",
  //     },
  //     {
  //       id: "65b3cdbeb541724318caf724",
  //       label: "KMT Home",
  //       title: "KMT Home",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/65b3cdbeb541724318caf724",
  //     },
  //     {
  //       id: "65b0abe7a48ffb1203ec7c15",
  //       label: "Zoomcamp DE",
  //       title: "Zoomcamp DE",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/65b0abe7a48ffb1203ec7c15",
  //     },
  //     {
  //       id: "65b0ab86a48ffb1203ec7c10",
  //       label: "Leectode Home",
  //       title: "Leectode Home",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/65b0ab86a48ffb1203ec7c10",
  //     },
  //     {
  //       id: "65b0aadfa48ffb1203ec7c0b",
  //       label: "This webpage helped ...",
  //       title: "This webpage helped me understand BM25?",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/65b0aadfa48ffb1203ec7c0b",
  //     },
  //     {
  //       id: "65b0aadea48ffb1203ec7c0a",
  //       label: "Google Search",
  //       title: "Google Search",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/65b0aadea48ffb1203ec7c0a",
  //     },
  //     {
  //       id: "657cc833a6dcb4ad2e73b19f",
  //       label: "Springer paper on NL...",
  //       title: "Springer paper on NLP #NLP ",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/657cc833a6dcb4ad2e73b19f",
  //     },
  //     {
  //       id: "6559f60b4c4c29ef9ceacd48",
  //       label: "Test #NLP #Lecture1",
  //       title: "Test #NLP #Lecture1",
  //       shape: "dot",
  //       color: "#1876d2",
  //       value: 8,
  //       url: "http://localhost:8080/submissions/6559f60b4c4c29ef9ceacd48",
  //     },
  //   ],
  //   edges: [
  //     {
  //       from: "65b3cdbeb541724318caf724",
  //       to: "65b0abe7a48ffb1203ec7c15",
  //     },
  //     {
  //       from: "65b0abe7a48ffb1203ec7c15",
  //       to: "65b0ab86a48ffb1203ec7c10",
  //     },
  //   ],
  // };

  const options = {
    physics: {
      barnesHut: {
        gravitationalConstant: -9000,
        centralGravity: 1.5,
        avoidOverlap: 1,
      },
      minVelocity: 1,
      maxVelocity: 40,
    },
    interaction: {
      hover: true,
    },
    layout: {
      hierarchical: false,
    },
    nodes: {
      shape: "dot",
      scaling: {
        customScalingFunction: function (min, max, total, value) {
          return 0.4;
        },
        min: 1,
        max: 14,
        label: {
          enabled: false,
          min: 10,
          max: 20,
          maxVisible: 26,
          //   min: 0,
          //   max: 0,
          //   maxVisible: 0,
          drawThreshold: 8,
        },
      },
    },
    edges: {
      //   color: "#000000",
      width: 1,
      hoverWidth: function (width) {
        return width + 2;
      },
    },
  };

  const events = {
    selectNode: function (event) {
      let { nodes, edges } = event;
      let selectedNode = tNodes.filter((n) => n.id == nodes[0]);
      console.log("nodes:", nodes);
      console.log("tNodes:", tNodes)
      window.open(selectedNode[0].url, "_blank");
    },
  };

  return (
    <>
      <Graph
        graph={graph}
        options={options}
        events={events}
        getNetwork={(network) => {
          //  if you want access to vis.js network api you can set the state in a parent component using this property
          //   network.on("showPopup", function (params) {
          //     alert("pop up");
          //     console.log(params);
          //   });
          // Fit all nodes in canvas
          network.fit();
          // To scale the nodes
          network.once("stabilized", function () {
            let scaleOption = { scale: 1 };
            network.moveTo(scaleOption);
          });
        }}
      />
    </>
  );
}

"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Graph from "react-graph-vis";
// For Pop up
import "vis-network/styles/vis-network.css";

export default function HomeConnections({ nds, eds }) {
  const [graph, setGraph] = useState({ nodes: nds, edges: eds });
  const [tNodes, setTNodes] = useState(nds);
  const [tEdges, setTEdges] = useState(eds);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setTNodes(nds);
    setGraph(eds);
    setGraph({ nodes: nds, edges: eds });
  }, [nds, eds])

  const options = {
    autoResize: true,
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
          drawThreshold: 8,
        },
      },
    },
    edges: {
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
    <div className="border 1px h-full " >
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
    </div>
  );
}

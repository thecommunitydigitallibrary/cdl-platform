"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Graph from "react-graph-vis";
// For Pop up
import "vis-network/styles/vis-network.css";

export default function HomeConnections({ nds, eds, opt}) {
  const [graph, setGraph] = useState({ nodes: nds, edges: eds });
  const [options, setOptions] = useState()
  const [tNodes, setTNodes] = useState(nds);
  const [tEdges, setTEdges] = useState(eds);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setTNodes(nds);
    setGraph(eds);
    setGraph({ nodes: nds, edges: eds });
    setOptions(opt)
  }, [nds, eds])

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
          network.fit();
          network.once("stabilized", function () {
            let scaleOption = { scale: 1 };
            network.moveTo(scaleOption);
          });
        }}
      />
    </div>
  );
}

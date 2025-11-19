import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

// --------------------------------------
// 1️⃣ Your input data (replace with your JSON)
// --------------------------------------
const sampleData = {
  nodes: [
    {
      id: "883ee45d-5033-4c82-b488-1db9c79c83ca",
      data: { label: "M456HI" },
      type: "default",
    },
    {
      id: "853925f3-f6d0-4cab-99f1-a3d39308c3ee",
      data: { label: "DECLARATIVES" },
      type: "default",
    },
    {
      id: "079e7f1d-a4dd-4764-8dcb-564d07d0c442",
      data: { label: "A05-CONTROL" },
      type: "default",
    },
  ],
  edges: [
    {
      id: "e1",
      source: "883ee45d-5033-4c82-b488-1db9c79c83ca",
      target: "853925f3-f6d0-4cab-99f1-a3d39308c3ee",
      animated: true,
      type: "smoothstep",
    },
    {
      id: "e2",
      source: "853925f3-f6d0-4cab-99f1-a3d39308c3ee",
      target: "079e7f1d-a4dd-4764-8dcb-564d07d0c442",
      animated: true,
      type: "smoothstep",
    },
  ],
};

// --------------------------------------
// 2️⃣ Auto layout using Dagre (horizontal)
// --------------------------------------
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 200;
const nodeHeight = 60;

const getLayoutedElements = (nodes, edges, direction = "LR") => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = {
      x: pos.x - nodeWidth / 2,
      y: pos.y - nodeHeight / 2,
    };
    node.style = {
      borderRadius: "12px",
      padding: "10px",
      background: "#1e293b",
      color: "white",
      border: "2px solid #64748b",
      fontWeight: "bold",
    };
  });

  return { nodes, edges };
};

// --------------------------------------
// 3️⃣ Main Component
// --------------------------------------
export default function GraphVisualization() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const { nodes, edges } = getLayoutedElements(
      sampleData.nodes,
      sampleData.edges,
      "LR"
    );
    setNodes(nodes);
    setEdges(edges);
  }, []);

  // Highlight nodes on search
  const highlightNodes = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const isMatch =
          search.length > 0 &&
          n.data.label.toLowerCase().includes(search.toLowerCase());
        return {
          ...n,
          style: {
            ...n.style,
            border: isMatch ? "3px solid yellow" : "2px solid #64748b",
            transform: isMatch ? "scale(1.15)" : "scale(1)",
          },
        };
      })
    );
  }, [search]);

  useEffect(() => {
    highlightNodes();
  }, [search, highlightNodes]);

  return (
    <div className="w-screen h-screen bg-slate-900">
      {/* Search */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/40"
        />
      </div>

      {/* Graph */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        style={{ background: "#0f172a" }}
      >
        <Background color="#475569" gap={16} />
        <Controls />
        <MiniMap nodeColor="#334155" />
      </ReactFlow>
    </div>
  );
}

 import React, { useState, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "react-flow-renderer";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Drawer, TextField, Button, Box } from "@mui/material";

const initialNodes = [];
const initialEdges = [];

const nodeTypes = [
  { id: "1", label: "Start", type: "input" },
  { id: "2", label: "Task", type: "default" },
  { id: "3", label: "Decision", type: "default" },
  { id: "4", label: "End", type: "output" },
];

function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editableLabel, setEditableLabel] = useState("");
  const [isDirty, setIsDirty] = useState(false); // Track if there are unsaved changes

  // Save the workflow to local storage
  const saveWorkflow = () => {
    localStorage.setItem("workflow", JSON.stringify({ nodes, edges }));
    setIsDirty(false); // Reset the dirty flag once saved
  };

  // Load the workflow from local storage
  const loadWorkflow = () => {
    const savedWorkflow = localStorage.getItem("workflow");
    if (savedWorkflow) {
      const { nodes, edges } = JSON.parse(savedWorkflow);
      setNodes(nodes);
      setEdges(edges);
    }
  };

  // Handle navigation away
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        event.returnValue = message; // Standard for most browsers
        return message; // For some browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

  const handleNodeClick = (_, node) => {
    setSelectedNode(node);
    setEditableLabel(node.data.label);
    setDrawerOpen(true);
  };

  const updateNodeData = (key, value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, [key]: value } }
          : node
      )
    );
    setIsDirty(true); // Mark as unsaved when any change is made
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData("application/reactflow");

    const newNode = {
        id: `${new Date().getTime()}`, // Fixed this line for id generation
      type: nodeType,
      data: { label: nodeType },
      position: { x: event.clientX - 100, y: event.clientY - 50 },
    };
    setNodes((nds) => nds.concat(newNode));
    setIsDirty(true); // Mark as unsaved
  };

  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setIsDirty(true);
    localStorage.removeItem("workflow");
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setIsDirty(true); // Mark as unsaved
  };

  const handleSaveLabel = () => {
    updateNodeData("label", editableLabel);
    setDrawerOpen(false);
    saveWorkflow(); // Save the workflow when label is updated
  };

  // Load the workflow when the component mounts
  useEffect(() => {
    loadWorkflow();
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ddd",
          padding: "16px",
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <h4>Node Types</h4>
        {nodeTypes.map((node) => (
          <div
            key={node.id}
            onDragStart={(event) => handleDragStart(event, node.label)}
            draggable
            style={{
              margin: "8px 0",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              textAlign: "center",
              cursor: "grab",
            }}
          >
            {node.label}
          </div>
        ))}
        <Button
          onClick={clearCanvas}
          variant="contained"
          color="secondary"
          style={{ marginTop: "16px" }}
        >
          Clear Canvas
        </Button>
        <Button
          onClick={saveWorkflow}
          variant="contained"
          color="primary"
          style={{ marginTop: "16px" }}
        >
          Save Workflow
        </Button>
      </div>

      <ReactFlowProvider>
        <div
          style={{ flex: 2, border: "1px solid #ddd", position: "relative" }}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedNode && (
            <div style={{ padding: "16px", width: "300px" }}>
              <h3>Edit Node</h3>
              <TextField
                label="Label"
                value={editableLabel}
                onChange={(e) => setEditableLabel(e.target.value)}
                fullWidth
              />
              <TextField
                label="Execution Time"
                type="number"
                value={selectedNode.data.executionTime || ""}
                onChange={(e) =>
                  updateNodeData("executionTime", e.target.value)
                }
                fullWidth
                style={{ marginTop: "16px" }}
              />
              <Button
                onClick={() => {
                  deleteNode(selectedNode.id);
                  setDrawerOpen(false);
                }}
                style={{ marginTop: "16px" }}
                variant="contained"
                color="error"
              >
                Delete Node
              </Button>
              <Button
                onClick={handleSaveLabel}
                style={{ marginTop: "16px" }}
                variant="contained"
              >
                Save
              </Button>
            </div>
          )}
        </Drawer>
      </ReactFlowProvider>

      <div style={{ flex: 1, padding: "16px", borderLeft: "1px solid #ddd" }}>
        <h3>Analytics</h3>

        <BarChart
          width={300}
          height={200}
          data={nodes.map((node) => ({
            name: node.data.label,
            time: node.data.executionTime || 0,
          }))}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="time" fill="#8884d8" />
        </BarChart>

        <LineChart
          width={300}
          height={200}
          data={nodes.map((node, index) => ({
            name: node.data.label,
            cumulative:
              index === 0
                ? 0
                : (nodes[index - 1]?.data.executionTime || 0) +
                  (node.data.executionTime || 0),
          }))}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cumulative" stroke="#82ca9d" />
        </LineChart>

        <PieChart width={300} height={200}>
          <Pie
            data={nodes.map((node) => ({
              name: node.data.label,
              value: node.data.executionTime || 0,
            }))}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
          />
        </PieChart>
      </div>
    </div>
  );
}

export default WorkflowBuilder;
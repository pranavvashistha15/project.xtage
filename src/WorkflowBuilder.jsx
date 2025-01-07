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

import { Drawer, TextField, Button, Box, Input, Typography, Tooltip as MuiTooltip } from "@mui/material";
import Analytics from "./components/Analytics";

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



  const [history, setHistory] = useState({ past: [], present: { nodes, edges }, future: [] });

  const saveWorkflow = () => {
    localStorage.setItem("workflow", JSON.stringify({ nodes, edges }));
   
  };

  const loadWorkflow = () => {
    const savedWorkflow = localStorage.getItem("workflow");
    if (savedWorkflow) {
      const { nodes, edges } = JSON.parse(savedWorkflow);
      setNodes(nodes);
      setEdges(edges);
    }
  };

  const onConnect = (params) => {
    setEdges((eds) => addEdge(params, eds));
    
    addToHistory();
  };

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
    
    addToHistory();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData("application/reactflow");

    const newNode = {
      id: `${new Date().getTime()}`,
      type: nodeType,
      data: { label: nodeType },
      position: { x: event.clientX - 100, y: event.clientY - 50 },
    };
    setNodes((nds) => nds.concat(newNode));
    
    addToHistory();
  };

  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    
    localStorage.removeItem("workflow");
    addToHistory();
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
   
    addToHistory();
  };

  const handleSaveLabel = () => {
    updateNodeData("label", editableLabel);
    setDrawerOpen(false);
    saveWorkflow(); 
  };

  const addToHistory = () => {
    const { past, present, future } = history;
    setHistory({
      past: [...past, present],  
      present: { nodes, edges }, 
      future: [],  
    });
  };

  const undo = () => {
    const { past, present } = history;
    if (past.length > 0) {
      const previousState = past[past.length - 1];
      setHistory({
        past: past.slice(0, past.length - 1), 
        present: previousState, 
        future: [present, ...history.future], 
      });
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
    }
  };

  const redo = () => {
    const { future, present } = history;
    if (future.length > 0) {
      const nextState = future[0];
      setHistory({
        past: [...history.past, present], 
        present: nextState, 
        future: future.slice(1), 
      });
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const importedWorkflow = JSON.parse(reader.result);
        setNodes(importedWorkflow.nodes || []);
        setEdges(importedWorkflow.edges || []);
        
      };
      reader.readAsText(file);
    }
  };

  const exportWorkflow = () => {
    if (nodes.length === 0 || edges.length === 0) {
      alert("Cannot export an empty workflow.");
      return;
    }
    const workflow = { nodes, edges };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "workflow.json";
    link.click();
  };

  return (
    <div style={{ display: "flex", height: "100vh", padding: "16px" }}>
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ddd",
          padding: "16px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <Typography variant="h6" gutterBottom>Node Types</Typography>
        {nodeTypes.map((node) => (
          <MuiTooltip title={`Drag to add ${node.label} node`} key={node.id}>
            <div
              onDragStart={(event) => handleDragStart(event, node.label)}
              draggable
              style={{
                margin: "8px 0",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                textAlign: "center",
                cursor: "grab",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              {node.label}
            </div>
          </MuiTooltip>
        ))}
        <Box mt={2}>
          <Button
            onClick={clearCanvas}
            variant="contained"
            color="secondary"
            fullWidth
            style={{ marginBottom: "8px" }}
          >
            Clear Canvas
          </Button>
          <Button
            onClick={saveWorkflow}
            variant="contained"
            color="primary"
            fullWidth
            style={{ marginBottom: "8px" }}
          >
            Save Workflow
          </Button>
          <Button
            onClick={exportWorkflow}
            variant="contained"
            color="success"
            fullWidth
            style={{ marginBottom: "8px" }}
          >
            Export Workflow
          </Button>
          <Input
            type="file"
            onChange={handleFileChange}
            fullWidth
            style={{ marginTop: "8px" }}
            inputProps={{
              accept: ".json",
            }}
          />
          <Button
            onClick={undo}
            variant="outlined"
            fullWidth
            style={{ marginTop: "8px" }}
          >
            Undo
          </Button>
          <Button
            onClick={redo}
            variant="outlined"
            fullWidth
            style={{ marginTop: "8px" }}
          >
            Redo
          </Button>
        </Box>
      </div>

      <ReactFlowProvider>
        <div
          style={{
            flex: 2,
            border: "1px solid #ddd",
            position: "relative",
            borderRadius: "8px",
            backgroundColor: "#fff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
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
          sx={{ width: 350 }}
        >
          {selectedNode && (
            <div style={{ padding: "16px", width: "300px" }}>
              <Typography variant="h6" gutterBottom>Edit Node</Typography>
              <TextField
                label="Label"
                value={editableLabel}
                onChange={(e) => setEditableLabel(e.target.value)}
                fullWidth
                style={{ marginBottom: "16px" }}
              />
              <TextField
                label="Execution Time"
                type="number"
                value={selectedNode.data.executionTime || ""}
                onChange={(e) =>
                  updateNodeData("executionTime", e.target.value)
                }
                fullWidth
                style={{ marginBottom: "16px" }}
              />
              <Button
                onClick={() => {
                  deleteNode(selectedNode.id);
                  setDrawerOpen(false);
                }}
                variant="contained"
                color="error"
                fullWidth
                style={{ marginBottom: "16px" }}
              >
                Delete Node
              </Button>
              <Button
                onClick={handleSaveLabel}
                variant="contained"
                fullWidth
              >
                Save
              </Button>
            </div>
          )}
        </Drawer>
      </ReactFlowProvider>

      <Analytics nodes={nodes} />
    </div>
  );
}

export default WorkflowBuilder;
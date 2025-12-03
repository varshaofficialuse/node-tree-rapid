import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Layers,
  ChevronRight,
  Home,
  Undo,
} from "lucide-react";
import rawData from "./data/ a.json";

const FlowDiagramNew = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [zoom, setZoom] = useState(100);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [activeNode, setActiveNode] = useState(null);
  const [showAllGraph, setShowAllGraph] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const containerRef = useRef(null);
  const [hiddenNodes, setHiddenNodes] = useState(new Set());
  const [selectedToHide, setSelectedToHide] = useState(new Set());
  const [showSelectedMode, setShowSelectedMode] = useState(false);

  // History state for undo functionality - using refs for immediate updates
  const historyRef = useRef([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const isRestoringRef = useRef(false);
  const hasInitializedHistoryRef = useRef(false);

  // Use sample data - replace with: import rawData from './data/a.json'
  const graphData = rawData.react_flow_for_layers_map || rawData;

  const buildGraph = () => {
    const nodeMap = {};
    const childrenMap = {};
    const parentMap = {};

    graphData.nodes.forEach((node) => {
      nodeMap[node.id] = node;
      childrenMap[node.id] = [];
      parentMap[node.id] = null;
    });

    graphData.edges.forEach((edge) => {
      if (childrenMap[edge.source]) {
        childrenMap[edge.source].push(edge.target);
      }
      if (parentMap[edge.target] === null) {
        parentMap[edge.target] = edge.source;
      }
    });

    return { nodeMap, childrenMap, parentMap };
  };

  const { nodeMap, childrenMap, parentMap } = buildGraph();

  const findRootNode = () => {
    return graphData.nodes.find((node) => !parentMap[node.id]);
  };

  const rootNode = findRootNode();

  // Ensure root node is expanded initially
  useEffect(() => {
    if (rootNode && expandedNodes.size === 0 && !showAllGraph) {
      setExpandedNodes(new Set([rootNode.id]));
    }
  }, [rootNode, expandedNodes.size, showAllGraph]);

  // 🔥 Centralized history management
  useEffect(() => {
    if (!rootNode) return;

    // Snapshot of the *current* state (after changes)
    const snapshot = {
      expandedNodes: Array.from(expandedNodes),
      activeNode,
      currentPath: [...currentPath],
      hiddenNodes: Array.from(hiddenNodes),
      selectedToHide: Array.from(selectedToHide),
      showSelectedMode,
      zoom,
      searchTerm,
      showAllGraph,
    };

    // First time: initialize history with initial state
    if (!hasInitializedHistoryRef.current) {
      historyRef.current = [snapshot];
      setCurrentHistoryIndex(0);
      hasInitializedHistoryRef.current = true;
      return;
    }

    // If we are restoring from history (undo), don't create a new history entry
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    // Normal path: user changed something -> push new snapshot
    historyRef.current = historyRef.current.slice(0, currentHistoryIndex + 1);
    historyRef.current.push(snapshot);

    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      // Keep the index aligned with the shifted history
      setCurrentHistoryIndex((prev) => Math.max(prev - 1, 0));
    } else {
      setCurrentHistoryIndex(historyRef.current.length - 1);
    }
    // We intentionally do NOT include currentHistoryIndex in deps to avoid double pushes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expandedNodes,
    activeNode,
    currentPath,
    hiddenNodes,
    selectedToHide,
    showSelectedMode,
    zoom,
    searchTerm,
    showAllGraph,
    rootNode,
  ]);

  // ✅ Undo to previous state (exactly one step)
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex <= 0) return;

    const newIndex = currentHistoryIndex - 1;
    const previousState = historyRef.current[newIndex];

    if (previousState) {
      isRestoringRef.current = true;

      setExpandedNodes(new Set(previousState.expandedNodes || []));
      setActiveNode(
        previousState.activeNode !== undefined ? previousState.activeNode : null
      );
      setCurrentPath(previousState.currentPath || []);
      setHiddenNodes(new Set(previousState.hiddenNodes || []));
      setSelectedToHide(new Set(previousState.selectedToHide || []));
      setShowSelectedMode(!!previousState.showSelectedMode);
      setZoom(previousState.zoom ?? 100);
      setSearchTerm(previousState.searchTerm ?? "");
      setShowAllGraph(!!previousState.showAllGraph);

      setCurrentHistoryIndex(newIndex);
    }
  }, [currentHistoryIndex]);

  // Keyboard shortcut for undo (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // CTRL/CMD + Z  => Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // CTRL/CMD + SHIFT + Z => Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  const getPathToNode = (nodeId) => {
    const path = [];
    let current = nodeId;
    while (current) {
      path.unshift(current);
      current = parentMap[current];
    }
    return path;
  };

  const getNLayersOfChildren = (startNodeId, layers) => {
    const visited = new Set();
    const queue = [{ id: startNodeId, depth: 0 }];
    const result = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id) || depth > layers) continue;
      visited.add(id);
      result.push(id);

      if (depth < layers) {
        const children = childrenMap[id] || [];
        children.forEach((childId) => {
          queue.push({ id: childId, depth: depth + 1 });
        });
      }
    }
    return result;
  };

  const getAllDescendants = (nodeId) => {
    const descendants = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift();
      const children = childrenMap[current] || [];
      children.forEach((child) => {
        if (!descendants.has(child)) {
          descendants.add(child);
          queue.push(child);
        }
      });
    }
    return descendants;
  };

  const hasExpandedDescendants = (nodeId) => {
    const children = childrenMap[nodeId] || [];
    return children.some((childId) => expandedNodes.has(childId));
  };

  const layerHasExpandedChildren = (layerNodes) => {
    return layerNodes.some((nodeId) => hasExpandedDescendants(nodeId));
  };
  const handleRedo = useCallback(() => {
    if (currentHistoryIndex >= historyRef.current.length - 1) return;

    const newIndex = currentHistoryIndex + 1;
    const nextState = historyRef.current[newIndex];

    if (nextState) {
      isRestoringRef.current = true;

      setExpandedNodes(new Set(nextState.expandedNodes || []));
      setActiveNode(
        nextState.activeNode !== undefined ? nextState.activeNode : null
      );
      setCurrentPath(nextState.currentPath || []);
      setHiddenNodes(new Set(nextState.hiddenNodes || []));
      setSelectedToHide(new Set(nextState.selectedToHide || []));
      setShowSelectedMode(!!nextState.showSelectedMode);
      setZoom(nextState.zoom ?? 100);
      setSearchTerm(nextState.searchTerm ?? "");
      setShowAllGraph(!!nextState.showAllGraph);

      setCurrentHistoryIndex(newIndex);
    }
  }, [currentHistoryIndex]);

  const handleHideSelected = () => {
    setHiddenNodes((prev) => {
      const next = new Set(prev);
      selectedToHide.forEach((nodeId) => {
        next.add(nodeId);
        getAllDescendants(nodeId).forEach((child) => next.add(child));
      });
      return next;
    });
    setSelectedToHide(new Set());
  };

  const handleShowSelected = () => {
    if (selectedToHide.size === 0) return;

    const nodesToKeep = new Set(selectedToHide);

    selectedToHide.forEach((nodeId) => {
      const path = getPathToNode(nodeId);
      path.forEach((id) => nodesToKeep.add(id));
    });

    selectedToHide.forEach((nodeId) => {
      const descendants = getAllDescendants(nodeId);
      descendants.forEach((id) => nodesToKeep.add(id));
    });

    selectedToHide.forEach((nodeId) => {
      graphData.edges.forEach((edge) => {
        if (edge.source === nodeId) {
          nodesToKeep.add(edge.target);
          const targetPath = getPathToNode(edge.target);
          targetPath.forEach((id) => nodesToKeep.add(id));
        }
        if (edge.target === nodeId) {
          nodesToKeep.add(edge.source);
          const sourcePath = getPathToNode(edge.source);
          sourcePath.forEach((id) => nodesToKeep.add(id));
        }
      });
    });

    const allNodeIds = new Set(graphData.nodes.map((n) => n.id));
    const nodesToHide = new Set();

    allNodeIds.forEach((nodeId) => {
      if (!nodesToKeep.has(nodeId)) {
        nodesToHide.add(nodeId);
      }
    });

    setHiddenNodes(nodesToHide);
    setShowSelectedMode(true);
    setSelectedToHide(new Set());
  };

  const handleNodeRightClick = (e, nodeId) => {
    e.preventDefault();
    setSelectedToHide((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const toggleSelectNode = (nodeId) => {
    setSelectedToHide((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const handleNodeClick = (nodeId) => {
    if (hasExpandedDescendants(nodeId)) {
      const newExpanded = new Set(expandedNodes);
      const descendants = getAllDescendants(nodeId);
      descendants.forEach((id) => newExpanded.delete(id));
      setExpandedNodes(newExpanded);
      setActiveNode(nodeId);
      setCurrentPath(getPathToNode(nodeId));
    } else {
      const newExpanded = new Set(expandedNodes);
      const toAdd = getNLayersOfChildren(nodeId, 3);
      toAdd.forEach((id) => newExpanded.add(id));
      setExpandedNodes(newExpanded);
      setActiveNode(nodeId);
      setCurrentPath(getPathToNode(nodeId));
    }
  };

  const addMoreLayers = () => {
    if (!activeNode) return;

    const newExpanded = new Set(expandedNodes);
    const visibleDescendants = [];
    const queue = [activeNode];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      if (expandedNodes.has(current)) {
        visibleDescendants.push(current);
        const children = childrenMap[current] || [];
        children.forEach((child) => queue.push(child));
      }
    }

    visibleDescendants.forEach((nodeId) => {
      const children = childrenMap[nodeId] || [];
      const hasVisibleChildren = children.some((child) =>
        expandedNodes.has(child)
      );

      if (!hasVisibleChildren && children.length > 0) {
        const toAdd = getNLayersOfChildren(nodeId, 3);
        toAdd.forEach((id) => newExpanded.add(id));
      }
    });

    setExpandedNodes(newExpanded);
  };

  const toggleShowAll = () => {
    setHiddenNodes(new Set());
    setSelectedToHide(new Set());
    setShowSelectedMode(false);

    if (showAllGraph) {
      setExpandedNodes(new Set([rootNode.id]));
      setActiveNode(null);
      setCurrentPath([]);
    } else {
      const allNodes = new Set(graphData.nodes.map((n) => n.id));
      setExpandedNodes(allNodes);
      setActiveNode(rootNode?.id);
      setCurrentPath([rootNode?.id]);
    }
    setShowAllGraph(!showAllGraph);
  };

  const handleSearch = (term) => {
    const search = term.toLowerCase().trim();
    setSearchTerm(term);

    if (!search) {
      setExpandedNodes(new Set([rootNode.id]));
      setActiveNode(null);
      setCurrentPath([]);
      return;
    }

    const matchedNode = graphData.nodes.find((n) =>
      (n.data?.label || "").toLowerCase().includes(search)
    );

    if (matchedNode) {
      const path = getPathToNode(matchedNode.id);
      const newExpanded = new Set(path);
      setExpandedNodes(newExpanded);
      setActiveNode(matchedNode.id);
      setCurrentPath(path);
    }
  };

  const handleReset = () => {
    setHiddenNodes(new Set());
    setSelectedToHide(new Set());
    setShowSelectedMode(false);
    setExpandedNodes(new Set([rootNode.id]));
    setActiveNode(null);
    setCurrentPath([]);
    setSearchTerm("");
    setShowAllGraph(false);
    setZoom(100);
  };

  const visibleNodeIds = Array.from(expandedNodes).filter(
    (id) => !hiddenNodes.has(id)
  );
  const visibleNodes = visibleNodeIds.map((id) => nodeMap[id]).filter(Boolean);

  const calculateLayerPositions = () => {
    const layers = {};
    visibleNodeIds.forEach((nodeId) => {
      const path = getPathToNode(nodeId);
      const layer = path.length - 1;
      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(nodeId);
    });
    return layers;
  };

  const nodesByLayer = calculateLayerPositions();

  const nodeHeight = 70;
  const nodeWidth = 140;
  const collapsedNodeWidth = 30;
  const nodeSpacing = 25;
  const expandedLayerWidth = 280;
  const collapsedLayerWidth = 80;

  const activeExpansionNodes = new Set();
  if (activeNode) {
    const expansionNodes = getNLayersOfChildren(activeNode, 3);
    expansionNodes.forEach((id) => activeExpansionNodes.add(id));
    const path = getPathToNode(activeNode);
    path.forEach((id) => activeExpansionNodes.add(id));
  }

  const collapsedLayers = new Set();

  Object.entries(nodesByLayer).forEach(([layer, nodeIds]) => {
    const layerNum = parseInt(layer);
    const isLayerHovered = nodeIds.some((nodeId) => hoveredNode === nodeId);
    if (!isLayerHovered) {
      collapsedLayers.add(layerNum);
    }
  });

  const layerXPositions = {};
  let cumulativeX = 50;
  const sortedLayers = Object.keys(nodesByLayer)
    .map(Number)
    .sort((a, b) => a - b);

  sortedLayers.forEach((layerNum) => {
    layerXPositions[layerNum] = cumulativeX;
    const isCollapsed = collapsedLayers.has(layerNum);
    cumulativeX += isCollapsed ? collapsedLayerWidth : expandedLayerWidth;
  });

  const nodePositions = {};
  Object.entries(nodesByLayer).forEach(([layer, nodeIds]) => {
    const layerNum = parseInt(layer);
    nodeIds.forEach((nodeId, index) => {
      nodePositions[nodeId] = {
        x: layerXPositions[layerNum],
        y: index * (nodeHeight + nodeSpacing) + 50,
      };
    });
  });

  const visibleEdges = graphData.edges.filter(
    (edge) =>
      expandedNodes.has(edge.source) &&
      expandedNodes.has(edge.target) &&
      !hiddenNodes.has(edge.source) &&
      !hiddenNodes.has(edge.target)
  );

  const getNodeColor = (nodeId) => {
    const path = getPathToNode(nodeId);
    const depth = path.length - 1;

    const colors = [
      "#2563EB",
      "#7C3AED",
      "#059669",
      "#DC2626",
      "#EA580C",
      "#0891B2",
      "#4F46E5",
      "#BE185D",
    ];

    return colors[depth % colors.length];
  };

  const pathString = currentPath
    .map((id) => nodeMap[id]?.data?.label || "")
    .filter(Boolean)
    .join(" ---> ");

  const maxNodesInLayer = Math.max(
    ...Object.values(nodesByLayer).map((arr) => arr.length),
    1
  );
  const canvasWidth = cumulativeX + 200;
  const canvasHeight = maxNodesInLayer * (nodeHeight + nodeSpacing) + 150;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-full mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🌳 Layered Tree Diagram
          </h1>
          <p className="text-purple-200 text-lg">
            Click nodes to expand/collapse 3 layers • {graphData.nodes.length}{" "}
            total nodes
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-2xl border border-white/20">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search nodes by label..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-1.5">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span className="px-4 py-1 text-sm font-bold text-white min-w-[4rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="ml-1 p-2 hover:bg-white/20 rounded transition-colors"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleUndo}
                disabled={currentHistoryIndex <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={currentHistoryIndex >= historyRef.current.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Undo className="w-4 h-4 rotate-180" />
                Redo
              </button>

              <button
                onClick={addMoreLayers}
                disabled={!activeNode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                <Layers className="w-4 h-4" />
                Add More Levels
              </button>

              <button
                onClick={toggleShowAll}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                <Maximize2 className="w-4 h-4" />
                {showAllGraph ? "Collapse All" : "Show All Graph"}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                <Home className="w-4 h-4" />
                Reset
              </button>

              <button
                onClick={handleHideSelected}
                disabled={selectedToHide.size === 0 || showAllGraph}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                Hide Selected ({selectedToHide.size})
              </button>

              <button
                onClick={handleShowSelected}
                disabled={
                  selectedToHide.size === 0 || showAllGraph || showSelectedMode
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                Show Selected ({selectedToHide.size})
              </button>

              <button
                onClick={() => {
                  setHiddenNodes(new Set());
                  setShowSelectedMode(false);
                }}
                disabled={hiddenNodes.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm shadow-lg"
              >
                {showSelectedMode
                  ? "Exit Show Selected"
                  : "Restore Hidden Nodes"}
              </button>
            </div>
          </div>
        </div>

        {currentPath.length > 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-2xl border border-white/20">
            <div className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-purple-300 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-purple-200 mb-1">
                  Current Path:
                </p>
                <p className="text-white font-mono text-sm break-all leading-relaxed">
                  {pathString}
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-auto"
          style={{ height: "calc(100vh - 420px)" }}
        >
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "0 0",
              padding: "20px",
              minWidth: canvasWidth,
              minHeight: canvasHeight,
            }}
          >
            <svg
              width={canvasWidth}
              height={canvasHeight}
              className="select-none"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="12"
                  markerHeight="12"
                  refX="11"
                  refY="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 0 L 12 6 L 0 12 z" fill="context-stroke" />
                </marker>
                <filter
                  id="greenGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                  <feOffset dx="0" dy="0" result="offsetblur" />
                  <feFlood floodColor="#10B981" floodOpacity="0.8" />
                  <feComposite in2="offsetblur" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g className="edges">
                {visibleEdges.map((edge) => {
                  const source = nodePositions[edge.source];
                  const target = nodePositions[edge.target];
                  if (!source || !target) return null;

                  const color = getNodeColor(edge.source);
                  const isInPath =
                    currentPath.includes(edge.source) &&
                    currentPath.includes(edge.target);

                  const sourcePath = getPathToNode(edge.source);
                  const sourceLayer = sourcePath.length - 1;
                  const isSourceLayerCollapsed =
                    collapsedLayers.has(sourceLayer);
                  const sourceWidth = isSourceLayerCollapsed
                    ? collapsedNodeWidth
                    : nodeWidth;

                  const arrowGap = 5;
                  const targetX = target.x - arrowGap;
                  const controlX1 = source.x + (targetX - source.x) * 0.5;
                  const controlX2 = source.x + (targetX - source.x) * 0.5;

                  const path = `M ${source.x + sourceWidth} ${
                    source.y + nodeHeight / 2
                  } 
                                C ${controlX1} ${source.y + nodeHeight / 2}, 
                                  ${controlX2} ${target.y + nodeHeight / 2}, 
                                  ${targetX} ${target.y + nodeHeight / 2}`;

                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth={isInPath ? 4 : 2}
                        opacity={isInPath ? 1 : 0.6}
                        markerEnd="url(#arrowhead)"
                        className={
                          edge.animated && isInPath ? "animate-pulse" : ""
                        }
                        style={{ transition: "all 0.3s ease" }}
                      />
                    </g>
                  );
                })}
              </g>

              <g className="nodes">
                {visibleNodes.map((node) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;

                  const isSelectedToHide = selectedToHide.has(node.id);
                  const color = getNodeColor(node.id);
                  const isActive = activeNode === node.id;
                  const isInPath = currentPath.includes(node.id);
                  const hasChildren = (childrenMap[node.id] || []).length > 0;
                  const isExpanded = hasExpandedDescendants(node.id);
                  const isSearchResult =
                    searchTerm &&
                    node.data?.label &&
                    node.data.label
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());
                  const isHovered = hoveredNode === node.id;

                  const nodePath = getPathToNode(node.id);
                  const nodeLayer = nodePath.length - 1;
                  const isLayerCollapsed = collapsedLayers.has(nodeLayer);
                  const currentWidth = isLayerCollapsed
                    ? collapsedNodeWidth
                    : nodeWidth;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => handleNodeClick(node.id)}
                      onContextMenu={(e) => handleNodeRightClick(e, node.id)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="cursor-pointer transition-all duration-300"
                      style={{ transition: "all 0.3s ease" }}
                    >
                      <g
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectNode(node.id);
                        }}
                      >
                        <circle
                          cx={currentWidth - 10}
                          cy={10}
                          r={8}
                          fill={isSelectedToHide ? "#22C55E" : "#1F2937"}
                          stroke="#22C55E"
                          strokeWidth="2"
                        />
                        <text
                          x={currentWidth - 10}
                          y={14}
                          textAnchor="middle"
                          fontSize="10"
                          fill="white"
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          {isSelectedToHide ? "✓" : "+"}
                        </text>
                      </g>

                      {isSelectedToHide && (
                        <rect
                          x="-6"
                          y="-6"
                          width={currentWidth + 12}
                          height={nodeHeight + 12}
                          rx="8"
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="3"
                          strokeDasharray="5 3"
                        />
                      )}

                      {(isActive || isInPath) && !isSearchResult && (
                        <rect
                          x="-5"
                          y="-5"
                          width={currentWidth + 10}
                          height={nodeHeight + 10}
                          rx="8"
                          fill={color}
                          opacity="0.3"
                          className="animate-pulse"
                        />
                      )}

                      {isSearchResult && (
                        <>
                          <rect
                            x="-8"
                            y="-8"
                            width={currentWidth + 16}
                            height={nodeHeight + 16}
                            rx="8"
                            fill="#10B981"
                            opacity="0.5"
                            className="animate-pulse"
                          />
                          <rect
                            x="-5"
                            y="-5"
                            width={currentWidth + 10}
                            height={nodeHeight + 10}
                            rx="8"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3"
                            opacity="0.8"
                            className="animate-pulse"
                          />
                        </>
                      )}

                      <rect
                        width={currentWidth}
                        height={nodeHeight}
                        rx="6"
                        fill={color}
                        stroke={isInPath ? "#FBBF24" : "white"}
                        strokeWidth={isInPath ? 3 : 2}
                        className="transition-all duration-300 drop-shadow-lg"
                        filter={isSearchResult ? "url(#greenGlow)" : "none"}
                      />

                      {!isLayerCollapsed && (
                        <>
                          <text
                            x={currentWidth / 2}
                            y={nodeHeight / 2}
                            fill="white"
                            fontSize="13"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                          >
                            {node.data?.label && node.data.label.length > 12
                              ? node.data.label.substring(0, 10) + "..."
                              : node.data?.label || "N/A"}
                          </text>
                        </>
                      )}

                      {isLayerCollapsed && (
                        <g>
                          <circle
                            cx={collapsedNodeWidth / 2}
                            cy={nodeHeight / 2 - 12}
                            r="2"
                            fill="white"
                          />
                          <circle
                            cx={collapsedNodeWidth / 2}
                            cy={nodeHeight / 2}
                            r="2"
                            fill="white"
                          />
                          <circle
                            cx={collapsedNodeWidth / 2}
                            cy={nodeHeight / 2 + 12}
                            r="2"
                            fill="white"
                          />
                        </g>
                      )}

                      {hasChildren && !isLayerCollapsed && (
                        <g transform={`translate(${currentWidth - 22}, 8)`}>
                          <circle
                            r="16"
                            fill="white"
                            opacity="0.95"
                            className="drop-shadow"
                          />
                          <text
                            x="0"
                            y="6"
                            fill={color}
                            fontSize="14"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none"
                          >
                            {isExpanded ? "−" : "+"}
                            {childrenMap[node.id]?.length || 0}
                          </text>
                        </g>
                      )}

                      {isHovered && (
                        <g transform={`translate(${currentWidth / 2}, ${-10})`}>
                          <rect
                            x="-80"
                            y="-50"
                            width="140"
                            height="50"
                            rx="4"
                            fill="rgba(0, 0, 0, 0.9)"
                            stroke="white"
                            strokeWidth="1"
                          />
                          <text
                            fill="white"
                            fontSize="11"
                            fontWeight="500"
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                          >
                            <tspan x="0" dy="-30" fill="#94A3B8">
                              File: {node.data?.file || "N/A"}
                            </tspan>
                            <tspan x="0" dy="16" fill="#94A3B8">
                              Function: {node.data?.function || "N/A"}
                            </tspan>
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-300">
                {graphData.nodes.length}
              </div>
              <div className="text-sm text-white">Total Nodes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-300">
                {expandedNodes.size}
              </div>
              <div className="text-sm text-white">Visible Nodes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300">
                {Object.keys(nodesByLayer).length}
              </div>
              <div className="text-sm text-white">Active Levels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowDiagramNew;

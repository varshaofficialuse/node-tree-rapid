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
  Menu,
} from "lucide-react";
import rawData from "./data/ a.json";

const FlowDiagramNew = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showAllSearchResults, setShowAllSearchResults] = useState(false);
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
  const [pinnedPathNodes, setPinnedPathNodes] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [collapseAllVisual, setCollapseAllVisual] = useState(false);

  // NEW: sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // History state for undo functionality - using refs for immediate updates
  const historyRef = useRef([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const isRestoringRef = useRef(false);
  const hasInitializedHistoryRef = useRef(false);
  const saveToHistory = () => {
    // no-op
  };

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
      pinnedPathNodes: Array.from(pinnedPathNodes),
    };

    if (!hasInitializedHistoryRef.current) {
      historyRef.current = [snapshot];
      setCurrentHistoryIndex(0);
      hasInitializedHistoryRef.current = true;
      return;
    }

    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    historyRef.current = historyRef.current.slice(0, currentHistoryIndex + 1);
    historyRef.current.push(snapshot);

    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      setCurrentHistoryIndex((prev) => Math.max(prev - 1, 0));
    } else {
      setCurrentHistoryIndex(historyRef.current.length - 1);
    }
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
    pinnedPathNodes, // ✅ ensure pins are tracked in history
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
      setPinnedPathNodes(new Set(previousState.pinnedPathNodes || []));

      setCurrentHistoryIndex(newIndex);
    }
  }, [currentHistoryIndex]);

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
      setPinnedPathNodes(new Set(nextState.pinnedPathNodes || []));

      setCurrentHistoryIndex(newIndex);
    }
  }, [currentHistoryIndex]);

  // Keyboard shortcut for undo / redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

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

    if (nodeId === activeNode) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        nodeId,
      });
      return;
    }

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
    // always clear hide/show selections when toggling
    setHiddenNodes(new Set());
    setSelectedToHide(new Set());
    setShowSelectedMode(false);

    const allNodes = new Set(graphData.nodes.map((n) => n.id));

    if (!showAllGraph) {
      // 1️⃣ First click: go from normal view → SHOW ALL (full size)
      setExpandedNodes(allNodes); // all nodes visible
      setActiveNode(rootNode?.id || null);
      setCurrentPath(rootNode ? [rootNode.id] : []);
      setShowAllGraph(true);
      setCollapseAllVisual(false); // no visual collapsing
    } else if (!collapseAllVisual) {
      // 2️⃣ Second click: SHOW ALL → COLLAPSE ALL (visual shrink)
      // Data stays fully expanded; only visual collapsing via collapseAllVisual
      setCollapseAllVisual(true);
    } else {
      // 3️⃣ Third click: COLLAPSE ALL → SHOW ALL (full size again)
      setCollapseAllVisual(false);
    }
  };

  const handleSearch = (term) => {
    const search = term.toLowerCase().trim();
    setSearchTerm(term);

    if (!search) {
      setExpandedNodes(new Set([rootNode.id]));
      setActiveNode(null);
      setCurrentPath([]);
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setShowAllSearchResults(false);
      return;
    }

    const matchedNodes = graphData.nodes.filter((n) =>
      (n.data?.label || "").toLowerCase().includes(search)
    );

    if (matchedNodes.length === 0) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    setSearchResults(matchedNodes);
    setCurrentSearchIndex(0);

    if (!showAllSearchResults) {
      const firstMatch = matchedNodes[0];
      const path = getPathToNode(firstMatch.id);
      const newExpanded = new Set(path);
      setExpandedNodes(newExpanded);
      setActiveNode(firstMatch.id);
      setCurrentPath(path);
    } else {
      handleShowAllSearchResults(matchedNodes);
    }
  };

  const handleNextSearchResult = () => {
    if (searchResults.length === 0) return;

    saveToHistory();

    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);

    const matchedNode = searchResults[nextIndex];
    const path = getPathToNode(matchedNode.id);
    const newExpanded = new Set(path);

    setExpandedNodes(newExpanded);
    setActiveNode(matchedNode.id);
    setCurrentPath(path);
  };

  const handlePreviousSearchResult = () => {
    if (searchResults.length === 0) return;

    saveToHistory();

    const prevIndex =
      currentSearchIndex === 0
        ? searchResults.length - 1
        : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);

    const matchedNode = searchResults[prevIndex];
    const path = getPathToNode(matchedNode.id);
    const newExpanded = new Set(path);

    setExpandedNodes(newExpanded);
    setActiveNode(matchedNode.id);
    setCurrentPath(path);
  };

  const handleShowAllSearchResults = (results = searchResults) => {
    if (results.length === 0) return;

    saveToHistory();

    const allPaths = new Set();

    results.forEach((node) => {
      const path = getPathToNode(node.id);
      path.forEach((id) => allPaths.add(id));

      const children = getNLayersOfChildren(node.id, 3);
      children.forEach((id) => allPaths.add(id));
    });

    setExpandedNodes(allPaths);
    setShowAllSearchResults(true);
  };

  const handleShowSingleSearchResult = () => {
    if (searchResults.length === 0) return;

    saveToHistory();

    const matchedNode = searchResults[currentSearchIndex];
    const path = getPathToNode(matchedNode.id);
    const newExpanded = new Set(path);

    setExpandedNodes(newExpanded);
    setActiveNode(matchedNode.id);
    setCurrentPath(path);
    setShowAllSearchResults(false);
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
    setPinnedPathNodes(new Set());
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

  const getTotalLayersInFullGraph = () => {
    const allLayers = graphData.nodes.map((node) => {
      const path = getPathToNode(node.id);
      return path.length - 1;
    });
    return Math.max(...allLayers, 0) + 1;
  };

  const totalLayers = getTotalLayersInFullGraph();

  const nodeHeight = 70;
  const nodeWidth = 140;
  const collapsedNodeWidth = 30;
  const nodeSpacing = 25;
  const expandedLayerWidth = 280;
  const collapsedLayerWidth = 80; // kept for visuals, not spacing

  const activeExpansionNodes = new Set();
  if (activeNode) {
    const expansionNodes = getNLayersOfChildren(activeNode, 3);
    expansionNodes.forEach((id) => activeExpansionNodes.add(id));
    const path = getPathToNode(activeNode);
    path.forEach((id) => activeExpansionNodes.add(id));
  }

  const collapsedLayers = new Set();
  const rootLayer = 0;

  const getMaxLayer = () => {
    const keys = Object.keys(nodesByLayer);
    if (keys.length === 0) return 0;
    return Math.max(...keys.map(Number));
  };

  const leafLayer = getMaxLayer();

  Object.entries(nodesByLayer).forEach(([layer, nodeIds]) => {
    const layerNum = parseInt(layer);
    const isLayerHovered = nodeIds.some((nodeId) => hoveredNode === nodeId);

    // We collapse a layer in two cases:
    // 1) Normal mode (showAllGraph === false) -> your original behaviour
    // 2) Show-all-data mode WITH visual collapse enabled
    const shouldCollapseThisLayer =
      // original behaviour
      (!showAllGraph ||
        // visual collapse when full graph is shown
        (showAllGraph && collapseAllVisual)) &&
      !isLayerHovered &&
      layerNum !== rootLayer &&
      layerNum !== leafLayer;

    if (shouldCollapseThisLayer) {
      collapsedLayers.add(layerNum);
    }
  });

  const layerXPositions = {};
  let cumulativeX = 50;
  const sortedLayers = Object.keys(nodesByLayer)
    .map(Number)
    .sort((a, b) => a - b);

  // ✅ ROBUST OVERLAP FIX: always use expanded width for spacing,
  // even if layer is visually "collapsed"
  sortedLayers.forEach((layerNum) => {
    layerXPositions[layerNum] = cumulativeX;
    cumulativeX += expandedLayerWidth;
  });

  const nodePositions = {};

  Object.entries(nodesByLayer).forEach(([layer, nodeIds]) => {
    const layerNum = parseInt(layer);

    const sortedNodeIds = [...nodeIds].sort((a, b) => {
      const aPinned = pinnedPathNodes.has(a);
      const bPinned = pinnedPathNodes.has(b);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aInPath = currentPath.includes(a);
      const bInPath = currentPath.includes(b);
      if (aInPath && !bInPath) return -1;
      if (!aInPath && bInPath) return 1;

      return 0;
    });

    let yCursor = 60;

    sortedNodeIds.forEach((nodeId) => {
      nodePositions[nodeId] = {
        x: layerXPositions[layerNum],
        y: yCursor,
      };
      yCursor += nodeHeight + nodeSpacing + 10;
    });
  });

  const visibleEdges = graphData.edges.filter(
    (edge) =>
      expandedNodes.has(edge.source) &&
      expandedNodes.has(edge.target) &&
      !hiddenNodes.has(edge.source) &&
      !hiddenNodes.has(edge.target)
  );

  const isEdgeInPinnedPath = (sourceId, targetId) => {
    if (!pinnedPathNodes || pinnedPathNodes.size === 0) return false;

    return Array.from(pinnedPathNodes).some((pinnedNodeId) => {
      const pinnedPath = getPathToNode(pinnedNodeId);
      return pinnedPath.includes(sourceId) && pinnedPath.includes(targetId);
    });
  };

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
  const canvasHeight = maxNodesInLayer * (nodeHeight + nodeSpacing) + 400;

  return (
    <div
      className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      onClick={() => setContextMenu(null)}
    >
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-[340px]" : "w-12"
        } transition-all duration-300 bg-black/40 border-r border-white/10 text-white flex flex-col`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen((prev) => !prev);
            }}
            className="p-1 rounded hover:bg-white/10"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
          {sidebarOpen && (
            <span className="text-xs uppercase tracking-wide text-purple-200">
              Controls
            </span>
          )}
        </div>

        {sidebarOpen && (
          <div className="flex-1 overflow-auto px-3 py-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <label className="block text-xs mb-1 text-purple-100">
                Search nodes
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-purple-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search nodes by label..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                {searchResults.length > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-[10px] text-purple-200 bg-purple-900/60 px-1.5 py-0.5 rounded">
                      {currentSearchIndex + 1} / {searchResults.length}
                    </span>
                    {searchResults.length > 1 && (
                      <>
                        <button
                          onClick={handlePreviousSearchResult}
                          disabled={currentSearchIndex === 0}
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Previous result"
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </button>
                        <button
                          onClick={handleNextSearchResult}
                          disabled={
                            currentSearchIndex === searchResults.length - 1
                          }
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Next result"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {searchResults.length > 1 && (
                <button
                  onClick={() =>
                    showAllSearchResults
                      ? handleShowSingleSearchResult()
                      : handleShowAllSearchResults()
                  }
                  className="mt-1 text-[11px] text-teal-200 hover:text-teal-100"
                >
                  {showAllSearchResults
                    ? `Show only current (${currentSearchIndex + 1}/${
                        searchResults.length
                      })`
                    : `Expand all ${searchResults.length} matches`}
                </button>
              )}
            </div>

            {/* Zoom */}
            <div>
              <label className="block text-xs mb-1 text-purple-100">Zoom</label>
              <div className="flex items-center gap-1 bg-white/10 rounded-lg px-1 py-1">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-1 rounded hover:bg-white/10"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-semibold">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-1 rounded hover:bg-white/10"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 rounded hover:bg-white/10 ml-1"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-xs mb-1 text-purple-100">
                Actions
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={addMoreLayers}
                  disabled={!activeNode}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded shadow"
                >
                  <Layers className="w-3 h-3" />
                  Levels
                </button>

                <button
                  onClick={toggleShowAll}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
                >
                  <Maximize2 className="w-4 h-4" />
                  {/* Label logic */}
                  {!showAllGraph || collapseAllVisual
                    ? "Show All Graph"
                    : "Collapse All"}
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-xs rounded shadow"
                >
                  <Home className="w-3 h-3" />
                  Reset
                </button>

                <button
                  onClick={handleHideSelected}
                  disabled={selectedToHide.size === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded shadow"
                >
                  Hide ({selectedToHide.size})
                </button>

                <button
                  onClick={handleShowSelected}
                  disabled={selectedToHide.size === 0 || showSelectedMode}
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded shadow"
                >
                  Show ({selectedToHide.size})
                </button>

                <button
                  onClick={() => {
                    setHiddenNodes(new Set());
                    setShowSelectedMode(false);
                  }}
                  disabled={hiddenNodes.size === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded shadow"
                >
                  Restore
                </button>

                <button
                  onClick={handleUndo}
                  disabled={currentHistoryIndex <= 0}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded shadow"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-3 h-3" />
                  Undo
                </button>

                <button
                  onClick={handleRedo}
                  disabled={
                    currentHistoryIndex >= historyRef.current.length - 1
                  }
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded shadow"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Undo className="w-3 h-3 rotate-180" />
                  Redo
                </button>

                <button
                  onClick={() => setPinnedPathNodes(new Set())}
                  disabled={pinnedPathNodes.size === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-xs rounded shadow"
                >
                  📌 Clear Pins
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-2 border-t border-white/10 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-purple-100">Total Nodes</span>
                <span className="font-semibold text-purple-300">
                  {graphData.nodes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Total Layers</span>
                <span className="font-semibold text-cyan-300">
                  {totalLayers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Visible Nodes</span>
                <span className="font-semibold text-green-300">
                  {expandedNodes.size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Active Levels</span>
                <span className="font-semibold text-yellow-300">
                  {Object.keys(nodesByLayer).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Pinned Paths</span>
                <span className="font-semibold text-amber-300">
                  {pinnedPathNodes.size}
                </span>
              </div>
            </div>
          </div>
        )}

        {!sidebarOpen && (
          <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-purple-100 gap-1">
            <span className="rotate-90">Controls</span>
          </div>
        )}
      </div>

      {/* MAIN PANEL */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {currentPath.length > 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 shadow-2xl border border-white/20">
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-purple-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-200 mb-1">
                  Current Path
                </p>
                <p className="text-white font-mono text-xs break-all leading-relaxed">
                  {pathString}
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-auto flex-1"
          style={{ height: "calc(100vh - 140px)" }} // more space for tree
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

              {/* EDGES */}
              <g className="edges">
                {visibleEdges.map((edge) => {
                  const source = nodePositions[edge.source];
                  const target = nodePositions[edge.target];
                  if (!source || !target) return null;

                  const color = getNodeColor(edge.source);
                  const isInPath =
                    currentPath.includes(edge.source) &&
                    currentPath.includes(edge.target);

                  const isInPinnedPath = isEdgeInPinnedPath(
                    edge.source,
                    edge.target
                  );

                  const sourcePath = getPathToNode(edge.source);
                  const sourceLayer = sourcePath.length - 1;
                  const isSourceLayerCollapsed =
                    collapsedLayers.has(sourceLayer);
                  const sourceWidth = isSourceLayerCollapsed
                    ? collapsedNodeWidth
                    : nodeWidth;

                  const arrowGap = 6;
                  const targetX = target.x - arrowGap;

                  const baseStartY = source.y + nodeHeight / 2;
                  const baseEndY = target.y + nodeHeight / 2;

                  const siblingEdges = visibleEdges.filter((e) => {
                    const s = nodePositions[e.source];
                    const t = nodePositions[e.target];
                    if (!s || !t) return false;
                    return s.x === source.x && t.x === target.x;
                  });

                  const siblingIndex = siblingEdges.findIndex(
                    (e) => e.id === edge.id
                  );
                  const siblingCount = siblingEdges.length;
                  const centerIndex = (siblingCount - 1) / 2;

                  const EDGE_TRACK_SPACING_Y = 16;
                  const EDGE_TRACK_SPACING_X = 14;

                  const laneOffsetY =
                    (siblingIndex - centerIndex) * EDGE_TRACK_SPACING_Y;

                  const startY = baseStartY + laneOffsetY;
                  const endY = baseEndY + laneOffsetY;

                  const midXBase = source.x + (targetX - source.x) * 0.5;
                  const controlXOffset =
                    (siblingIndex - centerIndex) * EDGE_TRACK_SPACING_X;

                  const controlX1 = midXBase + controlXOffset;
                  const controlX2 = midXBase + controlXOffset;

                  const controlY1 = startY;
                  const controlY2 = endY;

                  const path = `M ${source.x + sourceWidth} ${startY}
                                C ${controlX1} ${controlY1},
                                  ${controlX2} ${controlY2},
                                  ${targetX} ${endY}`;

                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth={isInPinnedPath ? 6 : isInPath ? 4 : 2}
                        opacity={isInPinnedPath ? 1 : isInPath ? 1 : 0.6}
                        markerEnd="url(#arrowhead)"
                        className={
                          edge.animated && (isInPath || isInPinnedPath)
                            ? "animate-pulse"
                            : ""
                        }
                        style={{ transition: "all 0.3s ease" }}
                      />
                    </g>
                  );
                })}
              </g>

              {/* NODES */}
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
                  const isSearchResult = searchResults.some(
                    (result) => result.id === node.id
                  );
                  const isCurrentSearchResult =
                    searchResults.length > 0 &&
                    searchResults[currentSearchIndex]?.id === node.id;
                  const isHovered = hoveredNode === node.id;

                  const nodePath = getPathToNode(node.id);
                  const nodeLayer = nodePath.length - 1;
                  const isLayerCollapsed = collapsedLayers.has(nodeLayer);

                  const isNodeInCurrentPath = currentPath.includes(node.id);
                  const isPinnedNode = pinnedPathNodes.has(node.id);

                  const forceFullSizeForThisNode =
                    (hoveredNode === activeNode && isNodeInCurrentPath) ||
                    (pinnedPathNodes.size > 0 &&
                      Array.from(pinnedPathNodes).some((pinnedNodeId) => {
                        const pinnedPath = getPathToNode(pinnedNodeId);
                        return pinnedPath.includes(node.id);
                      }));

                  const currentWidth =
                    isLayerCollapsed && !forceFullSizeForThisNode
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
                      {isPinnedNode && (
                        <g
                          transform={`translate(${currentWidth - 30}, ${-14})`}
                        >
                          <circle r="9" fill="#FACC15" />
                          <text
                            y="4"
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="bold"
                            fill="black"
                          >
                            📌
                          </text>
                        </g>
                      )}

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
                            fill={isCurrentSearchResult ? "#10B981" : "#3B82F6"}
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
                            stroke={
                              isCurrentSearchResult ? "#10B981" : "#3B82F6"
                            }
                            strokeWidth={isCurrentSearchResult ? 4 : 2}
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
                        stroke={
                          isInPath
                            ? "#FBBF24"
                            : isPinnedNode
                            ? "#FACC15"
                            : "white"
                        }
                        strokeWidth={isInPath ? 3 : 2}
                        className="transition-all duration-300 drop-shadow-lg"
                        filter={
                          isSearchResult
                            ? "url(#greenGlow)"
                            : isPinnedNode
                            ? "url(#greenGlow)"
                            : "none"
                        }
                      />

                      {currentWidth === nodeWidth && (
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
                      )}

                      {isLayerCollapsed &&
                        currentWidth === collapsedNodeWidth && (
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

                      {hasChildren && currentWidth === nodeWidth && (
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
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-black text-white rounded-lg shadow-xl border border-white/20"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block px-4 py-2 hover:bg-white/10 text-sm w-full text-left"
            onClick={() => {
              setPinnedPathNodes((prev) => {
                const next = new Set(prev);
                if (next.has(contextMenu.nodeId)) {
                  next.delete(contextMenu.nodeId);
                } else {
                  next.add(contextMenu.nodeId);
                }
                return next;
              });

              setContextMenu(null);
            }}
          >
            {pinnedPathNodes.has(contextMenu.nodeId)
              ? "Unpin This Path"
              : "Pin This Path"}
          </button>

          <button
            className="block px-4 py-2 hover:bg-white/10 text-sm w-full text-left text-red-400"
            onClick={() => setContextMenu(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default FlowDiagramNew;

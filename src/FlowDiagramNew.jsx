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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [miniMapVisible, setMiniMapVisible] = useState(true);
  const [miniMapHoveredNode, setMiniMapHoveredNode] = useState(null);
  const [isolatedNodeId, setIsolatedNodeId] = useState(null);
  const [preIsolateState, setPreIsolateState] = useState(null);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
 const [showPreviousLayersNode, setShowPreviousLayersNode] = useState(null);
const [prePreviousLayersState, setPrePreviousLayersState] = useState(null);
  const miniMapRef = useRef(null);
  const viewportDragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startScrollX: 0,
    startScrollY: 0,
  });

  const historyRef = useRef([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const isRestoringRef = useRef(false);
  const hasInitializedHistoryRef = useRef(false);

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

  useEffect(() => {
    if (rootNode && expandedNodes.size === 0 && !showAllGraph) {
      setExpandedNodes(new Set([rootNode.id]));
    }
  }, [rootNode, expandedNodes.size, showAllGraph]);

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
      isolatedNodeId,
        showPreviousLayersNode,

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
    pinnedPathNodes,
  ]);

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
      setIsolatedNodeId(
        previousState.isolatedNodeId !== undefined
          ? previousState.isolatedNodeId
          : null
      );
      setShowPreviousLayersNode(previousState.showPreviousLayersNode !== undefined ? previousState.showPreviousLayersNode : null);

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
      setIsolatedNodeId(
        nextState.isolatedNodeId !== undefined ? nextState.isolatedNodeId : null
      );
      setShowPreviousLayersNode(nextState.showPreviousLayersNode !== undefined ? nextState.showPreviousLayersNode : null);

      setCurrentHistoryIndex(newIndex);
    }
  }, [currentHistoryIndex]);

  // Sync minimap viewport rectangle when main canvas scrolls or zooms
  useEffect(() => {
    if (!containerRef.current || !miniMapVisible) return;

    const container = containerRef.current;

    const handleScroll = () => {
      // Force re-render to update viewport rectangle
      // This is efficient as it only updates the minimap viewport, not the whole tree
      setMiniMapHoveredNode((prev) => prev); // Trigger minimal re-render
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [miniMapVisible, zoom]);

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
    setHiddenNodes(new Set());
    setSelectedToHide(new Set());
    setShowSelectedMode(false);

    const allNodes = new Set(graphData.nodes.map((n) => n.id));

    if (!showAllGraph) {
      setExpandedNodes(allNodes);
      setActiveNode(rootNode?.id || null);
      setCurrentPath(rootNode ? [rootNode.id] : []);
      setShowAllGraph(true);
      setCollapseAllVisual(false);
    } else if (!collapseAllVisual) {
      setCollapseAllVisual(true);
    } else {
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

    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);

    const matchedNode = searchResults[nextIndex];
    const path = getPathToNode(matchedNode.id);
    const newExpanded = new Set(path);

    setExpandedNodes(newExpanded);
    setActiveNode(matchedNode.id);
    setCurrentPath(path);

    // Auto-scroll to the search result
    setTimeout(() => scrollToNode(matchedNode.id), 100);
  };

  const handlePreviousSearchResult = () => {
    if (searchResults.length === 0) return;

    const prevIndex =
      currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);

    const matchedNode = searchResults[prevIndex];
    const path = getPathToNode(matchedNode.id);
    const newExpanded = new Set(path);

    setExpandedNodes(newExpanded);
    setActiveNode(matchedNode.id);
    setCurrentPath(path);

    // Auto-scroll to the search result
    setTimeout(() => scrollToNode(matchedNode.id), 100);
  };

  const handleShowAllSearchResults = (results = searchResults) => {
    if (results.length === 0) return;

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
    setIsolatedNodeId(null);
    setPreIsolateState(null);
    setShowPreviousLayersNode(null);
    setPrePreviousLayersState(null);
  };
  const scrollToNode = (nodeId) => {
    const pos = nodePositions[nodeId];
    if (!pos || !containerRef.current) return;

    const container = containerRef.current;
    const scaleFactor = zoom / 100;

    // Calculate the center position
    const centerX =
      pos.x * scaleFactor -
      container.clientWidth / 2 +
      (nodeWidth * scaleFactor) / 2;
    const centerY =
      pos.y * scaleFactor -
      container.clientHeight / 2 +
      (nodeHeight * scaleFactor) / 2;

    // Smooth scroll animation
    container.scrollTo({
      left: Math.max(0, centerX),
      top: Math.max(0, centerY),
      behavior: "smooth",
    });
  };

  // const handleMiniMapClick = (nodeId) => {
  //   setActiveNode(nodeId);
  //   setCurrentPath(getPathToNode(nodeId));
  //   scrollToNode(nodeId);
  // };

  const handleIsolateNode = (nodeId) => {
    if (isolatedNodeId === nodeId) {
      // Un-isolate: restore previous state
      handleUnisolate();
      return;
    }

    // Save current state before isolating
    setPreIsolateState({
      hiddenNodes: new Set(hiddenNodes),
      expandedNodes: new Set(expandedNodes),
      showSelectedMode,
      activeNode,
      currentPath: [...currentPath],
    });

    // Get all descendants of the isolated node
    const descendants = getAllDescendants(nodeId);
    const nodesToKeep = new Set([nodeId, ...descendants]);

    // TRUE ISOLATION: Hide ALL other nodes (including ancestors, siblings, etc.)
    const allNodeIds = new Set(graphData.nodes.map((n) => n.id));
    const nodesToHide = new Set();

    allNodeIds.forEach((id) => {
      if (!nodesToKeep.has(id)) {
        nodesToHide.add(id);
      }
    });

    // Expand the isolated node and its descendants
    const newExpanded = new Set();
    nodesToKeep.forEach((id) => newExpanded.add(id));

    setHiddenNodes(nodesToHide);
    setExpandedNodes(newExpanded);
    setIsolatedNodeId(nodeId);
    setActiveNode(nodeId);
    setCurrentPath([nodeId]); // Only the isolated node in path, no ancestors
    setShowSelectedMode(false);
    setSelectedToHide(new Set());

    // Auto-scroll to isolated node
    setTimeout(() => scrollToNode(nodeId), 100);
  };

  // ============ VISIBLE NODE/LAYER CALCS ============
  const visibleNodeIds = Array.from(expandedNodes).filter(
    (id) => !hiddenNodes.has(id)
  );

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

  const handleUnisolate = () => {
    if (!preIsolateState) {
      // Fallback: just clear hidden nodes
      setHiddenNodes(new Set());
      setIsolatedNodeId(null);
      setShowSelectedMode(false);
      return;
    }

    // Restore the previous state completely
    setHiddenNodes(preIsolateState.hiddenNodes);
    setExpandedNodes(preIsolateState.expandedNodes);
    setShowSelectedMode(preIsolateState.showSelectedMode);
    setActiveNode(preIsolateState.activeNode);
    setCurrentPath(preIsolateState.currentPath || []);
    setIsolatedNodeId(null);
    setPreIsolateState(null);
  };
// Show/Hide Previous Layers functionality
// Show/Hide Previous Layers functionality
// Show/Hide Previous Layers functionality
  const handleShowPreviousLayers = (nodeId) => {
    if (showPreviousLayersNode === nodeId) {
      // Toggle off: restore previous state
      handleHidePreviousLayers();
      return;
    }

    // Save current state
    setPrePreviousLayersState({
      pinnedPathNodes: new Set(pinnedPathNodes),
    });

    // Get the layer number of the clicked node
    const nodePath = getPathToNode(nodeId);
    const clickedNodeLayer = nodePath.length - 1;

    // Get ALL nodes from root layer up to (but NOT including) the clicked node's layer
    const nodesToPin = new Set(pinnedPathNodes); // Keep existing pins
    
    graphData.nodes.forEach((node) => {
      const path = getPathToNode(node.id);
      const layer = path.length - 1;
      
      // Pin all nodes in layers BEFORE the clicked node's layer
      if (layer < clickedNodeLayer) {
        nodesToPin.add(node.id);
      }
    });

    // Update pinned nodes to force previous layers to stay open
    setPinnedPathNodes(nodesToPin);
    setShowPreviousLayersNode(nodeId);
    
    // Scroll to the node
    setTimeout(() => scrollToNode(nodeId), 100);
  };

  const handleHidePreviousLayers = () => {
    if (!prePreviousLayersState) {
      // Fallback: just clear the flag
      setShowPreviousLayersNode(null);
      return;
    }

    // Restore the previous pinned state (shrink back)
    setPinnedPathNodes(prePreviousLayersState.pinnedPathNodes);
    setShowPreviousLayersNode(null);
    setPrePreviousLayersState(null);
  };
  // ========== IMPORTANT: layout constants (moved up to avoid TDZ errors) ==========
  const nodeHeight = 70;
  const nodeWidth = 140;
  const collapsedNodeWidth = 30;
  const nodeSpacing = 40;
  const expandedLayerWidth = 300;

  const pathString = currentPath
    .map((id) => nodeMap[id]?.data?.label || "")
    .filter(Boolean)
    .join(" → ");

  const maxNodesInLayer = Math.max(
    ...Object.values(nodesByLayer).map((arr) => arr.length),
    1
  );

  // Build layer X positions BEFORE computing canvas width
  const layerXPositions = {};
  let cumulativeX = 50;

  const sortedLayers = Object.keys(nodesByLayer)
    .map(Number)
    .sort((a, b) => a - b);

  sortedLayers.forEach((layerNum) => {
    layerXPositions[layerNum] = cumulativeX;
    cumulativeX += expandedLayerWidth;
  });

  // NOW these are safe (cumulativeX is defined above)
  const canvasWidth = cumulativeX + 400;
  const canvasHeight =
    maxNodesInLayer * (nodeHeight + nodeSpacing) + 400;

  // Attach global mouse move and up handlers for viewport dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (viewportDragRef.current.isDragging) {
        handleViewportDragMove(e);
      }
    };

    const handleMouseUp = () => {
      if (viewportDragRef.current.isDragging) {
        handleViewportDragEnd();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [zoom, canvasWidth, canvasHeight]);

  const visibleNodes = visibleNodeIds.map((id) => nodeMap[id]).filter(Boolean);

  const getTotalLayersInFullGraph = () => {
    const allLayers = graphData.nodes.map((node) => {
      const path = getPathToNode(node.id);
      return path.length - 1;
    });
    return Math.max(...allLayers, 0) + 1;
  };

  const totalLayers = getTotalLayersInFullGraph();

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

    const shouldCollapseThisLayer =
      (!showAllGraph || (showAllGraph && collapseAllVisual)) &&
      !isLayerHovered &&
      layerNum !== rootLayer &&
      layerNum !== leafLayer;

    if (shouldCollapseThisLayer) {
      collapsedLayers.add(layerNum);
    }
  });

  // nodePositions depends on layerXPositions (already computed)
  const nodePositions = {};

  Object.entries(nodesByLayer).forEach(([layer, nodeIds]) => {
    const layerNum = parseInt(layer);

    // Sort by parent's Y position to keep children grouped
    const sortedNodeIds = [...nodeIds].sort((a, b) => {
      const parentA = parentMap[a];
      const parentB = parentMap[b];

      // If both have positioned parents, sort by parent Y
      if (
        parentA &&
        parentB &&
        nodePositions[parentA] &&
        nodePositions[parentB]
      ) {
        const diff = nodePositions[parentA].y - nodePositions[parentB].y;
        if (diff !== 0) return diff;
      }

      // Otherwise alphabetical
      return a.localeCompare(b);
    });

    let yCursor = 80;

    sortedNodeIds.forEach((nodeId) => {
      nodePositions[nodeId] = {
        x: layerXPositions[layerNum],
        y: yCursor,
      };
      yCursor += nodeHeight + nodeSpacing;
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

    // Lighter, softer colors for better visual appearance
    const colors = [
      "#60A5FA", // Light blue
      "#A78BFA", // Light purple
      "#34D399", // Light green
      "#F87171", // Light red
      "#FB923C", // Light orange
      "#22D3EE", // Light cyan
      "#818CF8", // Light indigo
      "#F472B6", // Light pink
    ];

    return colors[depth % colors.length];
  };

  // ============ MINIMAP SYNC FUNCTIONS ============
  const getMiniMapScale = () => {
    if (!miniMapRef.current) return 1;
    const miniMapWidth = 280;
    const miniMapHeight = 164;
    const scaleX = miniMapWidth / canvasWidth;
    const scaleY = miniMapHeight / canvasHeight;
    return Math.min(scaleX, scaleY);
  };

  const miniMapToMainCoords = (miniMapX, miniMapY) => {
    const scale = getMiniMapScale();
    return {
      x: miniMapX / scale,
      y: miniMapY / scale,
    };
  };

  const getViewportRect = () => {
    if (!containerRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    const container = containerRef.current;
    const scaleFactor = zoom / 100;
    return {
      x: container.scrollLeft / scaleFactor,
      y: container.scrollTop / scaleFactor,
      width: container.clientWidth / scaleFactor,
      height: container.clientHeight / scaleFactor,
    };
  };

  const syncZoomFromMiniMapToMain = (delta, miniMapX, miniMapY) => {
    const zoomSpeed = 0.1;
    const zoomFactor = delta > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    const newZoom = Math.max(25, Math.min(200, zoom * zoomFactor));

    if (newZoom !== zoom && containerRef.current) {
      const container = containerRef.current;
      const newZoomFactor = newZoom / 100;
      const { x: mainX, y: mainY } = miniMapToMainCoords(miniMapX, miniMapY);
      const newScrollX = mainX * newZoomFactor - container.clientWidth / 2;
      const newScrollY = mainY * newZoomFactor - container.clientHeight / 2;

      setZoom(newZoom);
      setTimeout(() => {
        container.scrollLeft = Math.max(0, newScrollX);
        container.scrollTop = Math.max(0, newScrollY);
      }, 0);
    }
  };

  const syncPanFromMiniMapToMain = (miniMapX, miniMapY) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scaleFactor = zoom / 100;
    const { x: mainX, y: mainY } = miniMapToMainCoords(miniMapX, miniMapY);
    const newScrollX = mainX * scaleFactor - container.clientWidth / 2;
    const newScrollY = mainY * scaleFactor - container.clientHeight / 2;

    container.scrollTo({
      left: Math.max(0, newScrollX),
      top: Math.max(0, newScrollY),
      behavior: "smooth",
    });
  };

  const handleMiniMapWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!miniMapRef.current) return;
    const rect = miniMapRef.current.getBoundingClientRect();
    const miniMapX = e.clientX - rect.left;
    const miniMapY = e.clientY - rect.top - 36;
    syncZoomFromMiniMapToMain(e.deltaY, miniMapX, miniMapY);
  };

  const handleMiniMapClick = (e) => {
    if (viewportDragRef.current.isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const miniMapX = e.clientX - rect.left;
    const miniMapY = e.clientY - rect.top;
    syncPanFromMiniMapToMain(miniMapX, miniMapY);
  };

  const handleViewportDragStart = (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const container = containerRef.current;
    viewportDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startScrollX: container.scrollLeft,
      startScrollY: container.scrollTop,
    };
    setIsDraggingViewport(true);
  };

  const handleViewportDragMove = (e) => {
    if (!viewportDragRef.current.isDragging || !containerRef.current) return;
    e.preventDefault();
    const container = containerRef.current;
    const miniMapScale = getMiniMapScale();
    const scaleFactor = zoom / 100;
    const deltaX = e.clientX - viewportDragRef.current.startX;
    const deltaY = e.clientY - viewportDragRef.current.startY;
    const mainDeltaX = (deltaX / miniMapScale) * scaleFactor;
    const mainDeltaY = (deltaY / miniMapScale) * scaleFactor;
    container.scrollLeft = viewportDragRef.current.startScrollX + mainDeltaX;
    container.scrollTop = viewportDragRef.current.startScrollY + mainDeltaY;
  };

  const handleViewportDragEnd = () => {
    viewportDragRef.current.isDragging = false;
    setIsDraggingViewport(false);
  };

  return (
    <div
      className="min-h-screen flex bg-gray-100"
      onClick={() => setContextMenu(null)}
    >
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-12"
        } transition-all duration-300 bg-white border-r border-gray-300 shadow-lg flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300 bg-gray-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen((prev) => !prev);
            }}
            className="p-1 rounded hover:bg-gray-200 text-gray-700"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
          {sidebarOpen && (
            <span className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
              Controls
            </span>
          )}
        </div>

        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-white">
            <div className="relative">
              <label className="block text-xs mb-1 text-gray-700">
                Search nodes
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {searchResults.length > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-xs text-gary-600 bg-blue-100 px-1.5 py-0.5 rounded">
                      {currentSearchIndex + 1}/{searchResults.length}
                    </span>
                    {searchResults.length > 1 && (
                      <>
                        <button
                          onClick={handlePreviousSearchResult}
                          className="p-0.5 rounded hover:bg-gray-100"
                          title="Previous"
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </button>
                        <button
                          onClick={handleNextSearchResult}
                          className="p-0.5 rounded hover:bg-gray-100"
                          title="Next"
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
                  className="mt-1 text-xs text-gary hover:text-teal-100"
                >
                  {showAllSearchResults
                    ? "Show current only"
                    : `Show all ${searchResults.length}`}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-700">Zoom</label>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-semibold">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 rounded hover:bg-gray-100 ml-1"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-700">
                Actions
              </label>
              <div className="flex flex-wrap  text-white gap-2">
                <button
                  onClick={addMoreLayers}
                  disabled={!activeNode}
                  className="flex items-center gap-1 px-2 py-1  bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-xs rounded"
                >
                  <Layers className="w-3 h-3" />
                  Levels
                </button>
                <button
                  onClick={toggleShowAll}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-xs rounded"
                >
                  <Maximize2 className="w-3 h-3" />
                  {!showAllGraph || collapseAllVisual ? "Show All" : "Collapse"}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-xs rounded"
                >
                  <Home className="w-3 h-3" />
                  Reset
                </button>

                <button
                  onClick={handleHideSelected}
                  disabled={selectedToHide.size === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-xs rounded"
                >
                  Hide ({selectedToHide.size})
                </button>
                <button
                  onClick={handleShowSelected}
                  disabled={selectedToHide.size === 0 || showSelectedMode}
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-xs rounded"
                >
                  Show ({selectedToHide.size})
                </button>
                <button
                  onClick={() => {
                    setHiddenNodes(new Set());
                    setShowSelectedMode(false);
                  }}
                  disabled={hiddenNodes.size === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-xs rounded"
                >
                  Restore
                </button>
                <button
                  onClick={handleUndo}
                  disabled={currentHistoryIndex <= 0}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-xs rounded"
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
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-00 text-xs rounded"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Undo className="w-3 h-3 rotate-180" />
                  Redo
                </button>
                <button
                  onClick={() => setPinnedPathNodes(new Set())}
                  disabled={pinnedPathNodes.size === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-xs rounded"
                >
                  Clear Pins
                </button>
                <button
                  onClick={handleUnisolate}
                  disabled={!isolatedNodeId}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-xs rounded"
                >
                  Un-isolate
                </button>
                                <button onClick={handleHidePreviousLayers} disabled={!showPreviousLayersNode} className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-xs rounded">
                  Shrink Prev Layers
                </button>
                <button
                  onClick={() => setMiniMapVisible(!miniMapVisible)}
                  className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-xs rounded"
                >
                  <Maximize2 className="w-3 h-3" />
                  {miniMapVisible ? "Hide" : "Show"} Map
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-300 text-xs space-y-1 bg-gray-50 -mx-3 px-3 py-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Nodes</span>
                <span className="font-semibold text-gray-500">
                  {graphData.nodes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total Layers</span>
                <span className="font-semibold text-gray-500">
                  {totalLayers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Visible Nodes</span>
                <span className="font-semibold  text-gray-500">
                  {expandedNodes.size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Active Levels</span>
                <span className="font-semibold  text-gray-500">
                  {Object.keys(nodesByLayer).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pinned Paths</span>
                <span className="font-semibold text-amber-600">
                  {pinnedPathNodes.size}
                </span>
              </div>
              {isolatedNodeId && (
                <div className="flex justify-between bg-orange-100 -mx-3 px-3 py-1 mt-2">
                  <span className="text-gray-700 font-semibold">Isolated</span>
                  <span className="font-semibold text-orange-600">
                    {nodeMap[isolatedNodeId]?.data?.label || "Node"}
                  </span>
                </div>
              )}
                         {/* {showPreviousLayersNode && (
                <div className="flex justify-between bg-purple-100 -mx-3 px-3 py-1 mt-2">
                  <span className="text-gray-700 font-semibold">Prev Layers</span>
                  <span className="font-semibold text-purple-600">{nodeMap[showPreviousLayersNode]?.data?.label || "Node"}</span>
                </div>
              )} */}
            </div>
          </div>
        )}

        {!sidebarOpen && (
          <div className="flex-1 flex flex-col items-center justify-center text-xs text-gray-600 gap-1 bg-gray-50">
            <span className="rotate-90 whitespace-nowrap">Controls</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4 bg-gray-100 overflow-hidden">
        {currentPath.length > 1 && (
          <div className="bg-white rounded-xl p-3 shadow-md border border-gray-300">
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Current Path
                </p>
                <p className="text-gray-900 font-mono text-xs break-all leading-relaxed">
                  {pathString}
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="bg-white rounded-xl shadow-lg border border-gray-300 overflow-auto flex-1"
          style={{ height: "calc(100vh - 140px)", width: "100%" }}
        >
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "0 0",
              padding: "20px",
              minWidth: canvasWidth,
              minHeight: canvasHeight,
              background: "transparent",
            }}
          >
            <svg
              width={canvasWidth}
              height={canvasHeight}
              className="select-none"
              style={{ display: "block", minWidth: "100%", minHeight: "100%" }}
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

                  const startX = source.x + sourceWidth;
                  const startY = source.y + nodeHeight / 2;
                  const endX = target.x - 6;
                  const endY = target.y + nodeHeight / 2;

                  const midX = startX + (endX - startX) * 0.5;

                  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                  return (
                    <path
                      key={edge.id}
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth={isInPinnedPath ? 6 : isInPath ? 4 : 2}
                      opacity={isInPinnedPath ? 1 : isInPath ? 1 : 0.6}
                      markerEnd="url(#arrowhead)"
                      style={{ transition: "all 0.3s ease" }}
                    />
                  );
                })}
              </g>

              <g className="nodes">
                {visibleNodes
                  .filter((node) => node.id !== hoveredNode)
                  .map((node) => {
                    const pos = nodePositions[node.id];
                    if (!pos) return null;

                    const isSelectedToHide = selectedToHide.has(node.id);
                    const color = getNodeColor(node.id);
                    const isActive = activeNode === node.id;
                    const isInPath = currentPath.includes(node.id);
                    const hasChildren = (childrenMap[node.id] || []).length >
                      0;
                    const isExpanded = hasExpandedDescendants(node.id);
                    const isSearchResult = searchResults.some(
                      (result) => result.id === node.id
                    );
                    const isCurrentSearchResult =
                      searchResults.length > 0 &&
                      searchResults[currentSearchIndex]?.id === node.id;
                    const isHovered = false; // Never show tooltip here

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
                        className="cursor-pointer"
                        style={{ transition: "all 0.3s ease" }}
                      >
                        {/* All the node rendering code WITHOUT the tooltip */}
{(() => {
  // Check if this node is manually pinned (not just from Show Previous Layers)
  const isManuallyPinned = isPinnedNode && (!showPreviousLayersNode || !(() => {
    const nodePath = getPathToNode(node.id);
    const nodeLayer = nodePath.length - 1;
    const clickedPath = getPathToNode(showPreviousLayersNode);
    const clickedLayer = clickedPath.length - 1;
    return nodeLayer < clickedLayer; // It's in a previous layer
  })());
  
  return isManuallyPinned && (
    <g transform={`translate(${currentWidth - 30}, ${-14})`}>
      <circle r="9" fill="#FACC15" />
      <text y="4" textAnchor="middle" fontSize="12" fontWeight="bold" fill="black">📌</text>
    </g>
  );
})()}

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
                              fill={
                                isCurrentSearchResult ? "#10B981" : "#3B82F6"
                              }
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
                          className="drop-shadow-lg"
                          filter={
                            isSearchResult
                              ? "url(#greenGlow)"
                              : isPinnedNode
                              ? "url(#greenGlow)"
                              : "none"
                          }
                          style={{ transition: "all 0.3s ease" }}
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
                              stroke="#9CA3AF"
                              strokeWidth="1"
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
                      </g>
                    );
                  })}

                {/* Render hovered node LAST so it appears on top */}
                {hoveredNode &&
                  visibleNodes.find((n) => n.id === hoveredNode) &&
                  (() => {
                    const node = visibleNodes.find((n) => n.id === hoveredNode);
                    const pos = nodePositions[node.id];
                    if (!pos) return null;

                    const isSelectedToHide = selectedToHide.has(node.id);
                    const color = getNodeColor(node.id);
                    const isActive = activeNode === node.id;
                    const isInPath = currentPath.includes(node.id);
                    const hasChildren = (childrenMap[node.id] || []).length >
                      0;
                    const isExpanded = hasExpandedDescendants(node.id);
                    const isSearchResult = searchResults.some(
                      (result) => result.id === node.id
                    );
                    const isCurrentSearchResult =
                      searchResults.length > 0 &&
                      searchResults[currentSearchIndex]?.id === node.id;
                    const isHovered = true;

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
                        key={node.id + "-hovered"}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => handleNodeClick(node.id)}
                        onContextMenu={(e) => handleNodeRightClick(e, node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className="cursor-pointer"
                        style={{ transition: "all 0.3s ease" }}
                      >
                        {/* Same node rendering WITH tooltip */}
                        {isPinnedNode && (
                          <g
                            transform={`translate(${
                              currentWidth - 30
                            }, ${-14})`}
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
                              fill={
                                isCurrentSearchResult ? "#10B981" : "#3B82F6"
                              }
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
                          className="drop-shadow-lg"
                          filter={
                            isSearchResult
                              ? "url(#greenGlow)"
                              : isPinnedNode
                              ? "url(#greenGlow)"
                              : "none"
                          }
                          style={{ transition: "all 0.3s ease" }}
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
                              stroke="#9CA3AF"
                              strokeWidth="1"
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

                        {/* TOOLTIP - only rendered for hovered node */}
                        <g
                          transform={`translate(${currentWidth / 2}, ${-10})`}
                          style={{ pointerEvents: "none" }}
                        >
                          <rect
                            x="-80"
                            y="-50"
                            width="160"
                            height="50"
                            rx="4"
                            fill="rgba(0, 0, 0, 0.95)"
                            stroke="white"
                            strokeWidth="2"
                            filter="url(#tooltipShadow)"
                          />
                          <text
                            fill="white"
                            fontSize="11"
                            fontWeight="500"
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                          >
                            <tspan x="0" dy="-30" fill="#E5E7EB">
                              File: {node.data?.file || "N/A"}
                            </tspan>
                            <tspan x="0" dy="16" fill="#E5E7EB">
                              Function: {node.data?.function || "N/A"}
                            </tspan>
                          </text>
                        </g>
                      </g>
                    );
                  })()}
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* MINI-MAP NAVIGATOR */}
      {miniMapVisible && (
<div
  ref={miniMapRef}
  className="fixed bottom-6 bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-hidden select-none transition-all duration-300"
  style={{
    width: "280px",
    height: "200px",
    left: sidebarOpen ? "300px" : "60px", // moves based on sidebar width
    zIndex: 40,
  }}
  onWheel={handleMiniMapWheel}
>

          {/* Mini-map header */}
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Navigator</span>
            <button
              onClick={() => setMiniMapVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>

          {/* Mini-map canvas */}
          <div
            className="relative w-full h-full bg-gray-50"
            style={{ height: "calc(100% - 36px)" }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className={isDraggingViewport ? "cursor-grabbing" : "cursor-pointer"}
              onClick={handleMiniMapClick}
            >
              {/* Mini-map edges */}
              <g className="mini-edges" opacity="0.3">
                {visibleEdges.map((edge) => {
                  const source = nodePositions[edge.source];
                  const target = nodePositions[edge.target];
                  if (!source || !target) return null;

                  const color = getNodeColor(edge.source);
                  const startX = source.x + nodeWidth;
                  const startY = source.y + nodeHeight / 2;
                  const endX = target.x - 6;
                  const endY = target.y + nodeHeight / 2;
                  const midX = startX + (endX - startX) * 0.5;

                  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                  return (
                    <path key={edge.id} d={path} fill="none" stroke={color} strokeWidth="3" />
                  );
                })}
              </g>

              {/* Mini-map nodes */}
              <g className="mini-nodes">
                {visibleNodes.map((node) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;

                  const color = getNodeColor(node.id);
                  const isActive = activeNode === node.id;
                  const isInPath = currentPath.includes(node.id);
                  const isPinned = pinnedPathNodes.has(node.id);
                  const isMiniHovered = miniMapHoveredNode === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveNode(node.id);
                        setCurrentPath(getPathToNode(node.id));
                        scrollToNode(node.id);
                      }}
                      onMouseEnter={() => setMiniMapHoveredNode(node.id)}
                      onMouseLeave={() => setMiniMapHoveredNode(null)}
                      className="cursor-pointer"
                    >
                      {/* Glow effect for hovered */}
                      {isMiniHovered && (
                        <rect
                          width={nodeWidth + 8}
                          height={nodeHeight + 8}
                          x="-4"
                          y="-4"
                          rx="8"
                          fill={color}
                          opacity="0.3"
                          className="animate-pulse"
                        />
                      )}

                      {/* Node rectangle */}
                      <rect
                        width={nodeWidth}
                        height={nodeHeight}
                        rx="4"
                        fill={color}
                        stroke={
                          isActive ? "#FBBF24" : isInPath ? "#FB923C" : isPinned ? "#FACC15" : "white"
                        }
                        strokeWidth={isActive ? 4 : isInPath ? 3 : 2}
                        opacity={isMiniHovered ? 1 : 0.9}
                      />

                      {/* Pin indicator */}
                      {isPinned && (
                        <circle cx={nodeWidth - 8} cy={8} r="5" fill="#FACC15" stroke="white" strokeWidth="1" />
                      )}

                      {/* Active indicator */}
                      {isActive && <circle cx={nodeWidth / 2} cy={nodeHeight / 2} r="6" fill="#FBBF24" opacity="0.8" />}

                      {/* Mini tooltip on hover */}
                      {isMiniHovered && (
                        <g>
                          <rect x={nodeWidth + 5} y={-5} width="100" height="30" rx="3" fill="rgba(0, 0, 0, 0.9)" stroke="white" strokeWidth="1" />
                          <text x={nodeWidth + 10} y="10" fill="white" fontSize="10" fontWeight="500" className="pointer-events-none">
                            {node.data?.label || "N/A"}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Viewport indicator - Draggable */}
              {containerRef.current &&
                (() => {
                  const viewport = getViewportRect();

                  return (
                    <g>
                      {/* Semi-transparent overlay outside viewport */}
                      <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="black" opacity="0.1" pointerEvents="none" />
                      <rect x={viewport.x} y={viewport.y} width={viewport.width} height={viewport.height} fill="white" opacity="0.01" pointerEvents="none" />

                      {/* Draggable viewport rectangle */}
                      <rect
                        x={viewport.x}
                        y={viewport.y}
                        width={viewport.width}
                        height={viewport.height}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        strokeDasharray="10 5"
                        opacity="0.8"
                        className={isDraggingViewport ? "cursor-grabbing" : "cursor-grab"}
                        onMouseDown={handleViewportDragStart}
                        style={{ transition: isDraggingViewport ? "none" : "all 0.1s ease" }}
                      />

                      {/* Corner resize indicators */}
                      <circle
                        cx={viewport.x + viewport.width}
                        cy={viewport.y + viewport.height}
                        r="6"
                        fill="#3B82F6"
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.8"
                        pointerEvents="none"
                      />
                    </g>
                  );
                })()}
            </svg>
          </div>

          {/* Mini-map footer with stats and instructions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
            <div className="flex justify-between text-xs text-white mb-0.5">
              <span>Nodes: {visibleNodes.length}</span>
              <span>Zoom: {zoom}%</span>
            </div>
            <div className="text-[10px] text-white/80 text-center">Scroll to zoom • Drag viewport to pan • Click to jump</div>
          </div>
        </div>
      )}

{contextMenu && (
        <div className="fixed z-50 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-300" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          <button className="block px-4 py-2 hover:bg-gray-100 text-sm w-full text-left" onClick={() => { setPinnedPathNodes((prev) => { const next = new Set(prev); if (next.has(contextMenu.nodeId)) { next.delete(contextMenu.nodeId); } else { next.add(contextMenu.nodeId); } return next; }); setContextMenu(null); }}>
            {pinnedPathNodes.has(contextMenu.nodeId) ? "Unpin This Path" : "Pin This Path"}
          </button>
          <div className="border-t border-gray-200"></div>
          <button className="block px-4 py-2 hover:bg-gray-100 text-sm w-full text-left text-orange-600 font-medium" onClick={() => { handleIsolateNode(contextMenu.nodeId); setContextMenu(null); }}>
            {isolatedNodeId === contextMenu.nodeId ? "✓ Un-isolate This Node" : "Isolate This Node"}
          </button>
          <div className="border-t border-gray-200"></div>
          <button className="block px-4 py-2 hover:bg-gray-100 text-sm w-full text-left text-purple-600 font-medium" onClick={() => { handleShowPreviousLayers(contextMenu.nodeId); setContextMenu(null); }}>
            {showPreviousLayersNode === contextMenu.nodeId ? "✓ Hide Previous Layers" : "Open Previous Layers"}
          </button>
          <div className="border-t border-gray-200"></div>
          <button className="block px-4 py-2 hover:bg-gray-100 text-sm w-full text-left text-red-600" onClick={() => setContextMenu(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default FlowDiagramNew;

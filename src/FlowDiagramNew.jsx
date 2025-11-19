import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Search, Layers, ChevronRight, Home } from 'lucide-react';
import graphData from './a.json';

const FlowDiagramNew = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(100);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [activeNode, setActiveNode] = useState(null);
  const [showAllGraph, setShowAllGraph] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const containerRef = useRef(null);

  // Build adjacency maps
  const buildGraph = () => {
    const nodeMap = {};
    const childrenMap = {};
    const parentMap = {};
    const edgeMap = {};

    graphData.nodes.forEach(node => {
      nodeMap[node.id] = node;
      childrenMap[node.id] = [];
      parentMap[node.id] = null;
    });

    graphData.edges.forEach(edge => {
      if (childrenMap[edge.source]) {
        childrenMap[edge.source].push(edge.target);
        edgeMap[`${edge.source}-${edge.target}`] = edge;
      }
      if (parentMap[edge.target] === null) {
        parentMap[edge.target] = edge.source;
      }
    });

    return { nodeMap, childrenMap, parentMap, edgeMap };
  };

  const { nodeMap, childrenMap, parentMap, edgeMap } = buildGraph();

  // Find root node (node with no parent)
  const findRootNode = () => {
    return graphData.nodes.find(node => !parentMap[node.id]);
  };

  const rootNode = findRootNode();

  // Initialize with root node visible
  useEffect(() => {
    if (rootNode && expandedNodes.size === 0 && !showAllGraph) {
      setExpandedNodes(new Set([rootNode.id]));
    }
  }, []);

  // Get path from root to node
  const getPathToNode = (nodeId) => {
    const path = [];
    let current = nodeId;
    
    while (current) {
      path.unshift(current);
      current = parentMap[current];
    }
    
    return path;
  };

  // Get N layers of children from a node
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
        children.forEach(childId => {
          queue.push({ id: childId, depth: depth + 1 });
        });
      }
    }

    return result;
  };

  // Get all descendants of a node
  const getAllDescendants = (nodeId) => {
    const descendants = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift();
      const children = childrenMap[current] || [];
      
      children.forEach(child => {
        if (!descendants.has(child)) {
          descendants.add(child);
          queue.push(child);
        }
      });
    }

    return descendants;
  };

  // Check if node has expanded descendants
  const hasExpandedDescendants = (nodeId) => {
    const children = childrenMap[nodeId] || [];
    return children.some(childId => expandedNodes.has(childId));
  };

  // Handle node click - toggle expansion
  const handleNodeClick = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    
    if (hasExpandedDescendants(nodeId)) {
      // Collapse: remove all descendants
      const descendants = getAllDescendants(nodeId);
      descendants.forEach(id => newExpanded.delete(id));
    } else {
      // Expand: add 3 layers
      const toAdd = getNLayersOfChildren(nodeId, 3);
      toAdd.forEach(id => newExpanded.add(id));
    }

    setExpandedNodes(newExpanded);
    setActiveNode(nodeId);
    setCurrentPath(getPathToNode(nodeId));
  };

  // Add more layers from active node
  const addMoreLayers = () => {
    if (!activeNode) return;
    
    const newExpanded = new Set(expandedNodes);
    
    // Get all currently visible descendants of active node
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
        children.forEach(child => queue.push(child));
      }
    }
    
    // For each leaf node in the visible tree, add 3 more layers
    visibleDescendants.forEach(nodeId => {
      const children = childrenMap[nodeId] || [];
      const hasVisibleChildren = children.some(child => expandedNodes.has(child));
      
      if (!hasVisibleChildren && children.length > 0) {
        const toAdd = getNLayersOfChildren(nodeId, 3);
        toAdd.forEach(id => newExpanded.add(id));
      }
    });
    
    setExpandedNodes(newExpanded);
  };

  // Show entire graph
  const toggleShowAll = () => {
    if (showAllGraph) {
      setExpandedNodes(new Set([rootNode.id]));
      setActiveNode(null);
      setCurrentPath([]);
    } else {
      const allNodes = new Set(graphData.nodes.map(n => n.id));
      setExpandedNodes(allNodes);
      setActiveNode(rootNode?.id);
      setCurrentPath([rootNode?.id]);
    }
    setShowAllGraph(!showAllGraph);
  };

  // Search functionality
  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setExpandedNodes(new Set([rootNode.id]));
      setActiveNode(null);
      setCurrentPath([]);
      return;
    }

    const matchedNode = graphData.nodes.find(n => 
      n.data.label.toLowerCase().includes(term.toLowerCase())
    );

    if (matchedNode) {
      const path = getPathToNode(matchedNode.id);
      const newExpanded = new Set(path);
      
      // Add 3 layers from matched node
      const threeLayers = getNLayersOfChildren(matchedNode.id, 3);
      threeLayers.forEach(id => newExpanded.add(id));
      
      setExpandedNodes(newExpanded);
      setActiveNode(matchedNode.id);
      setCurrentPath(path);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setExpandedNodes(new Set([rootNode.id]));
    setActiveNode(null);
    setCurrentPath([]);
    setSearchTerm('');
    setShowAllGraph(false);
    setZoom(100);
  };

  // Get visible nodes (only nodes in expandedNodes set)
  const visibleNodeIds = Array.from(expandedNodes);
  const visibleNodes = visibleNodeIds.map(id => nodeMap[id]).filter(Boolean);

  // Calculate layer positions (horizontal layout)
  const calculateLayerPositions = () => {
    const layers = {};
    
    // Assign each node to a layer based on distance from root
    visibleNodeIds.forEach(nodeId => {
      const path = getPathToNode(nodeId);
      const layer = path.length - 1;
      
      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(nodeId);
    });

    return layers;
  };

  const nodesByLayer = calculateLayerPositions();

  // Calculate positions
  const layerWidth = 280;
  const nodeHeight = 80;
  const nodeSpacing = 25;

  const nodePositions = {};
  Object.entries(nodesByLayer).forEach(([layer, nodeIds]) => {
    const layerNum = parseInt(layer);
    nodeIds.forEach((nodeId, index) => {
      nodePositions[nodeId] = {
        x: layerNum * layerWidth + 50,
        y: index * (nodeHeight + nodeSpacing) + 50
      };
    });
  });

  // Get visible edges
  const visibleEdges = graphData.edges.filter(edge => 
    expandedNodes.has(edge.source) && expandedNodes.has(edge.target)
  );

  // Generate color based on node depth
  const getNodeColor = (nodeId) => {
    const path = getPathToNode(nodeId);
    const depth = path.length - 1;
    
    const colors = [
      '#8B5CF6', // Purple
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ];
    
    return colors[depth % colors.length];
  };

  // Build path string
  const pathString = currentPath
    .map(id => nodeMap[id]?.data?.label || '')
    .filter(Boolean)
    .join(' ---> ');

  // Calculate canvas size
  const maxLayer = Math.max(...Object.keys(nodesByLayer).map(Number), 0);
  const maxNodesInLayer = Math.max(...Object.values(nodesByLayer).map(arr => arr.length), 1);
  
  const canvasWidth = (maxLayer + 1) * layerWidth + 200;
  const canvasHeight = maxNodesInLayer * (nodeHeight + nodeSpacing) + 150;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🌳 Layered Tree Diagram
          </h1>
          <p className="text-purple-200 text-lg">
            Click nodes to expand/collapse 3 layers • {graphData.nodes.length} total nodes
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-2xl border border-white/20">
          <div className="flex flex-col gap-3">
            {/* Top Row */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              {/* Search */}
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
              
              {/* Zoom Controls */}
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={addMoreLayers}
                disabled={!activeNode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                <Layers className="w-4 h-4" />
                Add More Layers
              </button>

              <button
                onClick={toggleShowAll}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                <Maximize2 className="w-4 h-4" />
                {showAllGraph ? 'Collapse All' : 'Show All Graph'}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm shadow-lg"
              >
                <Home className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Path Display */}
        {currentPath.length > 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-2xl border border-white/20">
            <div className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-purple-300 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-purple-200 mb-1">Current Path:</p>
                <p className="text-white font-mono text-sm break-all leading-relaxed">
                  {pathString}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Diagram Container */}
        <div 
          ref={containerRef}
          className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-auto"
          style={{ height: 'calc(100vh - 420px)' }}
        >
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: '0 0',
              padding: '20px',
              minWidth: canvasWidth,
              minHeight: canvasHeight
            }}
          >
            <svg
              width={canvasWidth}
              height={canvasHeight}
              className="select-none"
            >
              <defs>
                {/* Arrow markers */}
                {Array.from({length: 10}, (_, i) => {
                  const path = Array(i + 1).fill(rootNode?.id);
                  const color = getNodeColor(path[path.length - 1] || rootNode?.id);
                  return (
                    <marker
                      key={`arrow-${i}`}
                      id={`arrowhead-${i}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill={color}
                      />
                    </marker>
                  );
                })}
              </defs>

              {/* Render Edges */}
              <g className="edges">
                {visibleEdges.map(edge => {
                  const source = nodePositions[edge.source];
                  const target = nodePositions[edge.target];
                  
                  if (!source || !target) return null;

                  const color = getNodeColor(edge.source);
                  const isInPath = currentPath.includes(edge.source) && currentPath.includes(edge.target);
                  const sourceDepth = getPathToNode(edge.source).length - 1;

                  // Create smooth curve path
                  const midX = (source.x + target.x) / 2;
                  const controlX1 = source.x + (target.x - source.x) * 0.5;
                  const controlX2 = source.x + (target.x - source.x) * 0.5;
                  
                  const path = `M ${source.x + 200} ${source.y + 35} 
                                C ${controlX1} ${source.y + 35}, 
                                  ${controlX2} ${target.y + 35}, 
                                  ${target.x} ${target.y + 35}`;

                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth={isInPath ? 4 : 2}
                        opacity={isInPath ? 1 : 0.6}
                        markerEnd={`url(#arrowhead-${sourceDepth})`}
                        className={edge.animated && isInPath ? 'animate-pulse' : ''}
                      />
                      {/* Edge type label */}
                      <text
                        x={(source.x + target.x) / 2 + 100}
                        y={(source.y + target.y) / 2 + 20}
                        fill="#9CA3AF"
                        fontSize="10"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        {edge.type}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Render Nodes */}
              <g className="nodes">
                {visibleNodes.map(node => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;

                  const color = getNodeColor(node.id);
                  const isActive = activeNode === node.id;
                  const isInPath = currentPath.includes(node.id);
                  const hasChildren = (childrenMap[node.id] || []).length > 0;
                  const isExpanded = hasExpandedDescendants(node.id);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => handleNodeClick(node.id)}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      {/* Glow for active/path nodes */}
                      {(isActive || isInPath) && (
                        <rect
                          x="-5"
                          y="-5"
                          width="210"
                          height="80"
                          rx="15"
                          fill={color}
                          opacity="0.3"
                          className="animate-pulse"
                        />
                      )}

                      {/* Node Rectangle */}
                      <rect
                        x="0"
                        y="0"
                        width="200"
                        height="70"
                        rx="12"
                        fill={color}
                        stroke={isInPath ? '#FBBF24' : 'white'}
                        strokeWidth={isInPath ? 3 : 2}
                        className="transition-all duration-200 drop-shadow-lg"
                      />

                      {/* Node Label */}
                      <text
                        x="100"
                        y="30"
                        fill="white"
                        fontSize="13"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                      >
                        {node.data.label.length > 18 
                          ? node.data.label.substring(0, 16) + '...' 
                          : node.data.label}
                      </text>

                      {/* Type badge */}
                      <text
                        x="100"
                        y="50"
                        fill="white"
                        fontSize="10"
                        opacity="0.8"
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                      >
                        {node.type || 'N/A'}
                      </text>

                      {/* Expand/Collapse Indicator */}
                      {hasChildren && (
                        <g transform="translate(175, 30)">
                          <circle
                            r="12"
                            fill="white"
                            opacity="0.95"
                            className="drop-shadow"
                          />
                          <text
                            x="0"
                            y="5"
                            fill={color}
                            fontSize="16"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none"
                          >
                            {isExpanded ? '−' : '+'}
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

        {/* Stats */}
        <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-300">{graphData.nodes.length}</div>
              <div className="text-sm text-white">Total Nodes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-300">{graphData.edges.length}</div>
              <div className="text-sm text-white">Total Edges</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-300">{expandedNodes.size}</div>
              <div className="text-sm text-white">Visible Nodes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300">{Object.keys(nodesByLayer).length}</div>
              <div className="text-sm text-white">Active Layers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowDiagramNew;
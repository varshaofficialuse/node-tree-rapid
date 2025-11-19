import React, { useState, useEffect, useMemo } from 'react';
import { Search, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronRight, Minimize2 } from 'lucide-react';
import graphData from "./structured_graphData.json";

const NodeTreeMain = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [highlightedPath, setHighlightedPath] = useState(new Set());

  // Your data
//   const graphData = {
//     edges: [
//       { animated: true, id: "883ee45d-5033-4c82-b488-1db9c79c83ca-853925f3-f6d0-4cab-99f1-a3d39308c3ee", source: "883ee45d-5033-4c82-b488-1db9c79c83ca", target: "853925f3-f6d0-4cab-99f1-a3d39308c3ee", type: "smoothstep" },
//       { animated: true, id: "853925f3-f6d0-4cab-99f1-a3d39308c3ee-422d5009-5be6-4624-8552-f4140d8c1bdf", source: "853925f3-f6d0-4cab-99f1-a3d39308c3ee", target: "422d5009-5be6-4624-8552-f4140d8c1bdf", type: "smoothstep" },
//       { animated: true, id: "422d5009-5be6-4624-8552-f4140d8c1bdf-9550f70c-7698-4c33-93d9-df5e7ac7a6c9", source: "422d5009-5be6-4624-8552-f4140d8c1bdf", target: "9550f70c-7698-4c33-93d9-df5e7ac7a6c9", type: "smoothstep" },
//       { animated: true, id: "422d5009-5be6-4624-8552-f4140d8c1bdf-87e157d5-4e1b-4fa1-b70b-a7fe8088f872", source: "422d5009-5be6-4624-8552-f4140d8c1bdf", target: "87e157d5-4e1b-4fa1-b70b-a7fe8088f872", type: "smoothstep" },
//       { animated: true, id: "883ee45d-5033-4c82-b488-1db9c79c83ca-079e7f1d-a4dd-4764-8dcb-564d07d0c442", source: "883ee45d-5033-4c82-b488-1db9c79c83ca", target: "079e7f1d-a4dd-4764-8dcb-564d07d0c442", type: "smoothstep" },
//       { animated: true, id: "079e7f1d-a4dd-4764-8dcb-564d07d0c442-8d801afd-1d53-405a-964d-11cf3012e18f", source: "079e7f1d-a4dd-4764-8dcb-564d07d0c442", target: "8d801afd-1d53-405a-964d-11cf3012e18f", type: "smoothstep" },
//       { animated: true, id: "8d801afd-1d53-405a-964d-11cf3012e18f-17717f12-7ba6-40ce-a513-062d6179c031", source: "8d801afd-1d53-405a-964d-11cf3012e18f", target: "17717f12-7ba6-40ce-a513-062d6179c031", type: "smoothstep" },
//       { animated: true, id: "17717f12-7ba6-40ce-a513-062d6179c031-f751b1e4-b3e4-4d00-a37b-e5ebf3726655", source: "17717f12-7ba6-40ce-a513-062d6179c031", target: "f751b1e4-b3e4-4d00-a37b-e5ebf3726655", type: "smoothstep" },
//       { animated: true, id: "f751b1e4-b3e4-4d00-a37b-e5ebf3726655-a0669100-1ec2-45ba-81cb-3e1772fe3758", source: "f751b1e4-b3e4-4d00-a37b-e5ebf3726655", target: "a0669100-1ec2-45ba-81cb-3e1772fe3758", type: "smoothstep" }
//     ],
//     nodes: [
//       { data: { label: "M456HI" }, id: "883ee45d-5033-4c82-b488-1db9c79c83ca", type: "default" },
//       { data: { label: "DECLARATIVES" }, id: "853925f3-f6d0-4cab-99f1-a3d39308c3ee", type: "default" },
//       { data: { label: "A05-CONTROL" }, id: "079e7f1d-a4dd-4764-8dcb-564d07d0c442", type: "default" },
//       { data: { label: "A05-05" }, id: "8d801afd-1d53-405a-964d-11cf3012e18f", type: "default" },
//       { data: { label: "DISC-ERRORS" }, id: "422d5009-5be6-4624-8552-f4140d8c1bdf", type: "default" },
//       { data: { label: "B05-INIT" }, id: "17717f12-7ba6-40ce-a513-062d6179c031", type: "default" },
//       { data: { label: "DISC-ERRORS-EXIT" }, id: "9550f70c-7698-4c33-93d9-df5e7ac7a6c9", type: "default" },
//       { data: { label: "SAVE-STATUS-FOR-RETURN" }, id: "87e157d5-4e1b-4fa1-b70b-a7fe8088f872", type: "default" },
//       { data: { label: "B05-05" }, id: "f751b1e4-b3e4-4d00-a37b-e5ebf3726655", type: "default" },
//       { data: { label: "CC07-DISPLAY-MASK" }, id: "a0669100-1ec2-45ba-81cb-3e1772fe3758", type: "default" }
//     ]
//   };

  // Build hierarchy
  const buildHierarchy = () => {
    const nodeMap = new Map(graphData.nodes.map(n => [n.id, { ...n, children: [], parents: [] }]));
    const childrenMap = new Map();
    
    graphData.edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source).push(edge.target);
      
      const targetNode = nodeMap.get(edge.target);
      if (targetNode) {
        targetNode.parents.push(edge.source);
      }
    });

    childrenMap.forEach((children, parentId) => {
      const parent = nodeMap.get(parentId);
      if (parent) {
        parent.children = children.map(childId => nodeMap.get(childId)).filter(Boolean);
      }
    });

    const roots = Array.from(nodeMap.values()).filter(n => n.parents.length === 0);
    return { roots, nodeMap };
  };

  const { roots, nodeMap } = useMemo(() => buildHierarchy(), []);

  // Find path from root to node
  const findPathToNode = (targetId) => {
    const paths = new Set();
    
    const traverse = (nodeId, currentPath = []) => {
      currentPath.push(nodeId);
      
      if (nodeId === targetId) {
        currentPath.forEach(id => paths.add(id));
        return true;
      }
      
      const node = nodeMap.get(nodeId);
      if (node?.children) {
        for (const child of node.children) {
          if (traverse(child.id, [...currentPath])) {
            currentPath.forEach(id => paths.add(id));
          }
        }
      }
      
      return false;
    };
    
    roots.forEach(root => traverse(root.id));
    return paths;
  };

  // Search filtering with path highlighting
  const filteredNodes = useMemo(() => {
    if (!searchTerm) {
      setHighlightedPath(new Set());
      return new Set(graphData.nodes.map(n => n.id));
    }
    
    const term = searchTerm.toLowerCase();
    const matching = new Set();
    const pathNodes = new Set();
    
    graphData.nodes.forEach(node => {
      if (node.data.label.toLowerCase().includes(term)) {
        matching.add(node.id);
        const path = findPathToNode(node.id);
        path.forEach(id => pathNodes.add(id));
      }
    });
    
    setHighlightedPath(pathNodes);
    return pathNodes.size > 0 ? pathNodes : new Set(graphData.nodes.map(n => n.id));
  }, [searchTerm, nodeMap, roots]);

  const toggleNodeCollapse = (nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Calculate visible nodes considering collapsed state
  const getVisibleNodes = (node, visited = new Set()) => {
    if (visited.has(node.id)) return [];
    visited.add(node.id);
    
    const visible = [node];
    
    if (!collapsedNodes.has(node.id) && node.children) {
      node.children.forEach(child => {
        visible.push(...getVisibleNodes(child, visited));
      });
    }
    
    return visible;
  };

  const visibleNodes = useMemo(() => {
    const visible = [];
    roots.forEach(root => {
      visible.push(...getVisibleNodes(root));
    });
    return visible;
  }, [roots, collapsedNodes]);

  // Calculate node position with proper spacing to avoid overlaps
  const calculateLayout = (node, level = 0, leftBoundary = 0, visited = new Set()) => {
    if (visited.has(node.id)) return { positions: {}, width: 0, rightBoundary: leftBoundary };
    visited.add(node.id);
    
    const positions = {};
    const nodeWidth = 200; // Width needed per node including spacing
    const levelHeight = 160;
    
    if (!collapsedNodes.has(node.id) && node.children && node.children.length > 0) {
      // Calculate total width needed for all children
      let currentX = leftBoundary;
      const childPositions = [];
      
      node.children.forEach((child) => {
        const childLayout = calculateLayout(child, level + 1, currentX, visited);
        Object.assign(positions, childLayout.positions);
        childPositions.push({
          left: currentX,
          right: childLayout.rightBoundary,
          center: (currentX + childLayout.rightBoundary) / 2
        });
        currentX = childLayout.rightBoundary;
      });
      
      // Position parent at center of children
      const leftMost = childPositions[0].left;
      const rightMost = childPositions[childPositions.length - 1].right;
      const parentX = (leftMost + rightMost) / 2;
      
      positions[node.id] = {
        x: parentX,
        y: level * levelHeight,
        level
      };
      
      return { 
        positions, 
        width: rightMost - leftBoundary,
        rightBoundary: rightMost
      };
    } else {
      // Leaf node or collapsed node
      positions[node.id] = {
        x: leftBoundary + nodeWidth / 2,
        y: level * levelHeight,
        level
      };
      
      return { 
        positions, 
        width: nodeWidth,
        rightBoundary: leftBoundary + nodeWidth
      };
    }
  };

  const allPositions = useMemo(() => {
    const combined = {};
    let currentX = 0;
    
    roots.forEach((root) => {
      const layout = calculateLayout(root, 0, currentX);
      Object.assign(combined, layout.positions);
      currentX = layout.rightBoundary + 400; // Space between different root trees
    });
    
    return combined;
  }, [roots, collapsedNodes]);

  // Render node
  const renderNode = (node) => {
    const isFiltered = !filteredNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightedPath.has(node.id);
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const position = allPositions[node.id];
    
    if (!position) return null;

    const nodeColor = isHighlighted 
      ? 'url(#highlightGradient)' 
      : isSelected 
        ? 'url(#selectedGradient)' 
        : 'url(#normalGradient)';

    return (
      <g
        key={node.id}
        transform={`translate(${position.x}, ${position.y})`}
        className="cursor-pointer transition-all duration-300"
        style={{ opacity: isFiltered ? 0.15 : 1 }}
      >
        {/* Glow effect for highlighted nodes */}
        {isHighlighted && (
          <circle
            cx="0"
            cy="0"
            r="90"
            fill="url(#glowGradient)"
            opacity="0.4"
            className="animate-pulse"
          />
        )}
        
        {/* Main node */}
        <rect
          x="-80"
          y="-30"
          width="160"
          height="60"
          rx="12"
          fill={nodeColor}
          stroke={isHighlighted ? '#10b981' : isSelected ? '#3b82f6' : '#374151'}
          strokeWidth={isHighlighted ? '3' : '2'}
          className="transition-all duration-300 hover:stroke-blue-400"
          onClick={() => setSelectedNode(node)}
          style={{
            filter: isHighlighted ? 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))' : 
                    isSelected ? 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))' :
                    'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
          }}
        />
        
        {/* Node label */}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="600"
          className="pointer-events-none select-none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          {node.data.label.length > 18 
            ? node.data.label.substring(0, 16) + '...' 
            : node.data.label}
        </text>
        
        {/* Collapse/Expand button */}
        {hasChildren && (
          <g
            onClick={(e) => {
              e.stopPropagation();
              toggleNodeCollapse(node.id);
            }}
            className="cursor-pointer"
          >
            <circle
              cx="0"
              cy="40"
              r="14"
              fill="#1f2937"
              stroke={isHighlighted ? '#10b981' : '#4b5563'}
              strokeWidth="2"
              className="transition-all duration-200 hover:fill-gray-700"
            />
            {isCollapsed ? (
              <path
                d="M -4 40 L 4 40 M 0 36 L 0 44"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M -4 40 L 4 40"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </g>
        )}
        
        {/* Children count badge */}
        {hasChildren && (
          <g transform="translate(70, -30)">
            <circle
              cx="0"
              cy="0"
              r="12"
              fill={isHighlighted ? '#10b981' : '#3b82f6'}
              className="transition-colors duration-300"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="700"
              className="pointer-events-none"
            >
              {node.children.length}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Render edge
  const renderEdge = (edge) => {
    const sourcePos = allPositions[edge.source];
    const targetPos = allPositions[edge.target];
    
    if (!sourcePos || !targetPos) return null;
    
    // Don't render edge if source is collapsed
    const sourceNode = nodeMap.get(edge.source);
    if (collapsedNodes.has(edge.source)) return null;

    const isFiltered = !filteredNodes.has(edge.source) && !filteredNodes.has(edge.target);
    const isHighlighted = highlightedPath.has(edge.source) && highlightedPath.has(edge.target);
    const isHovered = hoveredEdge === edge.id;

    const x1 = sourcePos.x;
    const y1 = sourcePos.y + 30;
    const x2 = targetPos.x;
    const y2 = targetPos.y - 30;
    
    const midY = (y1 + y2) / 2;
    
    return (
      <g 
        key={edge.id}
        onMouseEnter={() => setHoveredEdge(edge.id)}
        onMouseLeave={() => setHoveredEdge(null)}
        style={{ opacity: isFiltered ? 0.08 : 1 }}
        className="transition-opacity duration-300"
      >
        {/* Animated gradient line for highlighted paths */}
        {isHighlighted && (
          <>
            <path
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              stroke="url(#lineGradient)"
              strokeWidth="4"
              fill="none"
              opacity="0.6"
              className="animate-pulse"
            />
            <path
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              stroke="#10b981"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8 4"
              className="edge-flow"
            />
          </>
        )}
        
        {/* Main edge */}
        <path
          d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
          stroke={isHighlighted ? '#10b981' : isHovered ? '#60a5fa' : '#4b5563'}
          strokeWidth={isHighlighted ? 3 : isHovered ? 3 : 2}
          fill="none"
          className="transition-all duration-300"
          style={{
            filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' : 'none'
          }}
        />
        
        {/* Arrow */}
        <polygon
          points={`${x2},${y2} ${x2-6},${y2-12} ${x2+6},${y2-12}`}
          fill={isHighlighted ? '#10b981' : isHovered ? '#60a5fa' : '#4b5563'}
          className="transition-all duration-300"
        />
        
        {/* Edge label on hover */}
        {isHovered && (
          <g>
            <rect
              x={(x1 + x2) / 2 - 40}
              y={midY - 24}
              width="80"
              height="24"
              rx="6"
              fill="rgba(31, 41, 55, 0.95)"
              stroke="#60a5fa"
              strokeWidth="1"
            />
            <text
              x={(x1 + x2) / 2}
              y={midY - 9}
              textAnchor="middle"
              fill="#60a5fa"
              fontSize="11"
              fontWeight="600"
              className="pointer-events-none"
            >
              {edge.type}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderTree = (node, visited = new Set()) => {
    if (visited.has(node.id)) return null;
    visited.add(node.id);
    
    return (
      <React.Fragment key={node.id}>
        {renderNode(node)}
        {!collapsedNodes.has(node.id) && node.children?.map(child => renderTree(child, visited))}
      </React.Fragment>
    );
  };

  const viewBox = useMemo(() => {
    const positions = Object.values(allPositions);
    if (positions.length === 0) return '0 0 1000 800';
    
    const minX = Math.min(...positions.map(p => p.x)) - 150;
    const maxX = Math.max(...positions.map(p => p.x)) + 150;
    const minY = Math.min(...positions.map(p => p.y)) - 80;
    const maxY = Math.max(...positions.map(p => p.y)) + 80;
    
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [allPositions]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col overflow-hidden">
      <style>{`
        @keyframes edge-flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -24; }
        }
        .edge-flow {
          animation: edge-flow 1.5s linear infinite;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-b border-gray-700/50 p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl opacity-20 blur group-focus-within:opacity-30 transition-opacity"></div>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors z-10" />
              <input
                type="text"
                placeholder="Search nodes to highlight path from root..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="relative w-full pl-12 pr-4 py-3 bg-gray-800/50 text-white rounded-xl border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-gray-500 backdrop-blur-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-gray-700/50">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
              className="p-2.5 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
              className="p-2.5 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2.5 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              title="Reset Zoom"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <div className="text-white text-sm font-semibold ml-2 px-3 py-1 bg-gray-900/50 rounded-lg min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </div>
          </div>
        </div>
        
        {highlightedPath.size > 0 && searchTerm && (
          <div className="max-w-7xl mx-auto mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-sm font-medium">
              ✨ Highlighting {highlightedPath.size} node{highlightedPath.size !== 1 ? 's' : ''} in path
            </p>
          </div>
        )}
      </div>

      {/* Graph Area */}
      <div className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-gray-900/10 to-transparent"></div>
        <svg 
          width="100%" 
          height="100%" 
          viewBox={viewBox}
          className="transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="normalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            
            <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            
            <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
            
            <radialGradient id="glowGradient">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Render edges first (background) */}
          {graphData.edges.map(edge => renderEdge(edge))}
          
          {/* Render nodes (foreground) */}
          {roots.map(root => renderTree(root))}
        </svg>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-t border-gray-700/50 p-6 shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <h3 className="text-white font-bold text-xl">
                    {selectedNode.data.label}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm mb-4 font-mono bg-gray-800/50 px-3 py-2 rounded-lg inline-block">
                  {selectedNode.id}
                </p>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-lg border border-purple-500/30">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-300 font-medium">Parents:</span>
                    <span className="text-purple-400 font-bold">{selectedNode.parents?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/30">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-300 font-medium">Children:</span>
                    <span className="text-emerald-400 font-bold">{selectedNode.children?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/30">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300 font-medium">Level:</span>
                    <span className="text-blue-400 font-bold">{allPositions[selectedNode.id]?.level || 0}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Bar */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-800/50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">Total Nodes:</span>
              <span className="text-white font-semibold">{graphData.nodes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-400">Visible:</span>
              <span className="text-white font-semibold">{visibleNodes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-400">Connections:</span>
              <span className="text-white font-semibold">{graphData.edges.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>Click nodes to select • Hover edges for details • Click ±/− to collapse</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeTreeMain;
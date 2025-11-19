import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Search, Move } from 'lucide-react';
import graphData from './structured_graphData.json';

const COLORS = {
  node: {
    default: '#3B82F6',
    highlighted: '#10B981',
    search: '#F59E0B',
    hover: '#8B5CF6'
  },
  edge: {
    default: '#6366F1',
    highlighted: '#10B981',
    smoothstep: '#EC4899',
    animated: '#F97316'
  }
};

const FlowDiagram = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Calculate node positions using hierarchical layout
  const layoutNodes = () => {
    const nodeMap = {};
    const levels = {};
    const visited = new Set();
    
    // Create node map
    graphData.nodes.forEach(node => {
      nodeMap[node.id] = { ...node, children: [], parents: [] };
    });

    // Build parent-child relationships
    graphData.edges.forEach(edge => {
      if (nodeMap[edge.source] && nodeMap[edge.target]) {
        nodeMap[edge.source].children.push(edge.target);
        nodeMap[edge.target].parents.push(edge.source);
      }
    });

    // Find root nodes (nodes with no parents)
    const roots = graphData.nodes.filter(node => 
      nodeMap[node.id].parents.length === 0
    );

    // BFS to assign levels
    const queue = roots.map(node => ({ id: node.id, level: 0 }));
    
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      
      if (visited.has(id)) continue;
      visited.add(id);
      
      if (!levels[level]) levels[level] = [];
      levels[level].push(id);
      
      nodeMap[id].children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    // Position nodes
    const positioned = {};
    const levelHeight = 150;
    const nodeSpacing = 200;
    
    Object.keys(levels).forEach(level => {
      const levelNodes = levels[level];
      const levelWidth = levelNodes.length * nodeSpacing;
      
      levelNodes.forEach((nodeId, index) => {
        positioned[nodeId] = {
          x: (index * nodeSpacing) - (levelWidth / 2) + (nodeSpacing / 2),
          y: parseInt(level) * levelHeight,
          ...nodeMap[nodeId]
        };
      });
    });

    return positioned;
  };

  const positionedNodes = layoutNodes();

  // Calculate SVG bounds
  const bounds = Object.values(positionedNodes).reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.x),
      maxX: Math.max(acc.maxX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxY: Math.max(acc.maxY, node.y)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  const padding = 100;
  const svgWidth = bounds.maxX - bounds.minX + padding * 2;
  const svgHeight = bounds.maxY - bounds.minY + padding * 2;
  const offsetX = -bounds.minX + padding;
  const offsetY = -bounds.minY + padding;

  // Search filtering
  const matchesSearch = (node) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return node.data?.label?.toLowerCase().includes(term) || node.id.toLowerCase().includes(term);
  };

  const highlightedNodes = new Set(
    graphData.nodes.filter(matchesSearch).map(n => n.id)
  );

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, dragStart]);

  // Center on node
  const centerOnNode = (nodeId) => {
    const node = positionedNodes[nodeId];
    if (node && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const scale = zoom / 100;
      
      setPan({
        x: containerRect.width / 2 - (node.x + offsetX) * scale,
        y: containerRect.height / 2 - (node.y + offsetY) * scale
      });
    }
  };

  // Draw arrow marker
  const renderArrowMarker = () => (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon
          points="0 0, 10 3, 0 6"
          fill={COLORS.edge.default}
        />
      </marker>
      <marker
        id="arrowhead-highlighted"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon
          points="0 0, 10 3, 0 6"
          fill={COLORS.edge.highlighted}
        />
      </marker>
    </defs>
  );

  // Calculate edge path
  const getEdgePath = (edge) => {
    const source = positionedNodes[edge.source];
    const target = positionedNodes[edge.target];
    
    if (!source || !target) return '';

    const x1 = source.x + offsetX;
    const y1 = source.y + offsetY + 30; // Bottom of source node
    const x2 = target.x + offsetX;
    const y2 = target.y + offsetY - 30; // Top of target node

    if (edge.type === 'smoothstep') {
      const midY = (y1 + y2) / 2;
      return `M ${x1},${y1} L ${x1},${midY} L ${x2},${midY} L ${x2},${y2}`;
    }
    
    return `M ${x1},${y1} L ${x2},${y2}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🔄 COBOL Program Flow Diagram
          </h1>
          <p className="text-blue-200 text-lg">
            Interactive visualization of program structure - {graphData.nodes.length} nodes, {graphData.edges.length} edges
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-2xl border border-white/20">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search nodes by label or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              
              <span className="px-3 py-1 text-sm font-bold text-white min-w-[3.5rem] text-center">
                {zoom}%
              </span>
              
              <button
                onClick={() => setZoom(Math.min(400, zoom + 25))}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
              
              <button
                onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }}
                className="ml-2 p-2 hover:bg-white/20 rounded transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-white text-sm">
              <Move className="w-4 h-4" />
              <span>Drag to pan</span>
            </div>
          </div>
        </div>

        {/* Diagram Container */}
        <div 
          ref={containerRef}
          className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden relative"
          style={{ height: 'calc(100vh - 280px)', cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.3s ease-out',
              width: svgWidth,
              height: svgHeight
            }}
          >
            <svg
              ref={svgRef}
              width={svgWidth}
              height={svgHeight}
              className="select-none"
            >
              {renderArrowMarker()}
              
              {/* Render Edges */}
              <g className="edges">
                {graphData.edges.map((edge) => {
                  const isHighlighted = 
                    highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target);
                  const isSelected = 
                    selectedNode === edge.source || selectedNode === edge.target;
                  
                  return (
                    <g key={edge.id}>
                      <path
                        d={getEdgePath(edge)}
                        stroke={isHighlighted || isSelected ? COLORS.edge.highlighted : COLORS.edge.default}
                        strokeWidth={isSelected ? 3 : 2}
                        fill="none"
                        opacity={searchTerm && !isHighlighted ? 0.2 : 0.6}
                        markerEnd={`url(#${isHighlighted || isSelected ? 'arrowhead-highlighted' : 'arrowhead'})`}
                        className={edge.animated ? 'animate-pulse' : ''}
                      />
                      {/* Edge type label */}
                      {edge.type && isSelected && (
                        <text
                          x={(positionedNodes[edge.source]?.x + positionedNodes[edge.target]?.x) / 2 + offsetX}
                          y={(positionedNodes[edge.source]?.y + positionedNodes[edge.target]?.y) / 2 + offsetY}
                          fill={COLORS.edge.highlighted}
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {edge.type}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Render Nodes */}
              <g className="nodes">
                {graphData.nodes.map((node) => {
                  const positioned = positionedNodes[node.id];
                  if (!positioned) return null;

                  const isHighlighted = highlightedNodes.has(node.id);
                  const isSelected = selectedNode === node.id;
                  const isHovered = hoveredNode === node.id;
                  
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${positioned.x + offsetX}, ${positioned.y + offsetY})`}
                      onClick={() => {
                        setSelectedNode(isSelected ? null : node.id);
                        centerOnNode(node.id);
                      }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="cursor-pointer"
                      style={{ opacity: searchTerm && !isHighlighted ? 0.3 : 1 }}
                    >
                      {/* Node glow */}
                      {(isSelected || isHovered) && (
                        <circle
                          cx="0"
                          cy="0"
                          r="35"
                          fill={isSelected ? COLORS.node.highlighted : COLORS.node.hover}
                          opacity="0.3"
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Node circle */}
                      <circle
                        cx="0"
                        cy="0"
                        r="25"
                        fill={isSelected ? COLORS.node.highlighted : isHighlighted ? COLORS.node.search : COLORS.node.default}
                        stroke="white"
                        strokeWidth={isSelected ? 3 : 2}
                        className="transition-all duration-200"
                      />
                      
                      {/* Node label */}
                      <text
                        y="5"
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                      >
                        {node.data?.label || node.id}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Legend & Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-2">📊 Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.node.default }} />
                <span className="text-white">Default Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.node.highlighted }} />
                <span className="text-white">Selected/Highlighted Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5" style={{ backgroundColor: COLORS.edge.default }} />
                <span className="text-white">Edge with arrow</span>
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-2">🎯 Selected Node</h3>
              <div className="text-sm text-white space-y-1">
                <p><strong>ID:</strong> {selectedNode}</p>
                <p><strong>Label:</strong> {positionedNodes[selectedNode]?.data?.label || 'N/A'}</p>
                <p><strong>Children:</strong> {positionedNodes[selectedNode]?.children.length || 0}</p>
                <p><strong>Parents:</strong> {positionedNodes[selectedNode]?.parents.length || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-blue-200 text-sm space-y-1">
          <p>💡 Click a node to select and center on it • Drag to pan • Scroll/buttons to zoom</p>
          <p>🔍 Search highlights matching nodes • Arrows show program flow direction</p>
        </div>
      </div>
    </div>
  );
};

export default FlowDiagram;
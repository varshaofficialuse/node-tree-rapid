import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';

// Deep nested anatomical data structure
const anatomyData = {
  id: 'root',
  name: 'Human Body',
  type: 'organism',
  children: [
    {
      id: 'circulatory',
      name: 'Circulatory System',
      type: 'system',
      children: [
        {
          id: 'heart',
          name: 'Heart',
          type: 'organ',
          children: [
            {
              id: 'right-atrium',
              name: 'Right Atrium',
              type: 'chamber',
              children: [
                {
                  id: 'ra-endocardium',
                  name: 'Endocardium',
                  type: 'tissue',
                  children: [
                    {
                      id: 'ra-endothelial',
                      name: 'Endothelial Cells',
                      type: 'cells',
                      children: [
                        { id: 'ra-nucleus', name: 'Nucleus', type: 'organelle', children: [
                          { id: 'ra-chromatin', name: 'Chromatin', type: 'structure', children: [
                            { id: 'ra-dna', name: 'DNA Strands', type: 'molecule' }
                          ]}
                        ]},
                        { id: 'ra-mitochondria', name: 'Mitochondria', type: 'organelle', children: [
                          { id: 'ra-cristae', name: 'Cristae', type: 'structure' }
                        ]}
                      ]
                    }
                  ]
                },
                {
                  id: 'ra-myocardium',
                  name: 'Myocardium',
                  type: 'tissue',
                  children: [
                    { id: 'ra-cardiac-muscle', name: 'Cardiac Muscle Cells', type: 'cells' }
                  ]
                }
              ]
            },
            {
              id: 'left-atrium',
              name: 'Left Atrium',
              type: 'chamber',
              children: [
                { id: 'la-endocardium', name: 'Endocardium', type: 'tissue' },
                { id: 'la-myocardium', name: 'Myocardium', type: 'tissue' }
              ]
            },
            {
              id: 'right-ventricle',
              name: 'Right Ventricle',
              type: 'chamber',
              children: [
                { id: 'rv-wall', name: 'Ventricular Wall', type: 'tissue' }
              ]
            },
            {
              id: 'left-ventricle',
              name: 'Left Ventricle',
              type: 'chamber',
              children: [
                { id: 'lv-wall', name: 'Ventricular Wall', type: 'tissue' }
              ]
            }
          ]
        },
        {
          id: 'blood-vessels',
          name: 'Blood Vessels',
          type: 'organ-group',
          children: [
            {
              id: 'arteries',
              name: 'Arteries',
              type: 'vessel-type',
              children: [
                {
                  id: 'aorta',
                  name: 'Aorta',
                  type: 'vessel',
                  children: [
                    { id: 'aorta-tunica-intima', name: 'Tunica Intima', type: 'layer' },
                    { id: 'aorta-tunica-media', name: 'Tunica Media', type: 'layer' },
                    { id: 'aorta-tunica-externa', name: 'Tunica Externa', type: 'layer' }
                  ]
                },
                { id: 'carotid', name: 'Carotid Artery', type: 'vessel' }
              ]
            },
            {
              id: 'veins',
              name: 'Veins',
              type: 'vessel-type',
              children: [
                { id: 'superior-vena-cava', name: 'Superior Vena Cava', type: 'vessel' },
                { id: 'inferior-vena-cava', name: 'Inferior Vena Cava', type: 'vessel' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'nervous',
      name: 'Nervous System',
      type: 'system',
      children: [
        {
          id: 'brain',
          name: 'Brain',
          type: 'organ',
          children: [
            {
              id: 'cerebrum',
              name: 'Cerebrum',
              type: 'region',
              children: [
                {
                  id: 'frontal-lobe',
                  name: 'Frontal Lobe',
                  type: 'lobe',
                  children: [
                    {
                      id: 'prefrontal-cortex',
                      name: 'Prefrontal Cortex',
                      type: 'area',
                      children: [
                        {
                          id: 'cortical-layers',
                          name: 'Cortical Layers',
                          type: 'structure',
                          children: [
                            { id: 'layer-1', name: 'Molecular Layer', type: 'layer' },
                            { id: 'layer-2', name: 'External Granular Layer', type: 'layer', children: [
                              { id: 'pyramidal-neurons', name: 'Pyramidal Neurons', type: 'cells', children: [
                                { id: 'dendrites', name: 'Dendrites', type: 'structure', children: [
                                  { id: 'dendritic-spines', name: 'Dendritic Spines', type: 'structure', children: [
                                    { id: 'synapses', name: 'Synapses', type: 'junction', children: [
                                      { id: 'neurotransmitter-vesicles', name: 'Neurotransmitter Vesicles', type: 'organelle' }
                                    ]}
                                  ]}
                                ]},
                                { id: 'axon', name: 'Axon', type: 'structure', children: [
                                  { id: 'myelin-sheath', name: 'Myelin Sheath', type: 'coating' }
                                ]}
                              ]}
                            ]}
                          ]
                        }
                      ]
                    }
                  ]
                },
                { id: 'parietal-lobe', name: 'Parietal Lobe', type: 'lobe' },
                { id: 'temporal-lobe', name: 'Temporal Lobe', type: 'lobe' }
              ]
            },
            {
              id: 'cerebellum',
              name: 'Cerebellum',
              type: 'region',
              children: [
                { id: 'cerebellar-cortex', name: 'Cerebellar Cortex', type: 'layer' }
              ]
            }
          ]
        },
        {
          id: 'spinal-cord',
          name: 'Spinal Cord',
          type: 'organ',
          children: [
            { id: 'cervical', name: 'Cervical Region', type: 'region' },
            { id: 'thoracic', name: 'Thoracic Region', type: 'region' }
          ]
        }
      ]
    },
    {
      id: 'respiratory',
      name: 'Respiratory System',
      type: 'system',
      children: [
        {
          id: 'lungs',
          name: 'Lungs',
          type: 'organ',
          children: [
            {
              id: 'right-lung',
              name: 'Right Lung',
              type: 'organ-part',
              children: [
                {
                  id: 'rl-superior',
                  name: 'Superior Lobe',
                  type: 'lobe',
                  children: [
                    {
                      id: 'rl-bronchi',
                      name: 'Bronchi',
                      type: 'airway',
                      children: [
                        {
                          id: 'rl-bronchioles',
                          name: 'Bronchioles',
                          type: 'airway',
                          children: [
                            {
                              id: 'rl-alveoli',
                              name: 'Alveoli',
                              type: 'structure',
                              children: [
                                {
                                  id: 'rl-pneumocytes',
                                  name: 'Pneumocytes',
                                  type: 'cells'
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                { id: 'rl-middle', name: 'Middle Lobe', type: 'lobe' }
              ]
            },
            {
              id: 'left-lung',
              name: 'Left Lung',
              type: 'organ-part',
              children: [
                { id: 'll-superior', name: 'Superior Lobe', type: 'lobe' },
                { id: 'll-inferior', name: 'Inferior Lobe', type: 'lobe' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'digestive',
      name: 'Digestive System',
      type: 'system',
      children: [
        {
          id: 'stomach',
          name: 'Stomach',
          type: 'organ',
          children: [
            {
              id: 'stomach-layers',
              name: 'Layers',
              type: 'structure',
              children: [
                { id: 'mucosa', name: 'Mucosa', type: 'layer', children: [
                  { id: 'gastric-glands', name: 'Gastric Glands', type: 'glands', children: [
                    { id: 'parietal-cells', name: 'Parietal Cells', type: 'cells' },
                    { id: 'chief-cells', name: 'Chief Cells', type: 'cells' }
                  ]}
                ]},
                { id: 'submucosa', name: 'Submucosa', type: 'layer' }
              ]
            }
          ]
        },
        {
          id: 'intestines',
          name: 'Intestines',
          type: 'organ-group',
          children: [
            {
              id: 'small-intestine',
              name: 'Small Intestine',
              type: 'organ',
              children: [
                { id: 'duodenum', name: 'Duodenum', type: 'section' },
                { id: 'jejunum', name: 'Jejunum', type: 'section' }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const typeColors = {
  organism: '#8B5CF6',
  system: '#3B82F6',
  organ: '#10B981',
  'organ-group': '#14B8A6',
  'organ-part': '#84CC16',
  region: '#F59E0B',
  chamber: '#EF4444',
  tissue: '#EC4899',
  cells: '#6366F1',
  organelle: '#A855F7',
  structure: '#06B6D4',
  molecule: '#D946EF',
  layer: '#F97316',
  vessel: '#DC2626',
  'vessel-type': '#F87171',
  lobe: '#FBBF24',
  area: '#BEF264',
  junction: '#2DD4BF',
  airway: '#38BDF8',
  'cell-type': '#C084FC',
  section: '#4ADE80',
  glands: '#FB7185',
  coating: '#A78BFA',
  default: '#6B7280'
};

const DiagramNode = ({ node, level = 0, isLast = false, parentExpanded = true, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  
  // Check if this node or any of its descendants match the search
  const checkNodeMatch = (n, term) => {
    if (term === '') return true;
    const lowerTerm = term.toLowerCase().trim();
    const lowerName = n.name.toLowerCase();
    const lowerType = n.type.toLowerCase().replace('-', ' ');
    
    // Check if node name or type matches
    if (lowerName.includes(lowerTerm) || lowerType.includes(lowerTerm)) return true;
    
    // Check children recursively
    if (n.children) {
      return n.children.some(child => checkNodeMatch(child, term));
    }
    return false;
  };

  const matchesSearch = checkNodeMatch(node, searchTerm);
  const directMatch = searchTerm !== '' && (
    node.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    node.type.toLowerCase().replace('-', ' ').includes(searchTerm.toLowerCase().trim())
  );

  // Auto-expand if search term matches a descendant
  React.useEffect(() => {
    if (searchTerm !== '' && matchesSearch && !directMatch && hasChildren) {
      setIsExpanded(true);
    }
  }, [searchTerm]);

  if (!parentExpanded) return null;

  const nodeColor = typeColors[node.type] || typeColors.default;
  const size = level === 0 ? 140 : level === 1 ? 110 : level === 2 ? 90 : 75;
  const fontSize = level === 0 ? 'text-sm' : level === 1 ? 'text-xs' : 'text-[10px]';

  return (
    <div className="flex flex-col items-center">
      {/* Node Circle */}
      <div 
        className={`relative cursor-pointer transition-all duration-300 hover:scale-110 group ${
          !matchesSearch ? 'opacity-20 grayscale' : directMatch ? 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-slate-900' : 'opacity-100'
        }`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ width: size, height: size }}
      >
        {/* Glow Effect */}
        <div 
          className={`absolute inset-0 rounded-full blur-xl transition-opacity ${
            directMatch ? 'opacity-100 animate-pulse' : 'opacity-50 group-hover:opacity-75'
          }`}
          style={{ backgroundColor: nodeColor }}
        />
        
        {/* Main Circle */}
        <div 
          className={`absolute inset-0 rounded-full border-4 shadow-2xl flex flex-col items-center justify-center text-white font-bold ${
            directMatch ? 'border-yellow-400 animate-bounce' : 'border-white'
          }`}
          style={{ backgroundColor: nodeColor }}
        >
          <div className={`${fontSize} text-center px-2 leading-tight`}>
            {node.name}
          </div>
          {hasChildren && (
            <div className="text-[9px] mt-1 opacity-75">
              {isExpanded ? '▼' : '▶'} {node.children.length}
            </div>
          )}
        </div>

        {/* Pulse Animation for Root */}
        {level === 0 && (
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: nodeColor }}
          />
        )}
      </div>

      {/* Children Container */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center mt-8">
          {/* Vertical Line Down */}
          <div 
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: nodeColor }}
          />
          
          {/* Arrow Down */}
          <div 
            className="w-0 h-0 -mt-1"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `12px solid ${nodeColor}`
            }}
          />

          {/* Children Grid */}
          <div className="flex flex-wrap justify-center gap-8 mt-6 max-w-7xl">
            {node.children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Arrow Up to Parent */}
                <div 
                  className="w-0 h-0 mb-2"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: `10px solid ${typeColors[child.type] || typeColors.default}`
                  }}
                />
                <div 
                  className="w-1 h-8 rounded-full mb-4"
                  style={{ backgroundColor: typeColors[child.type] || typeColors.default }}
                />
                
                <DiagramNode 
                  node={child} 
                  level={level + 1}
                  isLast={idx === node.children.length - 1}
                  parentExpanded={isExpanded}
                  searchTerm={searchTerm}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AnatomicalDiagram() {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-[95vw] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🫀 Human Body Diagram
          </h1>
          <p className="text-purple-200 text-xl">
            Click on any circle to explore its components
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-2xl border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 w-5 h-5" />
              <input
                type="text"
                placeholder="Search parts... (e.g., heart, brain, cells)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-3 bg-white/20 rounded-xl p-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              
              <span className="px-4 py-1 text-sm font-bold text-white min-w-[4rem] text-center">
                {zoom}%
              </span>
              
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              
              <button
                onClick={() => setZoom(100)}
                className="ml-2 p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Reset Zoom"
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Diagram Container */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/10 overflow-auto">
          <div 
            className="transition-transform duration-300 origin-top"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <DiagramNode node={anatomyData} searchTerm={searchTerm} />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">📊 Color Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(typeColors)
              .filter(([key]) => key !== 'default')
              .slice(0, 12)
              .map(([type, color]) => (
                <div key={type} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full shadow-lg border-2 border-white"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-white font-medium capitalize">
                    {type.replace('-', ' ')}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-purple-200 text-sm">
          <p>💡 Tip: Click any node to expand or collapse its sub-components</p>
          <p className="mt-1">🔍 Use search to highlight specific parts</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
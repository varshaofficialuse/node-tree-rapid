import { BrowserRouter, Routes, Route } from "react-router-dom";
import NodeTreeMain from "./NodeTreeMain";
import HumanBodyTree from "./HumanBodyTree";
import FlowDiagram from "./FlowDiagram";
import FlowDiagramNew from "./FlowDiagramNew";
import layersData from './a.json';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NodeTreeMain />} />
        <Route path="/human-tree" element={<HumanBodyTree />} />
        <Route path="/flowchart" element={<FlowDiagram />} />
        <Route path="/flowchartnew" element={<FlowDiagramNew data={layersData}/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

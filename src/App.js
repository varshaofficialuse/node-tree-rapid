import { BrowserRouter, Routes, Route } from "react-router-dom";
import NodeTreeMain from "./NodeTreeMain";
import HumanBodyTree from "./HumanBodyTree";
import FlowDiagram from "./FlowDiagram";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NodeTreeMain />} />
        <Route path="/human-tree" element={<HumanBodyTree />} />
        <Route path="/flowchart" element={<FlowDiagram />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

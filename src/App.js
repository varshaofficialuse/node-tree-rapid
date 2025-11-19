import { BrowserRouter, Routes, Route } from "react-router-dom";
import NodeTreeMain from "./NodeTreeMain";
import HumanBodyTree from "./HumanBodyTree";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NodeTreeMain />} />
        <Route path="/human-tree" element={<HumanBodyTree />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

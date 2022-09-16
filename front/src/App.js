import { BrowserRouter, Routes, Route } from "react-router-dom";

import Content from "./components/Content";
import Register from "./components/Register";

import "antd/dist/antd.css";
import "./styles/scss/App.scss";

function App() {
    return (
        <div className="container">
            <div className="window">
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Content />}></Route>
                        <Route path="register" element={<Register />  }></Route>
                    </Routes>
                </BrowserRouter>
            </div>
        </div>
    );
}

export default App;

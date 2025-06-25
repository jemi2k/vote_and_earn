import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./components/hero/Hero";
import Navbar from "./components/Navbar/Navbar";
import Propose from "./components/propose/Propose";
import Settle from "./components/settle/Settle";
import "./index.css";
import About from "./components/about/About";
import Market from "./components/market/Market";

function App() {
  const [state, setState] = useState({
    provider: null,
    signer: null,
    contract: null,
    currencyContract: null,
    account: "",
  });

  const saveState = (newState) => {
    console.log("Wallet State:", newState);
    setState(newState);
  };

  const isConnected =
    state.contract && (state.contract.address || state.contract.target);

  return (
    <Router>
      <Navbar saveState={saveState} />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero state={state} />
              <Market contract={state.contract} />
            </>
          }
        />
        <Route path="/verify" element={<Market contract={state.contract} />} />
        <Route
          path="/propose"
          element={
            isConnected ? (
              <Propose
                contract={state.contract}
                signer={state.signer}
                currencyContract={state.currencyContract}
              />
            ) : (
              <p style={{ textAlign: "center", marginTop: "2rem" }}>
                Please connect your wallet to propose a new market.
              </p>
            )
          }
        />
          <Route path="/settle" element={<Settle />} />
          <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;



import React from "react";
import CreateMarket from "../createmarket/CreateMarket";
import "./propose.css";

const Propose = ({ contract }) => {
  return (
    <div className="propose-page">
      <h1>Propose a New Market</h1>
      <CreateMarket contract={contract} />
    </div>
  );
};

export default Propose;

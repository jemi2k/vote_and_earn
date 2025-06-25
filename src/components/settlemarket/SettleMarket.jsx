import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import usdcABI from "../currencyAPI/erc20ABI.json"; // Ensure correct path
import ABI from "../Navbar/ABI.json";
import "./SettleMarket.css";

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const DEPLOYED_ADDRESS = "0xE74df733Aad972D5B07C3C7F5322809aA2580095";

const trimMarketId = (id) => {
    return id ? id.slice(0, 20) + "..." + id.slice(-15) : "";
  };

const SettleMarket = ({ marketId, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [settleStatus, setSettleStatus] = useState("");
  const [payout, setPayout] = useState(null);
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);

  // Establish connection and store account and signer.
  useEffect(() => {
    const setupConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const signerInstance = await provider.getSigner();
            setSigner(signerInstance);
          }
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
          setSettleStatus("Error connecting to MetaMask.");
        }
      } else {
        console.error("MetaMask is not detected.");
        setSettleStatus("MetaMask is not detected.");
      }
    };
    setupConnection();
  }, []);

  const handleSettleMarket = async () => {
    if (!signer || !marketId) {
      setSettleStatus("Missing signer or market ID.");
      return;
    }
    setLoading(true);
    setSettleStatus("Submitting settlement transaction...");
    try {
      const contractWithSigner = new ethers.Contract(DEPLOYED_ADDRESS, ABI, signer);
      const tx = await contractWithSigner.settleOutcomeTokens(marketId);
      const receipt = await tx.wait();
      let eventFound = false;
      if (receipt.events) {
        for (const event of receipt.events) {
          if (event.event === "TokensSettled") {
            const { marketId: evtMarketId, payout: eventPayout } = event.args;
            if (evtMarketId.toString() === marketId) {
              setPayout(ethers.formatUnits(eventPayout, 6));
              eventFound = true;
              break;
            }
          }
        }
      }
      if (!eventFound) {
        setSettleStatus("Settlement completed, but no payout info found.");
      } else {
        setSettleStatus("Market settled successfully!");
        if (refreshData) refreshData(); // Closes the modal.
      }
    } catch (error) {
      console.error("Settlement error:", error);
      if (error.message.includes("Market not resolved")) {
        setSettleStatus("The market is not resolved yet. Please check back later.");
      } else {
        setSettleStatus(`Settlement failed: ${error.message}`);
      }
    }
    setLoading(false);
  };

  // When clicking on the overlay, invoke refreshData() to close the modal.
  const handleOverlayClick = () => {
    if (refreshData) refreshData();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="settle-market-container">
          <h2>Settle Market</h2>
          <p>
            <strong>Market ID:</strong> {trimMarketId(marketId)}
          </p>
          {payout !== null && (
            <p>
              <strong>Your Payout:</strong> {payout} USDC
            </p>
          )}
          <button onClick={handleSettleMarket} disabled={loading}>
            {loading ? "Settling..." : "Settle Market"}
          </button>
          {settleStatus && <p className="status-message">{settleStatus}</p>}
        </div>
      </div>
    </div>
  );
};

export default SettleMarket;
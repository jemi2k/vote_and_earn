import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import usdcABI from "../currencyAPI/erc20ABI.json"; // Ensure correct path to USDC ABI
import ABI from "../Navbar/ABI.json";
import "./Items.css";  

const USDC_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const DEPLOYED_ADDRESS = "0x781Bf280807F4E31967A3Aa69921262F66b5F0DD";

const Items = ({
  show,
  mode, // "assert" or "purchase"
  market, // market object with candidateNames, description, reward, requiredBond, marketId, etc.
  loading,
  onSubmit, // Callback receives an object with all collected data from the modal
  onClose,
}) => {
  useEffect(() => {
    console.log("Modal props:", { show, mode, market, loading });
  }, [show, mode, market, loading]);

  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [userUSDCBalance, setUserUSDCBalance] = useState(null);
  // New states for approval in purchase mode:
  const [approved, setApproved] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState("");
  const [loadingApprove, setLoadingApprove] = useState(false);

  useEffect(() => {
    if (mode === "purchase") {
      async function fetchBalance() {
        try {
          if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcABI, signer);
            const balance = await usdcContract.balanceOf(address);
            setUserUSDCBalance(ethers.formatUnits(balance, 6));
          }
        } catch (error) {
          console.error("Error fetching USDC balance:", error);
        }
      }
      fetchBalance();
    }
  }, [mode]);

  const handleSetMax = () => {
    if (userUSDCBalance) {
      setPurchaseAmount(userUSDCBalance.toString());
    }
  };

  // New handleApprove function for purchase mode.
  const handleApprove = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
    try {
      setLoadingApprove(true);
      setApprovalStatus("Approving USDC...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcABI, signer);

      let amountToApprove;
      if (mode === "purchase") {
        amountToApprove = ethers.parseUnits(purchaseAmount || "0", 6);
      } else if (mode === "assert") {
        amountToApprove = market.requiredBond;
      }

      const tx = await usdcContract.approve(DEPLOYED_ADDRESS, amountToApprove);
      await tx.wait();
      setApprovalStatus("Approval successful.");
      setApproved(true);
    } catch (error) {
      console.error("Approval error:", error);
      setApprovalStatus("Approval failed: " + (error.reason || error.message));
    } finally {
      setLoadingApprove(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "assert") {
      if (selectedCandidateIndex === null) {
        alert("Please select an outcome.");
        return;
      }
      const assertedOutcome =
        selectedCandidateIndex === market.candidateNames.length
          ? "Unresolvable"
          : (() => {
              try {
                return ethers.toUtf8String(market.candidateNames[selectedCandidateIndex]);
              } catch (error) {
                return market.candidateNames[selectedCandidateIndex];
              }
            })();
      onSubmit({
        mode,
        assertedOutcome,
        marketDetails: {
          marketId: market.marketId,
          description: market.description,
          reward: market.reward,
          requiredBond: market.requiredBond,
          candidateNames: market.candidateNames,
        },
      });
    } else if (mode === "purchase") {
      if (selectedCandidateIndex === null) {
        alert("Please select a candidate.");
        return;
      }
      if (!purchaseAmount || isNaN(purchaseAmount) || Number(purchaseAmount) <= 0) {
        alert("Please enter a valid purchase amount.");
        return;
      }
      onSubmit({
        mode,
        selectedCandidateIndex,
        purchaseAmount,
        marketDetails: {
          marketId: market.marketId,
          description: market.description,
          reward: market.reward,
          requiredBond: market.requiredBond,
          candidateNames: market.candidateNames,
        },
      });
    }
  };

  if (!show) return null;

  const assertOptions =
    mode === "assert" && market?.candidateNames
      ? [
          ...market.candidateNames.map((name) => {
            try {
              return ethers.toUtf8String(name);
            } catch (error) {
              return name;
            }
          }),
          "Unresolvable",
        ]
      : [];

  return (
    <div className="items-modal-overlay" onClick={onClose}>
      <div className="items-modal" onClick={(e) => e.stopPropagation()}>
        <header className="items-header">
          <h3 className="items-title">
            {mode === "assert" ? "Assert Outcome" : "Purchase Candidate Tokens"}
          </h3>
        </header>

        <div className="items-content">
          {mode === "assert" ? (
            <div className="items-section">
              <p>Select an outcome:</p>
              <div className="candidate-options">
                {assertOptions.map((option, index) => (
                  <label key={index} className="candidate-option">
                    <input
                      type="radio"
                      name="assertOutcome"
                      value={index}
                      checked={selectedCandidateIndex === index}
                      onChange={() => setSelectedCandidateIndex(index)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="items-section">
                <p>Select a candidate:</p>
                <div className="candidate-options">
                  {market &&
                    market.candidateNames &&
                    market.candidateNames.map((name, index) => {
                      let displayName;
                      try {
                        displayName = ethers.toUtf8String(name);
                      } catch (error) {
                        displayName = name;
                      }
                      return (
                        <label key={index} className="candidate-option">
                          <input
                            type="radio"
                            name="candidate"
                            value={index}
                            checked={selectedCandidateIndex === index}
                            onChange={() => setSelectedCandidateIndex(index)}
                          />
                          {displayName}
                        </label>
                      );
                    })}
                </div>
              </div>
              <div className="items-section purchase-section">
                <p>Purchase Amount:</p>
                {userUSDCBalance && <p className="balance-info">Available: {userUSDCBalance}</p>}
                <div className="input-with-max">
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="Token amount"
                    min="0"
                    step="0.01"
                  />
                  {userUSDCBalance && (
                    <button
                      type="button"
                      className="max-btn"
                      onClick={handleSetMax}
                      title="Set maximum balance"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="market-details">
          <h4>Market Details</h4>
          <p>
            <strong>Description:</strong> {market.description}
          </p>
          <p>
            <strong>Required Bond:</strong> {ethers.formatUnits(market.requiredBond, 6)}
          </p>
          <p>
            <strong>Reward:</strong> {ethers.formatUnits(market.reward, 6)}
          </p>
          {market.candidateNames && market.candidateNames.length > 0 && (
            <div>
              <strong>Candidates:</strong>
              <ul>
                {market.candidateNames.map((cName, idx) => {
                  let displayName;
                  try {
                    displayName = ethers.toUtf8String(cName);
                  } catch (error) {
                    displayName = cName;
                  }
                  return <li key={idx}>{displayName}</li>;
                })}
              </ul>
            </div>
          )}
        </div>

        <footer className="items-footer">
  {(mode === "purchase" || mode === "assert") && (
    <button onClick={handleApprove} disabled={loadingApprove || approved}>
      {loadingApprove ? "Approving..." : approved ? "Approved" : "Approve USDC"}
    </button>
  )}
  <button
    onClick={handleSubmit}
    disabled={loading || ((mode === "purchase" || mode === "assert") && !approved)}
  >
    {loading
      ? (mode === "purchase" ? "Purchasing..." : "Asserting...")
      : mode === "purchase"
      ? "Purchase"
      : "Assert"}
  </button>
  <button onClick={onClose}>Cancel</button>
  {approvalStatus && <p>{approvalStatus}</p>}
</footer>
      </div>
    </div>
  );
};

export default Items;
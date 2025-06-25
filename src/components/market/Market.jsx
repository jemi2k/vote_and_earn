import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./Market.css";
import Items from "../items/Items"; // Make sure path is correct

const Market = ({ contract }) => {
  const [markets, setMarkets] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Modal control using the Items component
  const [modalProps, setModalProps] = useState({
    show: false,
    mode: "", // "assert" or "purchase"
    market: null,
  });

  useEffect(() => {
    if (!contract) return;
    async function fetchMarkets() {
      try {
        const events = await contract.queryFilter("MarketInitialized");
        const marketsData = events.map((event) => {
          const {
            marketId,
            candidateNames,
            description,
            candidateTokenAddresses,
            reward,
            requiredBond,
          } = event.args;
          return {
            marketId: marketId.toString(),
            candidateNames, // expecting an array of candidate names
            description,
            candidateTokenAddresses, // array of token addresses
            reward: reward.toString(),
            requiredBond: requiredBond.toString(),
          };
        });
        setMarkets(marketsData);
      } catch (error) {
        console.error("Error fetching markets:", error);
      }
    }
    fetchMarkets();
  }, [contract]);

  //const formatCandidateNames = (namesArray) => namesArray.join(", ");
  const formatCandidateNames = (namesArray) =>
    namesArray
      .map((nameHex) => {
        try {
          return ethers.toUtf8String(nameHex);
        } catch (e) {
          return nameHex; // fallback if conversion fails
        }
      })
      .join(", ");

      
  // Open assertion modal by setting the modal props accordingly
  const openAssertModal = (marketId) => {
    const selectedMarket = markets.find((m) => m.marketId === marketId);
    setModalProps({
      show: true,
      mode: "assert",
      market: selectedMarket,
    });
  };

  // Open purchase modal
  const openPurchaseModal = (market) => {
    setModalProps({
      show: true,
      mode: "purchase",
      market: market,
    });
  };

  // Modal submit handler
  const handleModalSubmit = async (data) => {
    if (!modalProps.market) return;

    if (modalProps.mode === "assert") {
      if (!data.assertedOutcome) {
        alert("Please enter a candidate name or 'Unresolvable'.");
        return;
      }
      try {
        setLoadingTx(true);
        const tx = await contract.assertMarket(
          modalProps.market.marketId,
          data.assertedOutcome
        );
        await tx.wait();
        alert("Market asserted successfully!");
      } catch (error) {
        console.error("Error asserting market:", error);
        alert("Market assertion failed: " + (error.reason || error.message));
      } finally {
        setLoadingTx(false);
        setModalProps({ show: false, mode: "", market: null });
      }
    } else if (modalProps.mode === "purchase") {
      if (data.selectedCandidateIndex === null || !data.purchaseAmount) {
        alert("Please select a candidate and enter an amount.");
        return;
      }
      try {
        setLoadingTx(true);
        // ethers v6: use ethers.parseUnits directly
        const amount = ethers.parseUnits(data.purchaseAmount, 18);
        const tx = await contract.purchaseCandidateToken(
          modalProps.market.marketId,
          data.selectedCandidateIndex,
          amount
        );
        await tx.wait();
        alert("Token purchase successful!");
      } catch (error) {
        console.error("Error purchasing token:", error);
        alert("Token purchase failed: " + (error.reason || error.message));
      } finally {
        setLoadingTx(false);
        setModalProps({ show: false, mode: "", market: null });
      }
    }
  };

  const handleModalClose = () =>
    setModalProps({ show: false, mode: "", market: null });

  return (
    <div className="market-container">
      <h3 className="header">List of Markets</h3>
      {markets.length === 0 ? (
        <p>No markets available</p>
      ) : (
        <div className="market-cards">
          {markets.map((market) => (
            <div key={market.marketId} className="market-card">
              <div className="card-header">
                <h3>Market {market.marketId.substring(0, 5)}...</h3>
              </div>
              <div className="card-body">
                <p>
                  <strong>Candidates:</strong> {formatCandidateNames(market.candidateNames)}
                </p>
                <p>
                  <strong>Description:</strong> {market.description}
                </p>
                <p>
                  <strong>Reward:</strong> {ethers.formatUnits(market.reward, 6)} USDC
                </p>
                <p>
                  <strong>Bond:</strong> {ethers.formatUnits(market.requiredBond, 6)} USDC
                </p>
              </div>
              <div className="card-actions">
                <button onClick={() => openAssertModal(market.marketId)} disabled={loadingTx}>
                  {loadingTx ? "Processing..." : "Assert Outcome"}
                </button>
                <button onClick={() => openPurchaseModal(market)} disabled={loadingTx}>
                  {loadingTx ? "Processing..." : "Purchase Tokens"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render the Items modal */}
      <Items
        show={modalProps.show}
        mode={modalProps.mode}
        market={modalProps.market}
        loading={loadingTx}
        onSubmit={handleModalSubmit}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default Market;
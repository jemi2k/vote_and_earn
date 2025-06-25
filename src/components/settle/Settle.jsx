import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import SettleMarket from "../settlemarket/SettleMarket";
import "./Settle.css";
import VotePredictionAbi from "../Navbar/ABI.json";

const CONTRACT_ADDRESS = "0xE74df733Aad972D5B07C3C7F5322809aA2580095";

const Settle = () => {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Establish MetaMask connection and initialize a transaction‑capable contract instance.
  useEffect(() => {
    const setup = async () => {
      if (window.ethereum) {
        try {
          // Use BrowserProvider as requested.
          const prov = new ethers.BrowserProvider(window.ethereum);
          setProvider(prov);
          const accounts = await prov.send("eth_requestAccounts", []);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const signer = prov.getSigner();
            // Create contract instance with signer for transactions.
            const votePredictionContract = new ethers.Contract(
              CONTRACT_ADDRESS,
              VotePredictionAbi,
              signer
            );
            setContract(votePredictionContract);
          }
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.error("MetaMask is not detected.");
      }
    };
    setup();
  }, []);

  // Fetch markets where the connected account holds candidate tokens.
  const fetchParticipantMarkets = async () => {
    if (!contract || !account || !provider) return;
    setLoading(true);
    try {
      // Create a read-only contract instance using the provider.
      const readContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        VotePredictionAbi,
        provider
      );
      // Query all MarketInitialized events.
      const filter = readContract.filters.MarketInitialized();
      const events = await readContract.queryFilter(filter);
      const filteredMarkets = [];

      // Loop over each event to get market details.
      for (const event of events) {
        const marketId = event.args.marketId.toString();
        // Use the read-only instance for getMarket call.
        const marketData = await readContract.getMarket(marketId);
        let totalBalance = 0n;
        // Loop through candidate tokens and sum up the balances.
        for (const tokenInstance of marketData.candidateTokens) {
          const tokenAddress = tokenInstance.address ? tokenInstance.address : tokenInstance;
          const erc20 = new ethers.Contract(
            tokenAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          );
          const balance = await erc20.balanceOf(account);
          totalBalance += balance;
        }
        // Only include markets where the user has a positive token balance.
        if (totalBalance > 0n) {
          filteredMarkets.push({
            marketId,
            marketName: ethers.toUtf8String(marketData.description),
            tokenBalance: totalBalance,
          });
        }
      }
      setMarkets(filteredMarkets);
    } catch (error) {
      console.error("Error fetching participant markets:", error);
    }
    setLoading(false);
  };

  // Refresh participant markets when the contract and account are available.
  useEffect(() => {
    fetchParticipantMarkets();
  }, [contract, account]);

  const openModal = (market) => {
    setSelectedMarket(market);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedMarket(null);
    setShowModal(false);
    fetchParticipantMarkets();
  };

  return (
    <div className="settle-page">
      <h2>Settle Your Markets</h2>
      {loading ? (
        <p>Loading markets...</p>
      ) : markets.length === 0 ? (
        <p>No markets available for settlement.</p>
      ) : (
        <div className="market-list">
          {markets.map((market) => (
            <div key={market.marketId} className="market-item">
              <div className="market-info">
                <h3>{market.marketName}</h3>
                <p>{market.marketId}</p>
                <p>
                  Your Token Balance:{" "}
                  {ethers.formatUnits(market.tokenBalance, 18)}
                </p>
              </div>
              <button onClick={() => openModal(market)}>Settle Market</button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedMarket && (
        <div className="modal-overlay">
          <div className="modal-content">
            

            {/* Only pass marketId and refreshData; contract instance is not passed */}
            <SettleMarket marketId={selectedMarket.marketId} refreshData={closeModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Settle;
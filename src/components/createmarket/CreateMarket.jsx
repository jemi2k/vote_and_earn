import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./CreateMarket.css";
import usdcABI from "../currencyAPI/erc20ABI.json";
import ABI from "../Navbar/ABI.json";

const DEPLOYED_ADDRESS = "0x781Bf280807F4E31967A3Aa69921262F66b5F0DD";
const CURRENCY_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";

const CreateMarket = () => {
  // Local state for provider, signer, and contracts
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [currencyContract, setCurrencyContract] = useState(null);

  // Form state
  const [candidates, setCandidates] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [bond, setBond] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [approved, setApproved] = useState(false);
  const [availableBalance, setAvailableBalance] = useState("");

  const getContractAddress = (contractInstance) => {
    return contractInstance.address || contractInstance.target;
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      // For ethers v6, use BrowserProvider and await getSigner()
      const tempProvider = new ethers.BrowserProvider(window.ethereum);
      const tempSigner = await tempProvider.getSigner();
      setProvider(tempProvider);
      setSigner(tempSigner);

      // Instantiate contract instances using the signer
      const votePredictionContract = new ethers.Contract(
        DEPLOYED_ADDRESS,
        ABI,
        tempSigner
      );
      setContract(votePredictionContract);

      const tempCurrencyContract = new ethers.Contract(
        CURRENCY_ADDRESS,
        usdcABI,
        tempSigner
      );
      setCurrencyContract(tempCurrencyContract);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("There was a problem connecting your wallet.");
    }
  };

  // Fetch available USDC balance for the connected account
  const fetchAvailableBalance = async () => {
    if (!currencyContract || !signer) return;
    try {
      const address = await signer.getAddress();
      const balance = await currencyContract.balanceOf(address);
      const humanBalance = ethers.formatUnits(balance, 6);
      setAvailableBalance(humanBalance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (currencyContract && signer) {
      fetchAvailableBalance();
    }
  }, [currencyContract, signer]);

  const handleSetMax = () => {
    setReward(availableBalance);
  };

  const handleApprove = async () => {
    if (!contract || !getContractAddress(contract)) {
      alert("VotePrediction contract is not connected.");
      return;
    }
    if (!reward || Number(reward) <= 0) {
      alert("Enter a valid reward amount.");
      return;
    }
    try {
      setLoading(true);
      setApprovalStatus("Approving USDC tokens...");
      const rewardAmount = ethers.parseUnits(reward, 6);
      const txApprove = await currencyContract.approve(
        getContractAddress(contract),
        rewardAmount
      );
      await txApprove.wait();
      setApprovalStatus("Token approval successful.");
      setApproved(true);
    } catch (error) {
      console.error("Approval error:", error);
      setApprovalStatus("Approval failed: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !getContractAddress(contract)) {
      alert("VotePrediction contract is not connected.");
      return;
    }
    if (!approved) {
      alert("Please approve USDC before creating the market.");
      return;
    }
    const candidateNames = candidates
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");
    if (candidateNames.length < 2) {
      alert("Please provide at least two candidates.");
      return;
    }
    try {
      setLoading(true);
      setTxStatus("Submitting market initialization...");
      const rewardParsed = ethers.parseUnits(reward, 6);
      const bondParsed = ethers.parseUnits(bond, 6);
      const tx = await contract.initializeMarket(
        candidateNames,
        description,
        rewardParsed,
        bondParsed
      );
      await tx.wait();
      setTxStatus("Market initialized successfully.");
    } catch (error) {
      console.error("Error initializing market:", error);
      setTxStatus("Transaction failed: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-market-container">
      <h2>Create New Market</h2>
      <form onSubmit={handleSubmit} className="create-market-form">
        <input
          type="text"
          placeholder="Enter candidate names separated by commas"
          value={candidates}
          onChange={(e) => setCandidates(e.target.value)}
          required
        />
        <textarea
          placeholder="Enter market description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <div className="balance-info">Available USDC: {availableBalance}</div>
        <div className="reward-group">
          <div className="input-with-max">
            <input
              type="number"
              placeholder="Reward (USDC)"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              min="0"
              step="0.01"
              required
            />
            <button type="button" className="max-btn" onClick={handleSetMax}>
              Max
            </button>
          </div>
        </div>
        <input
          type="number"
          placeholder="Bond (USDC)"
          value={bond}
          onChange={(e) => setBond(e.target.value)}
          min="0"
          step="0.01"
          required
        />
        <div className="button-group">
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? "Approving..." : "Approve USDC"}
          </button>
          <button
            type="submit"
            disabled={loading || !approved}
            title={!approved ? "Please First Approve USDC" : ""}
          >
            {loading ? "Creating Market..." : "Create Market"}
          </button>
        </div>
        {approvalStatus && <p>{approvalStatus}</p>}
        {txStatus && <p>{txStatus}</p>}
      </form>
    </div>
  );
};

export default CreateMarket;
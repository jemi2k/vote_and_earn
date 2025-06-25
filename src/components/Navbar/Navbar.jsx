import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "./ABI.json"; // VotePrediction contract ABI
import currencyABI from "./currencyABI.json"; // Currency token ABI (USDC)
import "./Navbar.css";

const DEPLOYED_ADDRESS = "0x781Bf280807F4E31967A3Aa69921262F66b5F0DD";
const CURRENCY_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";

const Navbar = ({ saveState }) => {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");

  const trimAddress = (address) =>
    address.slice(0, 9) + "..." + address.slice(-4);

  const disconnectWallet = () => {
    setConnected(false);
    setAccount("");
    window.localStorage.removeItem("account");
    saveState({
      provider: null,
      signer: null,
      contract: null,
      currencyContract: null,
      account: "",
    });
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      // For ethers v6, use BrowserProvider and await getSigner()
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      // Persist the connected account
      window.localStorage.setItem("account", addr);

      // Instantiate contract instances using the signer
      const votePredictionContract = new ethers.Contract(
        DEPLOYED_ADDRESS,
        ABI,
        signer
      );
      const currencyContract = new ethers.Contract(
        CURRENCY_ADDRESS,
        currencyABI,
        signer
      );

      console.log("VotePrediction contract:", votePredictionContract);
      console.log("Currency contract:", currencyContract);

      setConnected(true);
      setAccount(addr);
      saveState({
        provider,
        signer,
        contract: votePredictionContract,
        currencyContract,
        account: addr,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("There was a problem connecting your wallet.");
    }
  };

  // Auto-connect if an account was previously stored
  useEffect(() => {
    const savedAccount = window.localStorage.getItem("account");
    if (savedAccount && window.ethereum) {
      connectWallet();
    }
  }, []);

  return (
    <header className="navbar">
      
      <nav className="navbar-logo">
        <a href="/">Vote and Earn</a>
      </nav>
      <nav className="navbar-links">
        <a href="/">Home</a>
        <a href="/verify">Verify/Vote</a>
        <a href="/propose">Propose</a>
        <a href="/settle">Settle</a>
        <a href="/about">About</a>
      </nav>
      <div className="wallet-section">
        {connected ? (
          <button className="connectBTN" onClick={disconnectWallet}>
            {trimAddress(account)}
          </button>
        ) : (
          <button className="connectBTN" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
      
      <div className="testnet-info">
        <p>
        This is on Avalanche C-Chain mainnet. To use it, get USDC on Avalanche{" "}
          <a href="https://www.usdc.com/learn/how-to-get-usdc-on-avalanche" target="_blank" rel="noopener noreferrer">
            [here] 
          </a>
        </p>
      </div>
    </header>
    
  );
};

export default Navbar;
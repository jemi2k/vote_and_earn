# Vote and Earn

# Vote and Earn 🗳️💸

**Vote and Earn** is a decentralized multi-candidate prediction market deployed on **Avalanche C-Chain mainnet**.  
The platform enables users to create and participate in markets predicting real-world events and elections, supporting multiple candidates or outcomes.  
Participants buy ERC-20 tokens representing their predictions. When the outcome is verified, winning token holders claim rewards — while losing tokens are burned.  

---

## 🚀 Key Features

- **Multi-candidate prediction markets**  
  Each candidate or event is represented by a unique ERC-20 token.  
- **User-generated markets**  
  Anyone can launch a new market by defining candidates, descriptions, and reward parameters — fully on-chain.  
- **Decentralized outcome verification**  
  Uses UMA’s Optimistic Oracle to securely and trustlessly resolve market outcomes.  
- **Fair, trustless settlement**  
  Winning token holders claim rewards directly; losing tokens are burned automatically.  
- **Built on Avalanche C-Chain mainnet**  
  Fast, low-cost transactions with sub-second finality.  

---

## ⚡ Why Avalanche?

Vote and Earn leverages **Avalanche C-Chain mainnet** to provide:
- **High throughput + instant finality** → Users place bets and claim rewards without waiting for long confirmations.  
- **Low gas fees** → Affordable transactions, enabling micro-bets and mass participation.  
- **EVM compatibility** → Works with standard wallets like MetaMask and Core.  
- **Scalability** → Supports future cross-chain integrations or migration to a custom subnet for even greater scalability.

---

## 🌐 Live Deployment

✅ **Smart Contract deployed on:** Avalanche C-Chain mainnet  
✅ **Main contract address:** `0xYOUR_MAINNET_CONTRACT_ADDRESS_HERE`  
✅ **Frontend:** [Add link if hosted — e.g. Vercel / Netlify / IPFS]  

---

## 🛠 How to Use

1️⃣ Connect your wallet (MetaMask or Core) to **Avalanche C-Chain mainnet**  
2️⃣ Open the dApp frontend  
3️⃣ View available markets or create a new one  
4️⃣ Buy candidate tokens to place your predictions  
5️⃣ Claim your rewards after outcome resolution  

---

## 🤝 Contributing

Feedback and PRs welcome — please open an issue or pull request!

---

## 📬 Contact

**Email:** jermijwll@gmail.com  

---

## 🛠 How to Run Locally

### 1️⃣ Clone the repo

```bash
git clone 
cd Vote
```

### 2️⃣ Install dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Start frontend

```bash
npm start
# or
yarn start
```
### ⚙️ Contract Deployment (Avalanche Mainnet – C-Chain)

This project was deployed using **Hardhat** on the **Avalanche C-Chain mainnet**.

#### ✅ Prerequisites
Make sure you have the following configured:
- `AVALANCHE_RPC_URL` set in your `.env` file 
- `PRIVATE_KEY` of your deployer wallet (funded with AVAX)

### 💡 Future Enhancements

- **Cross-chain bet funding**  
  Enable users to fund predictions using assets from other chains by integrating Avalanche-native bridges or **Chainlink CCIP**, expanding liquidity and accessibility.

- **Dedicated prediction market subnet**  
  Deploy the platform on a custom **Avalanche Subnet** to support:
  - Custom gas settings
  - Native governance
  - Specialized tokenomics
  This would improve scalability, reduce congestion, and provide greater flexibility for platform-specific rules.

## 📄 License

MIT



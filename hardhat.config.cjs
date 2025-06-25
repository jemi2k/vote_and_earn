require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      }
    ],
    overrides: {
      // Use Solidity 0.8.16 for UMA’s ClaimData.sol since it declares 0.8.16
      "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol": {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  },
  networks: {
    avalanche: {
      url: process.env.AVALANCHE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};

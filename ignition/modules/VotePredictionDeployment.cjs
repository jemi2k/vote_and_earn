const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotePredictionModule", (m) => {
  // get deployment parameters, two of them are UMA contracts, i use usdc on avalanche mainnet
  const finderAddress = m.getParameter("finderAddress", "0xCFdC4d6FdeC25e339ef07e25C35a482A6bedcfE0");
  const currencyAddress = m.getParameter("currencyAddress", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E");
  const optimisticOracleV3Address = m.getParameter("optimisticOracleV3Address", "0xa4199d73ae206d49c966cF16c58436851f87d47F");

  // deploy the VotePrediction contract with the provided abovve parameters
  const votePrediction = m.contract("VotePrediction", [finderAddress, currencyAddress, optimisticOracleV3Address]);

  return { votePrediction };
});
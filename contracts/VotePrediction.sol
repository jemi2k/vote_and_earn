// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uma/core/contracts/common/implementation/AddressWhitelist.sol";
import { ExpandedERC20 as UMAExpandedERC20 } from "@uma/core/contracts/common/implementation/ExpandedERC20.sol";
import "@uma/core/contracts/data-verification-mechanism/implementation/Constants.sol";
import "@uma/core/contracts/data-verification-mechanism/interfaces/FinderInterface.sol";
import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";
import { OptimisticOracleV3Interface as OOInterface } from "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3Interface.sol";
import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3CallbackRecipientInterface.sol";

contract VotePrediction is OptimisticOracleV3CallbackRecipientInterface {
    using SafeERC20 for IERC20;
    
    struct Market {
        bool resolved; // True if the market has been resolved.
        uint256 assertedOutcomeIndex; // Index of the candidate that was affirmed.
        // Array of candidate tokens (using UMAExpandedERC20)
        UMAExpandedERC20[] candidateTokens;
        uint256 reward; // Reward for asserting the true market outcome.
        uint256 requiredBond; // Expected bond used in the assertion.
        bytes[] candidateNames; // Array of candidate names.
        bytes description; // Description of the market.
    }

    struct AssertedMarket {
        address asserter;
        bytes32 marketId;
    }

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => AssertedMarket) public assertedMarkets;

    FinderInterface public immutable finder;
    IERC20 public immutable currency;
    OOInterface public immutable oo;
    uint64 public constant assertionLiveness = 7200; // 2 hours.
    bytes32 public immutable defaultIdentifier;
    bytes public constant unresolvable = "Unresolvable";

    event MarketInitialized(
        bytes32 indexed marketId,
        bytes[] candidateNames,
        string description,
        address[] candidateTokenAddresses,
        uint256 reward,
        uint256 requiredBond
    );
    event MarketAsserted(bytes32 indexed marketId, string assertedOutcome, bytes32 indexed assertionId);
    event MarketResolved(bytes32 indexed marketId);
    event TokensSettled(
        bytes32 indexed marketId,
        address indexed account,
        uint256 payout,
        uint256 correctTokenBalance
    );

    constructor(
        address _finder,
        address _currency,
        address _optimisticOracleV3
    ) {
        finder = FinderInterface(_finder);
        require(_getCollateralWhitelist().isOnWhitelist(_currency), "Unsupported currency");
        currency = IERC20(_currency);
        oo = OOInterface(_optimisticOracleV3);
        defaultIdentifier = oo.defaultIdentifier();
    }

    function getMarket(bytes32 marketId) public view returns (Market memory) {
        return markets[marketId];
    }

    function initializeMarket(
        string[] memory outcomes,
        string memory description,
        uint256 reward,
        uint256 requiredBond
    ) public returns (bytes32 marketId) {
        require(outcomes.length >= 2, "At least two candidates required");
        require(bytes(description).length > 0, "Empty description");

        marketId = keccak256(abi.encode(block.number, description));
        require(markets[marketId].candidateTokens.length == 0, "Market already exists");

        uint256 numCandidates = outcomes.length;
        UMAExpandedERC20[] memory tokens = new UMAExpandedERC20[](numCandidates);
        bytes[] memory names = new bytes[](numCandidates);
        address[] memory tokenAddresses = new address[](numCandidates);

        for (uint256 i = 0; i < numCandidates; i++) {
            require(bytes(outcomes[i]).length > 0, "Empty candidate name");
            names[i] = bytes(outcomes[i]);
            UMAExpandedERC20 token = new UMAExpandedERC20(
                string(abi.encodePacked(outcomes[i], " Token")),
                "CTKN",
                18
            );
            token.addMinter(address(this));
            token.addBurner(address(this));
            tokens[i] = token;
            tokenAddresses[i] = address(token);
        }

        markets[marketId] = Market({
            resolved: false,
            assertedOutcomeIndex: type(uint256).max,
            candidateTokens: tokens,
            reward: reward,
            requiredBond: requiredBond,
            candidateNames: names,
            description: bytes(description)
        });

        if (reward > 0) {
            currency.safeTransferFrom(msg.sender, address(this), reward);
        }

        emit MarketInitialized(marketId, names, description, tokenAddresses, reward, requiredBond);
    }

    function assertMarket(bytes32 marketId, string memory assertedOutcome) public returns (bytes32 assertionId) {
        Market storage market = markets[marketId];
        require(market.candidateTokens.length > 0, "Market does not exist");

        bytes32 assertedOutcomeHash = keccak256(bytes(assertedOutcome));
        bool validOutcome = false;
        uint256 outcomeIndex = type(uint256).max;

        for (uint256 i = 0; i < market.candidateNames.length; i++) {
            if (keccak256(market.candidateNames[i]) == assertedOutcomeHash) {
                validOutcome = true;
                outcomeIndex = i;
                break;
            }
        }

        if (!validOutcome && (assertedOutcomeHash == keccak256(unresolvable))) {
            validOutcome = true;
            outcomeIndex = type(uint256).max;
        }

        require(validOutcome, "Invalid asserted outcome");
        require(market.assertedOutcomeIndex == type(uint256).max, "Assertion active or resolved");

        market.assertedOutcomeIndex = outcomeIndex;
        uint256 minimumBond = oo.getMinimumBond(address(currency));
        uint256 bond = market.requiredBond > minimumBond ? market.requiredBond : minimumBond;
        bytes memory claim = _composeClaim(assertedOutcome, market.description);

        currency.safeTransferFrom(msg.sender, address(this), bond);
        currency.safeApprove(address(oo), bond);
        assertionId = _assertTruthWithDefaults(claim, bond);
        assertedMarkets[assertionId] = AssertedMarket({ asserter: msg.sender, marketId: marketId });
        emit MarketAsserted(marketId, assertedOutcome, assertionId);
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) public {
        require(msg.sender == address(oo), "Not authorized");
        Market storage market = markets[assertedMarkets[assertionId].marketId];
        if (assertedTruthfully) {
            market.resolved = true;
            if (market.reward > 0) {
                currency.safeTransfer(assertedMarkets[assertionId].asserter, market.reward);
            }
            emit MarketResolved(assertedMarkets[assertionId].marketId);
        } else {
            market.assertedOutcomeIndex = type(uint256).max;
        }
        delete assertedMarkets[assertionId];
    }

    function assertionDisputedCallback(bytes32 assertionId) public {}

    function purchaseCandidateToken(
        bytes32 marketId,
        uint256 candidateIndex,
        uint256 amount
    ) external {
        Market storage market = markets[marketId];
        require(candidateIndex < market.candidateTokens.length, "Invalid candidate index");
        uint256 pricePerToken = 1e6; // 1 USDC (6 decimals)
        uint256 cost = (pricePerToken * amount) / 1e18;
        currency.safeTransferFrom(msg.sender, address(this), cost);
        market.candidateTokens[candidateIndex].mint(msg.sender, amount);
    }

    function settleOutcomeTokens(bytes32 marketId) public returns (uint256 payout) {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");

        uint256 correctBalance = 0;
        if (market.assertedOutcomeIndex < market.candidateTokens.length) {
            correctBalance = market.candidateTokens[market.assertedOutcomeIndex].balanceOf(msg.sender);
        }

        for (uint256 i = 0; i < market.candidateTokens.length; i++) {
            uint256 bal = market.candidateTokens[i].balanceOf(msg.sender);
            market.candidateTokens[i].burnFrom(msg.sender, bal);
        }

        payout = correctBalance;
        currency.safeTransfer(msg.sender, payout);
        emit TokensSettled(marketId, msg.sender, payout, correctBalance);
    }

    function _getCollateralWhitelist() internal view returns (AddressWhitelist) {
        return AddressWhitelist(finder.getImplementationAddress(OracleInterfaces.CollateralWhitelist));
    }

    function _composeClaim(string memory outcome, bytes memory description) internal view returns (bytes memory) {
        return
            abi.encodePacked(
                "As of assertion timestamp ",
                ClaimData.toUtf8BytesUint(block.timestamp),
                ", the described prediction market outcome is: ",
                outcome,
                ". The market description is: ",
                description
            );
    }

    function _assertTruthWithDefaults(bytes memory claim, uint256 bond) internal returns (bytes32 assertionId) {
        assertionId = oo.assertTruth(
            claim,
            msg.sender,
            address(this),
            address(0),
            assertionLiveness,
            currency,
            bond,
            defaultIdentifier,
            bytes32(0)
        );
    }
}
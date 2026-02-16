// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IAgentPredictionMarket
 * @dev Minimal interface for prediction market used by the agent wallet.
 * Compatible with MockPredictionMarket and any market that implements getPrice, buy, sell.
 */
interface IAgentPredictionMarket {
    function getPrice(bytes32 marketId) external view returns (uint256);
    function buy(bytes32 marketId, uint256 amount, bool outcome) external payable returns (uint256 positionId);
    function sell(uint256 positionId) external returns (uint256 payout);
}

/**
 * @title AgentWallet
 * @dev ERC-8004 compliant autonomous trading agent wallet
 * Holds funds and executes trades on prediction markets with built-in constraints
 */
contract AgentWallet is Ownable, ReentrancyGuard, Pausable {
    // ============ State Variables ============

    address public authorizedExecutor; // OpenClaw backend address
    address public predictionMarket; // Prediction market contract

    uint256 public maxTradeSize; // Maximum single trade amount
    uint256 public dailyLossLimit; // Maximum daily loss allowed
    uint256 public totalCapital; // Total capital deposited

    uint256 public dailyLoss; // Current daily loss
    uint256 public lastResetTimestamp; // Last time daily loss was reset

    // Market whitelist
    mapping(bytes32 => bool) public allowedMarkets;

    // Position tracking
    uint256 internal constant EXTERNAL_POSITION_NOT_SET = type(uint256).max;

    struct Position {
        bytes32 marketId;
        uint256 amount;
        uint256 entryPrice;
        bool isLong; // true = buy, false = sell
        uint256 timestamp;
        bool isOpen;
        uint256 externalPositionId; // position id on the prediction market (EXTERNAL_POSITION_NOT_SET if not set)
    }

    mapping(uint256 => Position) public positions;
    uint256 public positionCounter;

    // Trade history
    struct Trade {
        bytes32 marketId;
        uint256 amount;
        uint256 price;
        bool direction; // true = buy, false = sell
        uint256 timestamp;
        bytes32 txHash;
    }

    Trade[] public tradeHistory;

    // ============ Events ============

    event TradeExecuted(
        uint256 indexed positionId,
        bytes32 indexed marketId,
        uint256 amount,
        uint256 price,
        bool direction,
        uint256 timestamp
    );

    event PositionClosed(
        uint256 indexed positionId,
        uint256 profit,
        uint256 timestamp
    );

    event CapitalDeposited(address indexed from, uint256 amount);
    event CapitalWithdrawn(address indexed to, uint256 amount);
    event ExecutorUpdated(address indexed newExecutor);
    event MarketWhitelisted(bytes32 indexed marketId, bool status);
    event DailyLossReset(uint256 timestamp);

    // ============ Modifiers ============

    modifier onlyExecutor() {
        require(
            msg.sender == authorizedExecutor,
            "AgentWallet: caller is not authorized executor"
        );
        _;
    }

    modifier checkDailyLoss(uint256 potentialLoss) {
        _resetDailyLossIfNeeded();
        require(
            dailyLoss + potentialLoss <= dailyLossLimit,
            "AgentWallet: daily loss limit exceeded"
        );
        _;
    }

    modifier validMarket(bytes32 marketId) {
        require(
            allowedMarkets[marketId],
            "AgentWallet: market not whitelisted"
        );
        _;
    }

    // ============ Constructor ============

    constructor(
        address _owner,
        address _executor,
        address _predictionMarket,
        uint256 _maxTradeSize,
        uint256 _dailyLossLimit,
        bytes32[] memory _initialMarkets
    ) Ownable(_owner) {
        require(_owner != address(0), "AgentWallet: invalid owner");
        require(_executor != address(0), "AgentWallet: invalid executor");
        require(_predictionMarket != address(0), "AgentWallet: invalid market");

        authorizedExecutor = _executor;
        predictionMarket = _predictionMarket;
        maxTradeSize = _maxTradeSize;
        dailyLossLimit = _dailyLossLimit;
        lastResetTimestamp = block.timestamp;

        for (uint256 i = 0; i < _initialMarkets.length; i++) {
            allowedMarkets[_initialMarkets[i]] = true;
            emit MarketWhitelisted(_initialMarkets[i], true);
        }
    }

    // ============ Core Trading Functions ============

    /**
     * @dev Execute a trade on the prediction market
     * @param marketId The market identifier
     * @param amount The trade amount
     * @param direction true for buy, false for sell
     */
    function executeTrade(
        bytes32 marketId,
        uint256 amount,
        bool direction
    )
        external
        onlyExecutor
        whenNotPaused
        nonReentrant
        validMarket(marketId)
        returns (uint256 positionId)
    {
        require(amount > 0, "AgentWallet: amount must be greater than 0");
        require(amount <= maxTradeSize, "AgentWallet: exceeds max trade size");
        require(
            address(this).balance >= amount,
            "AgentWallet: insufficient balance"
        );

        // Create new position (externalPositionId set after market trade)
        positionId = positionCounter++;
        positions[positionId] = Position({
            marketId: marketId,
            amount: amount,
            entryPrice: _getCurrentPrice(marketId),
            isLong: direction,
            timestamp: block.timestamp,
            isOpen: true,
            externalPositionId: EXTERNAL_POSITION_NOT_SET
        });

        // Execute trade on prediction market and store the market's position id
        uint256 externalId = _executePredictionMarketTrade(marketId, amount, direction);
        positions[positionId].externalPositionId = externalId;

        // Record trade
        tradeHistory.push(
            Trade({
                marketId: marketId,
                amount: amount,
                price: positions[positionId].entryPrice,
                direction: direction,
                timestamp: block.timestamp,
                txHash: blockhash(block.number - 1)
            })
        );

        emit TradeExecuted(
            positionId,
            marketId,
            amount,
            positions[positionId].entryPrice,
            direction,
            block.timestamp
        );

        return positionId;
    }

    /**
     * @dev Take profit on a position
     * @param positionId The position to close
     */
    function takeProfit(
        uint256 positionId
    )
        external
        onlyExecutor
        whenNotPaused
        nonReentrant
        returns (uint256 profit)
    {
        Position storage position = positions[positionId];
        require(position.isOpen, "AgentWallet: position already closed");
        require(
            position.externalPositionId != EXTERNAL_POSITION_NOT_SET,
            "AgentWallet: no external position to close"
        );

        uint256 currentPrice = _getCurrentPrice(position.marketId);
        profit = _calculateProfit(position, currentPrice);

        require(profit > 0, "AgentWallet: no profit to take");

        // Close position on prediction market (payout is sent to this wallet)
        _closePredictionMarketPosition(position.externalPositionId);

        position.isOpen = false;

        emit PositionClosed(positionId, profit, block.timestamp);

        return profit;
    }

    /**
     * @dev Close position with stop loss
     * @param positionId The position to close
     */
    function closePosition(
        uint256 positionId
    ) external onlyExecutor whenNotPaused nonReentrant {
        Position storage position = positions[positionId];
        require(position.isOpen, "AgentWallet: position already closed");
        require(
            position.externalPositionId != EXTERNAL_POSITION_NOT_SET,
            "AgentWallet: no external position to close"
        );

        uint256 currentPrice = _getCurrentPrice(position.marketId);
        uint256 loss = _calculateLoss(position, currentPrice);

        // Enforce daily loss limit before closing
        _resetDailyLossIfNeeded();
        require(
            dailyLoss + loss <= dailyLossLimit,
            "AgentWallet: daily loss limit exceeded"
        );
        dailyLoss += loss;

        // Close position on prediction market (payout is sent to this wallet)
        _closePredictionMarketPosition(position.externalPositionId);

        position.isOpen = false;

        emit PositionClosed(positionId, 0, block.timestamp);
    }

    // ============ Capital Management ============

    /**
     * @dev Deposit capital into the agent wallet
     */
    function depositCapital() external payable onlyOwner {
        require(msg.value > 0, "AgentWallet: must deposit some amount");
        totalCapital += msg.value;
        emit CapitalDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw capital from the agent wallet
     * @param amount The amount to withdraw
     */
    function withdrawCapital(uint256 amount) external onlyOwner nonReentrant {
        require(
            amount <= address(this).balance,
            "AgentWallet: insufficient balance"
        );
        totalCapital -= amount;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "AgentWallet: withdrawal failed");

        emit CapitalWithdrawn(owner(), amount);
    }

    // ============ Configuration Functions ============

    /**
     * @dev Update the authorized executor address
     * @param newExecutor The new executor address
     */
    function updateExecutor(address newExecutor) external onlyOwner {
        require(newExecutor != address(0), "AgentWallet: invalid executor");
        authorizedExecutor = newExecutor;
        emit ExecutorUpdated(newExecutor);
    }

    /**
     * @dev Whitelist or blacklist a market
     * @param marketId The market identifier
     * @param status true to whitelist, false to blacklist
     */
    function setMarketWhitelist(
        bytes32 marketId,
        bool status
    ) external onlyOwner {
        allowedMarkets[marketId] = status;
        emit MarketWhitelisted(marketId, status);
    }

    /**
     * @dev Batch whitelist markets
     * @param marketIds Array of market identifiers
     * @param statuses Array of whitelist statuses
     */
    function batchSetMarketWhitelist(
        bytes32[] calldata marketIds,
        bool[] calldata statuses
    ) external onlyOwner {
        require(
            marketIds.length == statuses.length,
            "AgentWallet: array length mismatch"
        );

        for (uint256 i = 0; i < marketIds.length; i++) {
            allowedMarkets[marketIds[i]] = statuses[i];
            emit MarketWhitelisted(marketIds[i], statuses[i]);
        }
    }

    /**
     * @dev Update max trade size
     * @param newMaxTradeSize The new maximum trade size
     */
    function updateMaxTradeSize(uint256 newMaxTradeSize) external onlyOwner {
        require(newMaxTradeSize > 0, "AgentWallet: invalid trade size");
        maxTradeSize = newMaxTradeSize;
    }

    /**
     * @dev Update daily loss limit
     * @param newDailyLossLimit The new daily loss limit
     */
    function updateDailyLossLimit(
        uint256 newDailyLossLimit
    ) external onlyOwner {
        require(newDailyLossLimit > 0, "AgentWallet: invalid loss limit");
        dailyLossLimit = newDailyLossLimit;
    }

    /**
     * @dev Update prediction market contract address
     * @param newMarket The new prediction market address
     */
    function updatePredictionMarket(address newMarket) external onlyOwner {
        require(newMarket != address(0), "AgentWallet: invalid market");
        predictionMarket = newMarket;
    }

    // ============ Emergency Controls ============

    /**
     * @dev Pause all trading operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume trading operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw all funds
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "AgentWallet: emergency withdrawal failed");
    }

    // ============ View Functions ============

    /**
     * @dev Get wallet balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get position details
     */
    function getPosition(
        uint256 positionId
    ) external view returns (Position memory) {
        return positions[positionId];
    }

    /**
     * @dev Get all open positions
     */
    function getOpenPositions() external view returns (uint256[] memory) {
        uint256 openCount = 0;

        // Count open positions
        for (uint256 i = 0; i < positionCounter; i++) {
            if (positions[i].isOpen) {
                openCount++;
            }
        }

        // Populate array
        uint256[] memory openPositions = new uint256[](openCount);
        uint256 index = 0;

        for (uint256 i = 0; i < positionCounter; i++) {
            if (positions[i].isOpen) {
                openPositions[index] = i;
                index++;
            }
        }

        return openPositions;
    }

    /**
     * @dev Get trade history count
     */
    function getTradeHistoryCount() external view returns (uint256) {
        return tradeHistory.length;
    }

    /**
     * @dev Get trade by index
     */
    function getTrade(uint256 index) external view returns (Trade memory) {
        require(index < tradeHistory.length, "AgentWallet: invalid index");
        return tradeHistory[index];
    }

    /**
     * @dev Get current performance metrics
     */
    function getPerformanceMetrics()
        external
        view
        returns (
            uint256 totalTrades,
            uint256 openPositionsCount,
            uint256 currentBalance,
            uint256 currentDailyLoss
        )
    {
        totalTrades = tradeHistory.length;

        uint256 openCount = 0;
        for (uint256 i = 0; i < positionCounter; i++) {
            if (positions[i].isOpen) {
                openCount++;
            }
        }

        openPositionsCount = openCount;
        currentBalance = address(this).balance;
        currentDailyLoss = dailyLoss;
    }

    // ============ Internal Functions ============

    /**
     * @dev Reset daily loss counter if 24 hours have passed
     */
    function _resetDailyLossIfNeeded() internal {
        if (block.timestamp >= lastResetTimestamp + 1 days) {
            dailyLoss = 0;
            lastResetTimestamp = block.timestamp;
            emit DailyLossReset(block.timestamp);
        }
    }

    /**
     * @dev Calculate profit from a position
     */
    function _calculateProfit(
        Position memory position,
        uint256 currentPrice
    ) internal pure returns (uint256) {
        if (position.isLong) {
            if (currentPrice > position.entryPrice) {
                return
                    ((currentPrice - position.entryPrice) * position.amount) /
                    position.entryPrice;
            }
        } else {
            if (position.entryPrice > currentPrice) {
                return
                    ((position.entryPrice - currentPrice) * position.amount) /
                    position.entryPrice;
            }
        }
        return 0;
    }

    /**
     * @dev Calculate loss from a position
     */
    function _calculateLoss(
        Position memory position,
        uint256 currentPrice
    ) internal pure returns (uint256) {
        if (position.isLong) {
            if (position.entryPrice > currentPrice) {
                return
                    ((position.entryPrice - currentPrice) * position.amount) /
                    position.entryPrice;
            }
        } else {
            if (currentPrice > position.entryPrice) {
                return
                    ((currentPrice - position.entryPrice) * position.amount) /
                    position.entryPrice;
            }
        }
        return 0;
    }

    /**
     * @dev Get current price from prediction market (basis points, e.g. 5500 = 55%)
     */
    function _getCurrentPrice(
        bytes32 marketId
    ) internal view returns (uint256) {
        return IAgentPredictionMarket(predictionMarket).getPrice(marketId);
    }

    /**
     * @dev Execute trade on prediction market; sends ETH and returns the market's position id
     */
    function _executePredictionMarketTrade(
        bytes32 marketId,
        uint256 amount,
        bool direction
    ) internal returns (uint256 externalPositionId) {
        return IAgentPredictionMarket(predictionMarket).buy{value: amount}(
            marketId,
            amount,
            direction
        );
    }

    /**
     * @dev Close position on prediction market by external position id; payout is sent to this wallet
     */
    function _closePredictionMarketPosition(
        uint256 externalPositionId
    ) internal {
        IAgentPredictionMarket(predictionMarket).sell(externalPositionId);
    }

    // ============ Receive Function ============

    receive() external payable {
        totalCapital += msg.value;
        emit CapitalDeposited(msg.sender, msg.value);
    }
}

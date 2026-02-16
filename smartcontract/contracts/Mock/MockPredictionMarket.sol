// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPredictionMarket
 * @dev Mock prediction market for testing the agent system
 * Simulates a simple binary prediction market
 */
contract MockPredictionMarket {
    
    // ============ State Variables ============
    
    struct Market {
        bytes32 marketId;
        string title;
        string description;
        uint256 yesPrice;      // Price in basis points (e.g., 5500 = 55%)
        uint256 noPrice;       // Price in basis points
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 expiryTime;
        uint256 totalVolume;
        bool isOpen;
        bool resolved;
        bool outcome;          // Final outcome (true = YES won)
    }
    
    struct Position {
        uint256 positionId;
        address owner;
        bytes32 marketId;
        uint256 shares;
        bool outcome;          // true = YES, false = NO
        uint256 entryPrice;
        bool isOpen;
    }
    
    mapping(bytes32 => Market) public markets;
    mapping(uint256 => Position) public positions;
    mapping(address => mapping(bytes32 => uint256[])) public userPositions;
    
    uint256 public positionCounter;
    bytes32[] public marketList;
    
    // ============ Events ============
    
    event MarketCreated(
        bytes32 indexed marketId,
        string title,
        uint256 expiryTime
    );
    
    event TradePlaced(
        uint256 indexed positionId,
        address indexed trader,
        bytes32 indexed marketId,
        uint256 shares,
        bool outcome,
        uint256 price
    );
    
    event PositionClosed(
        uint256 indexed positionId,
        address indexed trader,
        uint256 payout
    );
    
    event MarketResolved(
        bytes32 indexed marketId,
        bool outcome
    );
    
    event PriceUpdated(
        bytes32 indexed marketId,
        uint256 yesPrice,
        uint256 noPrice
    );
    
    // ============ Constructor ============
    
    constructor() {
        // Create some default markets for testing
        _createMarket(
            keccak256("NIGERIA_ELECTION_2027"),
            "Will incumbent win Nigerian Presidential Election 2027?",
            "Presidential election outcome prediction",
            5500, // 55% YES
            block.timestamp + 365 days
        );
        
        _createMarket(
            keccak256("SA_POLICY_CHANGE"),
            "Will South Africa implement new mining policy in 2026?",
            "Policy change prediction",
            4500, // 45% YES
            block.timestamp + 180 days
        );
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Get current price for a market
     */
    function getPrice(bytes32 marketId) external view returns (uint256) {
        return markets[marketId].yesPrice;
    }
    
    /**
     * @dev Get market information
     */
    function getMarketInfo(bytes32 marketId) 
        external 
        view 
        returns (
            string memory title,
            string memory description,
            uint256 expiryTime,
            uint256 totalVolume
        )
    {
        Market memory market = markets[marketId];
        return (
            market.title,
            market.description,
            market.expiryTime,
            market.totalVolume
        );
    }
    
    /**
     * @dev Buy shares in a market
     */
    function buy(
        bytes32 marketId,
        uint256 amount,
        bool outcome
    ) external payable returns (uint256 positionId) {
        Market storage market = markets[marketId];
        require(market.isOpen, "MockPredictionMarket: market not open");
        require(msg.value >= amount, "MockPredictionMarket: insufficient payment");
        require(block.timestamp < market.expiryTime, "MockPredictionMarket: market expired");
        
        // Calculate shares based on current price
        uint256 price = outcome ? market.yesPrice : market.noPrice;
        uint256 shares = (amount * 10000) / price;
        
        // Create position
        positionId = positionCounter++;
        positions[positionId] = Position({
            positionId: positionId,
            owner: msg.sender,
            marketId: marketId,
            shares: shares,
            outcome: outcome,
            entryPrice: price,
            isOpen: true
        });
        
        // Update market state
        if (outcome) {
            market.totalYesShares += shares;
        } else {
            market.totalNoShares += shares;
        }
        market.totalVolume += amount;
        
        // Track user positions
        userPositions[msg.sender][marketId].push(positionId);
        
        // Update prices (simple AMM-like mechanism)
        _updatePrices(marketId);
        
        emit TradePlaced(positionId, msg.sender, marketId, shares, outcome, price);
        
        return positionId;
    }
    
    /**
     * @dev Sell/close a position
     */
    function sell(uint256 positionId) external returns (uint256 payout) {
        Position storage position = positions[positionId];
        require(position.owner == msg.sender, "MockPredictionMarket: not owner");
        require(position.isOpen, "MockPredictionMarket: position closed");
        
        Market storage market = markets[position.marketId];
        require(market.isOpen, "MockPredictionMarket: market closed");
        
        // Calculate payout based on current price
        uint256 currentPrice = position.outcome ? market.yesPrice : market.noPrice;
        payout = (position.shares * currentPrice) / 10000;
        
        // Close position
        position.isOpen = false;
        
        // Update market state
        if (position.outcome) {
            market.totalYesShares -= position.shares;
        } else {
            market.totalNoShares -= position.shares;
        }
        
        // Transfer payout
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "MockPredictionMarket: payout failed");
        
        // Update prices
        _updatePrices(position.marketId);
        
        emit PositionClosed(positionId, msg.sender, payout);
        
        return payout;
    }
    
    /**
     * @dev Get position details
     */
    function getPosition(uint256 positionId)
        external
        view
        returns (
            address owner,
            bytes32 marketId,
            uint256 amount,
            bool outcome,
            bool isOpen
        )
    {
        Position memory position = positions[positionId];
        uint256 positionAmount = (position.shares * position.entryPrice) / 10000;
        
        return (
            position.owner,
            position.marketId,
            positionAmount,
            position.outcome,
            position.isOpen
        );
    }
    
    /**
     * @dev Calculate potential payout
     */
    function calculatePayout(uint256 positionId) 
        external 
        view 
        returns (uint256) 
    {
        Position memory position = positions[positionId];
        if (!position.isOpen) return 0;
        
        Market memory market = markets[position.marketId];
        uint256 currentPrice = position.outcome ? market.yesPrice : market.noPrice;
        
        return (position.shares * currentPrice) / 10000;
    }
    
    /**
     * @dev Check if market is open
     */
    function isMarketOpen(bytes32 marketId) external view returns (bool) {
        return markets[marketId].isOpen && block.timestamp < markets[marketId].expiryTime;
    }
    
    /**
     * @dev Get user's positions in a market
     */
    function getUserPositions(address user, bytes32 marketId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userPositions[user][marketId];
    }
    
    /**
     * @dev Get market liquidity (mock - returns total volume)
     */
    function getMarketLiquidity(bytes32 marketId) 
        external 
        view 
        returns (uint256) 
    {
        return markets[marketId].totalVolume;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Create a new market (public for testing)
     */
    function createMarket(
        bytes32 marketId,
        string memory title,
        string memory description,
        uint256 initialYesPrice,
        uint256 expiryTime
    ) external {
        _createMarket(marketId, title, description, initialYesPrice, expiryTime);
    }
    
    /**
     * @dev Internal function to create market
     */
    function _createMarket(
        bytes32 marketId,
        string memory title,
        string memory description,
        uint256 initialYesPrice,
        uint256 expiryTime
    ) internal {
        require(markets[marketId].expiryTime == 0, "MockPredictionMarket: market exists");
        require(initialYesPrice <= 10000, "MockPredictionMarket: invalid price");
        
        markets[marketId] = Market({
            marketId: marketId,
            title: title,
            description: description,
            yesPrice: initialYesPrice,
            noPrice: 10000 - initialYesPrice,
            totalYesShares: 0,
            totalNoShares: 0,
            expiryTime: expiryTime,
            totalVolume: 0,
            isOpen: true,
            resolved: false,
            outcome: false
        });
        
        marketList.push(marketId);
        
        emit MarketCreated(marketId, title, expiryTime);
    }
    
    /**
     * @dev Resolve a market
     */
    function resolveMarket(bytes32 marketId, bool outcome) external {
        Market storage market = markets[marketId];
        require(market.isOpen, "MockPredictionMarket: market not open");
        require(!market.resolved, "MockPredictionMarket: already resolved");
        
        market.isOpen = false;
        market.resolved = true;
        market.outcome = outcome;
        
        emit MarketResolved(marketId, outcome);
    }
    
    /**
     * @dev Manually update prices (for testing)
     */
    function updatePrice(bytes32 marketId, uint256 yesPrice) external {
        require(yesPrice <= 10000, "MockPredictionMarket: invalid price");
        markets[marketId].yesPrice = yesPrice;
        markets[marketId].noPrice = 10000 - yesPrice;
        
        emit PriceUpdated(marketId, yesPrice, 10000 - yesPrice);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Update market prices based on share distribution (simple AMM)
     */
    function _updatePrices(bytes32 marketId) internal {
        Market storage market = markets[marketId];
        
        uint256 totalShares = market.totalYesShares + market.totalNoShares;
        if (totalShares == 0) return;
        
        // Simple proportional pricing
        market.yesPrice = (market.totalYesShares * 10000) / totalShares;
        market.noPrice = 10000 - market.yesPrice;
        
        // Ensure prices stay in valid range
        if (market.yesPrice < 100) market.yesPrice = 100;
        if (market.yesPrice > 9900) market.yesPrice = 9900;
        market.noPrice = 10000 - market.yesPrice;
        
        emit PriceUpdated(marketId, market.yesPrice, market.noPrice);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get all markets
     */
    function getAllMarkets() external view returns (bytes32[] memory) {
        return marketList;
    }
    
    /**
     * @dev Get market prices
     */
    function getMarketPrices(bytes32 marketId) 
        external 
        view 
        returns (uint256 yesPrice, uint256 noPrice) 
    {
        return (markets[marketId].yesPrice, markets[marketId].noPrice);
    }
    
    // ============ Receive Function ============
    
    receive() external payable {}
}

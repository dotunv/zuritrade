// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPredictionMarket
 * @dev Interface for interacting with prediction market contracts
 * This allows the agent wallet to trade on various prediction market platforms
 */
interface IPredictionMarket {
    
    /**
     * @dev Get the current price/probability for a market
     * @param marketId The unique identifier for the market
     * @return price Current price (typically in basis points, e.g., 5500 = 55%)
     */
    function getPrice(bytes32 marketId) external view returns (uint256 price);
    
    /**
     * @dev Get market details
     * @param marketId The unique identifier for the market
     * @return title Market title
     * @return description Market description
     * @return expiryTime When the market closes
     * @return totalVolume Total trading volume
     */
    function getMarketInfo(bytes32 marketId) 
        external 
        view 
        returns (
            string memory title,
            string memory description,
            uint256 expiryTime,
            uint256 totalVolume
        );
    
    /**
     * @dev Buy a position in a market
     * @param marketId The market to trade on
     * @param amount Amount to invest (in wei)
     * @param outcome The outcome to bet on (true for YES, false for NO)
     * @return positionId Unique identifier for this position
     */
    function buy(
        bytes32 marketId,
        uint256 amount,
        bool outcome
    ) external payable returns (uint256 positionId);
    
    /**
     * @dev Sell/close a position
     * @param positionId The position to close
     * @return payout Amount received from closing the position
     */
    function sell(uint256 positionId) external returns (uint256 payout);
    
    /**
     * @dev Get position details
     * @param positionId The position identifier
     * @return owner Owner of the position
     * @return marketId Market this position is for
     * @return amount Original investment amount
     * @return outcome The outcome bet on
     * @return isOpen Whether position is still open
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
        );
    
    /**
     * @dev Calculate potential payout for closing a position
     * @param positionId The position to evaluate
     * @return expectedPayout Estimated payout if closed now
     */
    function calculatePayout(uint256 positionId) 
        external 
        view 
        returns (uint256 expectedPayout);
    
    /**
     * @dev Check if a market is still open for trading
     * @param marketId The market to check
     * @return isOpen True if market accepts new trades
     */
    function isMarketOpen(bytes32 marketId) external view returns (bool isOpen);
    
    /**
     * @dev Get user's positions in a specific market
     * @param user The user address
     * @param marketId The market identifier
     * @return positionIds Array of position IDs
     */
    function getUserPositions(address user, bytes32 marketId) 
        external 
        view 
        returns (uint256[] memory positionIds);
    
    /**
     * @dev Get liquidity available in a market
     * @param marketId The market identifier
     * @return liquidity Available liquidity
     */
    function getMarketLiquidity(bytes32 marketId) 
        external 
        view 
        returns (uint256 liquidity);
}

/**
 * @title MarketAdapter
 * @dev Adapter contract to standardize interactions with different prediction market implementations
 * Agents interact with this adapter, which then calls the appropriate prediction market
 */
contract MarketAdapter {
    
    // ============ State Variables ============
    
    address public admin;
    
    // Supported prediction market contracts
    mapping(address => bool) public supportedMarkets;
    address[] public marketList;
    
    // Market type mapping (for future multi-protocol support)
    enum MarketType { POLYMARKET, GNOSIS, CUSTOM }
    mapping(address => MarketType) public marketTypes;
    
    // Fee configuration
    uint256 public platformFee; // In basis points (e.g., 100 = 1%)
    address public feeCollector;
    
    // ============ Events ============
    
    event MarketAdded(address indexed marketAddress, MarketType marketType);
    event MarketRemoved(address indexed marketAddress);
    event TradePlaced(
        address indexed agent,
        address indexed market,
        bytes32 indexed marketId,
        uint256 amount,
        bool outcome
    );
    event PositionClosed(
        address indexed agent,
        address indexed market,
        uint256 indexed positionId,
        uint256 payout
    );
    event FeeUpdated(uint256 newFee);
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "MarketAdapter: caller is not admin");
        _;
    }
    
    modifier supportedMarket(address market) {
        require(supportedMarkets[market], "MarketAdapter: market not supported");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _feeCollector) {
        admin = msg.sender;
        feeCollector = _feeCollector;
        platformFee = 50; // 0.5% default fee
    }
    
    // ============ Market Management ============
    
    /**
     * @dev Add a supported prediction market
     */
    function addMarket(address marketAddress, MarketType marketType) 
        external 
        onlyAdmin 
    {
        require(marketAddress != address(0), "MarketAdapter: invalid address");
        require(!supportedMarkets[marketAddress], "MarketAdapter: market already added");
        
        supportedMarkets[marketAddress] = true;
        marketTypes[marketAddress] = marketType;
        marketList.push(marketAddress);
        
        emit MarketAdded(marketAddress, marketType);
    }
    
    /**
     * @dev Remove a prediction market
     */
    function removeMarket(address marketAddress) external onlyAdmin {
        require(supportedMarkets[marketAddress], "MarketAdapter: market not found");
        
        supportedMarkets[marketAddress] = false;
        
        emit MarketRemoved(marketAddress);
    }
    
    // ============ Trading Functions ============
    
    /**
     * @dev Place a trade on a prediction market
     */
    function placeTrade(
        address marketAddress,
        bytes32 marketId,
        uint256 amount,
        bool outcome
    ) 
        external 
        payable 
        supportedMarket(marketAddress)
        returns (uint256 positionId)
    {
        require(msg.value >= amount, "MarketAdapter: insufficient ETH sent");
        
        // Calculate fee
        uint256 fee = (amount * platformFee) / 10000;
        uint256 netAmount = amount - fee;
        
        // Send fee to collector
        if (fee > 0) {
            (bool feeSuccess, ) = payable(feeCollector).call{value: fee}("");
            require(feeSuccess, "MarketAdapter: fee transfer failed");
        }
        
        // Place trade on prediction market
        IPredictionMarket market = IPredictionMarket(marketAddress);
        positionId = market.buy{value: netAmount}(marketId, netAmount, outcome);
        
        emit TradePlaced(msg.sender, marketAddress, marketId, netAmount, outcome);
        
        return positionId;
    }
    
    /**
     * @dev Close a position on a prediction market
     */
    function closePosition(address marketAddress, uint256 positionId)
        external
        supportedMarket(marketAddress)
        returns (uint256 payout)
    {
        IPredictionMarket market = IPredictionMarket(marketAddress);
        
        // Verify caller owns the position
        (address owner, , , , bool isOpen) = market.getPosition(positionId);
        require(owner == msg.sender, "MarketAdapter: not position owner");
        require(isOpen, "MarketAdapter: position already closed");
        
        // Close position
        payout = market.sell(positionId);
        
        // Transfer payout to caller
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "MarketAdapter: payout transfer failed");
        
        emit PositionClosed(msg.sender, marketAddress, positionId, payout);
        
        return payout;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get market price
     */
    function getMarketPrice(address marketAddress, bytes32 marketId)
        external
        view
        supportedMarket(marketAddress)
        returns (uint256)
    {
        return IPredictionMarket(marketAddress).getPrice(marketId);
    }
    
    /**
     * @dev Get market info
     */
    function getMarketInfo(address marketAddress, bytes32 marketId)
        external
        view
        supportedMarket(marketAddress)
        returns (
            string memory title,
            string memory description,
            uint256 expiryTime,
            uint256 totalVolume
        )
    {
        return IPredictionMarket(marketAddress).getMarketInfo(marketId);
    }
    
    /**
     * @dev Calculate potential payout
     */
    function getPotentialPayout(address marketAddress, uint256 positionId)
        external
        view
        supportedMarket(marketAddress)
        returns (uint256)
    {
        return IPredictionMarket(marketAddress).calculatePayout(positionId);
    }
    
    /**
     * @dev Check if market is open
     */
    function isMarketOpen(address marketAddress, bytes32 marketId)
        external
        view
        supportedMarket(marketAddress)
        returns (bool)
    {
        return IPredictionMarket(marketAddress).isMarketOpen(marketId);
    }
    
    /**
     * @dev Get all supported markets
     */
    function getSupportedMarkets() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < marketList.length; i++) {
            if (supportedMarkets[marketList[i]]) {
                count++;
            }
        }
        
        address[] memory active = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < marketList.length; i++) {
            if (supportedMarkets[marketList[i]]) {
                active[index] = marketList[i];
                index++;
            }
        }
        
        return active;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFee) external onlyAdmin {
        require(newFee <= 500, "MarketAdapter: fee too high"); // Max 5%
        platformFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Update fee collector
     */
    function updateFeeCollector(address newCollector) external onlyAdmin {
        require(newCollector != address(0), "MarketAdapter: invalid address");
        feeCollector = newCollector;
    }
    
    /**
     * @dev Transfer admin role
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "MarketAdapter: invalid address");
        admin = newAdmin;
    }
    
    // ============ Receive Function ============
    
    receive() external payable {}
}

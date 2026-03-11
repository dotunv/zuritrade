// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PermissionManager
 * @dev Centralized permission and constraint management for agent wallets
 */
contract PermissionManager is AccessControl {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    // ============ State Variables ============
    
    // Global market registry
    struct Market {
        bytes32 marketId;
        string name;
        string region;
        bool isActive;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Market) public markets;
    bytes32[] public marketList;
    
    // Trading constraints
    struct GlobalConstraints {
        uint256 minTradeSize;
        uint256 maxTradeSize;
        uint256 minDailyLossLimit;
        uint256 maxDailyLossLimit;
        bool tradingEnabled;
    }
    
    GlobalConstraints public globalConstraints;
    
    // Agent-specific overrides
    struct AgentPermissions {
        bool canTrade;
        bool hasCustomConstraints;
        uint256 customMaxTradeSize;
        uint256 customDailyLossLimit;
        mapping(bytes32 => bool) marketAccess;
    }
    
    mapping(address => AgentPermissions) public agentPermissions;
    
    // Executor whitelist
    mapping(address => bool) public authorizedExecutors;
    
    // Emergency controls
    bool public globalTradingPaused;
    mapping(address => bool) public agentBlacklist;
    
    // ============ Events ============
    
    event MarketRegistered(bytes32 indexed marketId, string name, string region);
    event MarketStatusUpdated(bytes32 indexed marketId, bool isActive);
    event GlobalConstraintsUpdated(uint256 minTradeSize, uint256 maxTradeSize);
    event AgentPermissionsUpdated(address indexed agent, bool canTrade);
    event ExecutorAuthorized(address indexed executor, bool status);
    event GlobalTradingPaused(bool isPaused);
    event AgentBlacklisted(address indexed agent, bool isBlacklisted);
    
    // ============ Constructor ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Set default global constraints
        globalConstraints = GlobalConstraints({
            minTradeSize: 0.001 ether,
            maxTradeSize: 1 ether,
            minDailyLossLimit: 0.01 ether,
            maxDailyLossLimit: 5 ether,
            tradingEnabled: true
        });
    }
    
    // ============ Market Management ============
    
    /**
     * @dev Register a new prediction market
     */
    function registerMarket(
        bytes32 marketId,
        string memory name,
        string memory region
    ) external onlyRole(ADMIN_ROLE) {
        require(markets[marketId].createdAt == 0, "PermissionManager: market already exists");
        
        markets[marketId] = Market({
            marketId: marketId,
            name: name,
            region: region,
            isActive: true,
            createdAt: block.timestamp
        });
        
        marketList.push(marketId);
        
        emit MarketRegistered(marketId, name, region);
    }
    
    /**
     * @dev Update market status
     */
    function updateMarketStatus(bytes32 marketId, bool isActive) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(markets[marketId].createdAt != 0, "PermissionManager: market does not exist");
        markets[marketId].isActive = isActive;
        emit MarketStatusUpdated(marketId, isActive);
    }
    
    /**
     * @dev Batch register markets
     */
    function batchRegisterMarkets(
        bytes32[] memory marketIds,
        string[] memory names,
        string[] memory regions
    ) external onlyRole(ADMIN_ROLE) {
        require(
            marketIds.length == names.length && names.length == regions.length,
            "PermissionManager: array length mismatch"
        );
        
        for (uint256 i = 0; i < marketIds.length; i++) {
            if (markets[marketIds[i]].createdAt == 0) {
                markets[marketIds[i]] = Market({
                    marketId: marketIds[i],
                    name: names[i],
                    region: regions[i],
                    isActive: true,
                    createdAt: block.timestamp
                });
                
                marketList.push(marketIds[i]);
                emit MarketRegistered(marketIds[i], names[i], regions[i]);
            }
        }
    }
    
    // ============ Global Constraints ============
    
    /**
     * @dev Update global trading constraints
     */
    function updateGlobalConstraints(
        uint256 minTradeSize,
        uint256 maxTradeSize,
        uint256 minDailyLossLimit,
        uint256 maxDailyLossLimit
    ) external onlyRole(ADMIN_ROLE) {
        require(minTradeSize < maxTradeSize, "PermissionManager: invalid trade size range");
        require(minDailyLossLimit < maxDailyLossLimit, "PermissionManager: invalid loss limit range");
        
        globalConstraints.minTradeSize = minTradeSize;
        globalConstraints.maxTradeSize = maxTradeSize;
        globalConstraints.minDailyLossLimit = minDailyLossLimit;
        globalConstraints.maxDailyLossLimit = maxDailyLossLimit;
        
        emit GlobalConstraintsUpdated(minTradeSize, maxTradeSize);
    }
    
    /**
     * @dev Enable or disable global trading
     */
    function setGlobalTradingEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        globalConstraints.tradingEnabled = enabled;
    }
    
    // ============ Agent Permissions ============
    
    /**
     * @dev Set agent trading permission
     */
    function setAgentTradingPermission(address agent, bool canTrade) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        agentPermissions[agent].canTrade = canTrade;
        emit AgentPermissionsUpdated(agent, canTrade);
    }
    
    /**
     * @dev Set custom constraints for an agent
     */
    function setAgentCustomConstraints(
        address agent,
        uint256 maxTradeSize,
        uint256 dailyLossLimit
    ) external onlyRole(ADMIN_ROLE) {
        require(
            maxTradeSize >= globalConstraints.minTradeSize &&
            maxTradeSize <= globalConstraints.maxTradeSize,
            "PermissionManager: trade size out of global range"
        );
        require(
            dailyLossLimit >= globalConstraints.minDailyLossLimit &&
            dailyLossLimit <= globalConstraints.maxDailyLossLimit,
            "PermissionManager: loss limit out of global range"
        );
        
        agentPermissions[agent].hasCustomConstraints = true;
        agentPermissions[agent].customMaxTradeSize = maxTradeSize;
        agentPermissions[agent].customDailyLossLimit = dailyLossLimit;
    }
    
    /**
     * @dev Grant agent access to specific market
     */
    function grantMarketAccess(address agent, bytes32 marketId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(markets[marketId].isActive, "PermissionManager: market not active");
        agentPermissions[agent].marketAccess[marketId] = true;
    }
    
    /**
     * @dev Revoke agent access to specific market
     */
    function revokeMarketAccess(address agent, bytes32 marketId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        agentPermissions[agent].marketAccess[marketId] = false;
    }
    
    /**
     * @dev Batch grant market access
     */
    function batchGrantMarketAccess(address agent, bytes32[] memory marketIds) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        for (uint256 i = 0; i < marketIds.length; i++) {
            if (markets[marketIds[i]].isActive) {
                agentPermissions[agent].marketAccess[marketIds[i]] = true;
            }
        }
    }
    
    // ============ Executor Management ============
    
    /**
     * @dev Authorize an executor
     */
    function authorizeExecutor(address executor, bool status) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        authorizedExecutors[executor] = status;
        emit ExecutorAuthorized(executor, status);
    }
    
    /**
     * @dev Grant executor role
     */
    function grantExecutorRole(address executor) external onlyRole(ADMIN_ROLE) {
        grantRole(EXECUTOR_ROLE, executor);
        authorizedExecutors[executor] = true;
        emit ExecutorAuthorized(executor, true);
    }
    
    // ============ Emergency Controls ============
    
    /**
     * @dev Pause all trading globally
     */
    function pauseGlobalTrading() external onlyRole(ADMIN_ROLE) {
        globalTradingPaused = true;
        emit GlobalTradingPaused(true);
    }
    
    /**
     * @dev Resume global trading
     */
    function resumeGlobalTrading() external onlyRole(ADMIN_ROLE) {
        globalTradingPaused = false;
        emit GlobalTradingPaused(false);
    }
    
    /**
     * @dev Blacklist an agent
     */
    function blacklistAgent(address agent, bool isBlacklisted) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        agentBlacklist[agent] = isBlacklisted;
        emit AgentBlacklisted(agent, isBlacklisted);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Check if agent can trade
     */
    function canAgentTrade(address agent) external view returns (bool) {
        if (globalTradingPaused || agentBlacklist[agent]) {
            return false;
        }
        return agentPermissions[agent].canTrade && globalConstraints.tradingEnabled;
    }
    
    /**
     * @dev Check if agent has market access
     */
    function hasMarketAccess(address agent, bytes32 marketId) 
        external 
        view 
        returns (bool) 
    {
        return agentPermissions[agent].marketAccess[marketId] && markets[marketId].isActive;
    }
    
    /**
     * @dev Get agent constraints
     */
    function getAgentConstraints(address agent) 
        external 
        view 
        returns (uint256 maxTradeSize, uint256 dailyLossLimit) 
    {
        if (agentPermissions[agent].hasCustomConstraints) {
            return (
                agentPermissions[agent].customMaxTradeSize,
                agentPermissions[agent].customDailyLossLimit
            );
        }
        return (globalConstraints.maxTradeSize, globalConstraints.maxDailyLossLimit);
    }
    
    /**
     * @dev Check if executor is authorized
     */
    function isExecutorAuthorized(address executor) external view returns (bool) {
        return authorizedExecutors[executor];
    }
    
    /**
     * @dev Get market details
     */
    function getMarket(bytes32 marketId) 
        external 
        view 
        returns (
            string memory name,
            string memory region,
            bool isActive,
            uint256 createdAt
        ) 
    {
        Market memory market = markets[marketId];
        return (market.name, market.region, market.isActive, market.createdAt);
    }
    
    /**
     * @dev Get all registered markets
     */
    function getAllMarkets() external view returns (bytes32[] memory) {
        return marketList;
    }
    
    /**
     * @dev Get active markets count
     */
    function getActiveMarketsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < marketList.length; i++) {
            if (markets[marketList[i]].isActive) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Get global constraints
     */
    function getGlobalConstraints() 
        external 
        view 
        returns (
            uint256 minTradeSize,
            uint256 maxTradeSize,
            uint256 minDailyLossLimit,
            uint256 maxDailyLossLimit,
            bool tradingEnabled
        ) 
    {
        return (
            globalConstraints.minTradeSize,
            globalConstraints.maxTradeSize,
            globalConstraints.minDailyLossLimit,
            globalConstraints.maxDailyLossLimit,
            globalConstraints.tradingEnabled
        );
    }
}

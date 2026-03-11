// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentWallet.sol";

/**
 * @title AgentFactory
 * @dev Factory contract to deploy and manage agent wallets
 */
contract AgentFactory {
    
    // ============ State Variables ============
    
    address public admin;
    address public defaultExecutor; // Default OpenClaw backend address
    address public predictionMarket;
    
    // Mapping from user to their agents
    mapping(address => address[]) public userAgents;
    
    // Mapping to check if an address is a valid agent
    mapping(address => bool) public isAgent;
    
    // All deployed agents
    address[] public allAgents;
    
    // Agent configuration templates
    struct AgentConfig {
        uint256 maxTradeSize;
        uint256 dailyLossLimit;
        bytes32[] initialMarkets;
    }
    
    // Pre-defined risk profiles
    enum RiskProfile { CONSERVATIVE, MODERATE, AGGRESSIVE }
    
    mapping(RiskProfile => AgentConfig) public riskProfiles;
    
    // ============ Events ============
    
    event AgentCreated(
        address indexed owner,
        address indexed agentAddress,
        uint256 maxTradeSize,
        uint256 dailyLossLimit,
        uint256 timestamp
    );
    
    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event PredictionMarketUpdated(address indexed oldMarket, address indexed newMarket);
    event RiskProfileUpdated(RiskProfile indexed profile, uint256 maxTradeSize, uint256 dailyLossLimit);
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "AgentFactory: caller is not admin");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _executor, address _predictionMarket) {
        require(_executor != address(0), "AgentFactory: invalid executor");
        require(_predictionMarket != address(0), "AgentFactory: invalid market");
        
        admin = msg.sender;
        defaultExecutor = _executor;
        predictionMarket = _predictionMarket;
        
        // Initialize risk profiles (amounts in wei)
        riskProfiles[RiskProfile.CONSERVATIVE] = AgentConfig({
            maxTradeSize: 0.05 ether,      // 0.05 ETH per trade
            dailyLossLimit: 0.1 ether,     // 0.1 ETH daily loss
            initialMarkets: new bytes32[](0)
        });
        
        riskProfiles[RiskProfile.MODERATE] = AgentConfig({
            maxTradeSize: 0.1 ether,       // 0.1 ETH per trade
            dailyLossLimit: 0.25 ether,    // 0.25 ETH daily loss
            initialMarkets: new bytes32[](0)
        });
        
        riskProfiles[RiskProfile.AGGRESSIVE] = AgentConfig({
            maxTradeSize: 0.25 ether,      // 0.25 ETH per trade
            dailyLossLimit: 0.5 ether,     // 0.5 ETH daily loss
            initialMarkets: new bytes32[](0)
        });
    }
    
    // ============ Agent Creation Functions ============
    
    /**
     * @dev Create a new agent with custom parameters
     * @param maxTradeSize Maximum size per trade
     * @param dailyLossLimit Maximum daily loss allowed
     * @param initialMarkets Array of market IDs to whitelist
     * @return agentAddress Address of the newly created agent
     */
    function createAgent(
        uint256 maxTradeSize,
        uint256 dailyLossLimit,
        bytes32[] memory initialMarkets
    ) external returns (address agentAddress) {
        return _deployAgent(msg.sender, maxTradeSize, dailyLossLimit, initialMarkets);
    }
    
    /**
     * @dev Create agent using a pre-defined risk profile
     * @param profile The risk profile to use
     * @param initialMarkets Array of market IDs to whitelist
     * @return agentAddress Address of the newly created agent
     */
    function createAgentWithProfile(
        RiskProfile profile,
        bytes32[] memory initialMarkets
    ) external returns (address agentAddress) {
        AgentConfig memory config = riskProfiles[profile];
        return _deployAgent(msg.sender, config.maxTradeSize, config.dailyLossLimit, initialMarkets);
    }
    
    /**
     * @dev Internal function to deploy a new agent
     */
    function _deployAgent(
        address owner,
        uint256 maxTradeSize,
        uint256 dailyLossLimit,
        bytes32[] memory initialMarkets
    ) internal returns (address) {
        require(maxTradeSize > 0, "AgentFactory: invalid max trade size");
        require(dailyLossLimit > 0, "AgentFactory: invalid daily loss limit");
        
        // Deploy new agent wallet (initial whitelist set in constructor)
        AgentWallet agent = new AgentWallet(
            owner,
            defaultExecutor,
            predictionMarket,
            maxTradeSize,
            dailyLossLimit,
            initialMarkets
        );
        
        address agentAddress = address(agent);
        
        // Record agent
        userAgents[owner].push(agentAddress);
        isAgent[agentAddress] = true;
        allAgents.push(agentAddress);
        
        emit AgentCreated(
            owner,
            agentAddress,
            maxTradeSize,
            dailyLossLimit,
            block.timestamp
        );
        
        return agentAddress;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get all agents created by a user
     * @param user The user address
     * @return Array of agent addresses
     */
    function getUserAgents(address user) external view returns (address[] memory) {
        return userAgents[user];
    }
    
    /**
     * @dev Get total number of agents
     */
    function getTotalAgents() external view returns (uint256) {
        return allAgents.length;
    }
    
    /**
     * @dev Get agent at index
     */
    function getAgentAtIndex(uint256 index) external view returns (address) {
        require(index < allAgents.length, "AgentFactory: index out of bounds");
        return allAgents[index];
    }
    
    /**
     * @dev Check if address is a valid agent
     */
    function isValidAgent(address agent) external view returns (bool) {
        return isAgent[agent];
    }
    
    /**
     * @dev Get risk profile configuration
     */
    function getRiskProfile(RiskProfile profile) external view returns (
        uint256 maxTradeSize,
        uint256 dailyLossLimit
    ) {
        AgentConfig memory config = riskProfiles[profile];
        return (config.maxTradeSize, config.dailyLossLimit);
    }
    
    /**
     * @dev Get detailed agent info
     */
    function getAgentInfo(address agentAddress) external view returns (
        address owner,
        address executor,
        uint256 maxTradeSize,
        uint256 dailyLossLimit,
        uint256 balance,
        bool isPaused
    ) {
        require(isAgent[agentAddress], "AgentFactory: not a valid agent");
        
        AgentWallet agent = AgentWallet(payable(agentAddress));
        
        owner = agent.owner();
        executor = agent.authorizedExecutor();
        maxTradeSize = agent.maxTradeSize();
        dailyLossLimit = agent.dailyLossLimit();
        balance = agent.getBalance();
        isPaused = agent.paused();
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update default executor for new agents
     * @param newExecutor The new executor address
     */
    function updateDefaultExecutor(address newExecutor) external onlyAdmin {
        require(newExecutor != address(0), "AgentFactory: invalid executor");
        address oldExecutor = defaultExecutor;
        defaultExecutor = newExecutor;
        emit ExecutorUpdated(oldExecutor, newExecutor);
    }
    
    /**
     * @dev Update prediction market address
     * @param newMarket The new market address
     */
    function updatePredictionMarket(address newMarket) external onlyAdmin {
        require(newMarket != address(0), "AgentFactory: invalid market");
        address oldMarket = predictionMarket;
        predictionMarket = newMarket;
        emit PredictionMarketUpdated(oldMarket, newMarket);
    }
    
    /**
     * @dev Update risk profile configuration
     * @param profile The risk profile to update
     * @param maxTradeSize New max trade size
     * @param dailyLossLimit New daily loss limit
     */
    function updateRiskProfile(
        RiskProfile profile,
        uint256 maxTradeSize,
        uint256 dailyLossLimit
    ) external onlyAdmin {
        require(maxTradeSize > 0, "AgentFactory: invalid max trade size");
        require(dailyLossLimit > 0, "AgentFactory: invalid daily loss limit");
        
        riskProfiles[profile].maxTradeSize = maxTradeSize;
        riskProfiles[profile].dailyLossLimit = dailyLossLimit;
        
        emit RiskProfileUpdated(profile, maxTradeSize, dailyLossLimit);
    }
    
    /**
     * @dev Transfer admin role
     * @param newAdmin The new admin address
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "AgentFactory: invalid admin");
        admin = newAdmin;
    }
}

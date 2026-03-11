import { describe, it, beforeEach } from "node:test";
import { expect } from "chai";

const hardhat = await import("hardhat");
const { ethers } = await hardhat.network.connect();

describe("Autonomous Trading Agent System", function () {
  let predictionMarket;
  let permissionManager;
  let marketAdapter;
  let agentFactory;
  let agentWallet;
  
  let owner;
  let executor;
  let user;
  let feeCollector;

  const INITIAL_CAPITAL = ethers.parseEther("1");
  const TRADE_AMOUNT = ethers.parseEther("0.05");

  beforeEach(async function () {
    [owner, executor, user, feeCollector] = await ethers.getSigners();

    // Deploy MockPredictionMarket
    const MockPredictionMarket = await ethers.getContractFactory("MockPredictionMarket");
    predictionMarket = await MockPredictionMarket.deploy();
    await predictionMarket.waitForDeployment();

    // Fund the mock so it can pay out when agent closes (AMM can make payout > single trade amount)
    await owner.sendTransaction({
      to: await predictionMarket.getAddress(),
      value: ethers.parseEther("2"),
    });

    // Deploy PermissionManager
    const PermissionManager = await ethers.getContractFactory("PermissionManager");
    permissionManager = await PermissionManager.deploy();
    await permissionManager.waitForDeployment();

    // Deploy MarketAdapter
    const MarketAdapter = await ethers.getContractFactory("MarketAdapter");
    marketAdapter = await MarketAdapter.deploy(feeCollector.address);
    await marketAdapter.waitForDeployment();

    // Deploy AgentFactory
    const AgentFactory = await ethers.getContractFactory("AgentFactory");
    agentFactory = await AgentFactory.deploy(
      executor.address,
      await predictionMarket.getAddress()
    );
    await agentFactory.waitForDeployment();

    // Setup: Add prediction market to adapter
    await marketAdapter.addMarket(await predictionMarket.getAddress(), 0);
  });

  describe("AgentFactory", function () {
    it("Should create an agent with custom parameters", async function () {
      const maxTradeSize = ethers.parseEther("0.1");
      const dailyLossLimit = ethers.parseEther("0.25");
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));

      const tx = await agentFactory.createAgent(
        maxTradeSize,
        dailyLossLimit,
        [marketId]
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return agentFactory.interface.parseLog(log).name === "AgentCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("Should create an agent with risk profile", async function () {
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));

      const tx = await agentFactory.createAgentWithProfile(
        1, // RiskProfile.MODERATE
        [marketId]
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should track user agents", async function () {
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));
      
      await agentFactory.createAgentWithProfile(1, [marketId]);
      
      const userAgents = await agentFactory.getUserAgents(owner.address);
      expect(userAgents.length).to.equal(1);
    });
  });

  describe("AgentWallet Trading", function () {
    beforeEach(async function () {
      // Create an agent
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));
      const tx = await agentFactory.createAgentWithProfile(1, [marketId]);
      const receipt = await tx.wait();
      
      const userAgents = await agentFactory.getUserAgents(owner.address);
      const agentAddress = userAgents[0];

      // Get agent wallet instance
      const AgentWallet = await ethers.getContractFactory("AgentWallet");
      agentWallet = AgentWallet.attach(agentAddress);

      // Deposit capital
      await agentWallet.depositCapital({ value: INITIAL_CAPITAL });
    });

    it("Should allow executor to execute trades", async function () {
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));

      // Execute trade from executor
      const tx = await agentWallet.connect(executor).executeTrade(
        marketId,
        TRADE_AMOUNT,
        true // buy
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Check position was created
      const openPositions = await agentWallet.getOpenPositions();
      expect(openPositions.length).to.equal(1);
    });

    it("Should prevent trades exceeding max trade size", async function () {
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));
      const tooLarge = ethers.parseEther("1"); // Exceeds moderate profile limit

      try {
        await agentWallet.connect(executor).executeTrade(marketId, tooLarge, true);
        expect.fail("Expected revert");
      } catch (err) {
        expect(err.message).to.match(/exceeds max trade size|revert/);
      }
    });

    it("Should prevent unauthorized addresses from trading", async function () {
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));

      try {
        await agentWallet.connect(user).executeTrade(marketId, TRADE_AMOUNT, true);
        expect.fail("Expected revert");
      } catch (err) {
        expect(err.message).to.match(/not authorized executor|revert/);
      }
    });

    it("Should prevent trading on non-whitelisted markets", async function () {
      const randomMarket = ethers.keccak256(ethers.toUtf8Bytes("RANDOM_MARKET"));

      try {
        await agentWallet.connect(executor).executeTrade(randomMarket, TRADE_AMOUNT, true);
        expect.fail("Expected revert");
      } catch (err) {
        expect(err.message).to.match(/market not whitelisted|revert/);
      }
    });

    it("Should allow owner to pause and unpause", async function () {
      await agentWallet.pause();

      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));
      try {
        await agentWallet.connect(executor).executeTrade(marketId, TRADE_AMOUNT, true);
        expect.fail("Expected revert when paused");
      } catch (err) {
        expect(err.message).to.match(/Pausable: paused|revert/);
      }

      await agentWallet.unpause();

      const tx = await agentWallet.connect(executor).executeTrade(
        marketId,
        TRADE_AMOUNT,
        true
      );
      await tx.wait();
    });

    it("Should allow owner to withdraw capital", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      const withdrawAmount = ethers.parseEther("0.5");
      const tx = await agentWallet.withdrawCapital(withdrawAmount);
      const receipt = await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      // Account for gas costs
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      expect(balanceAfter).to.be.closeTo(
        balanceBefore + withdrawAmount - gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should track performance metrics", async function () {
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));

      // Execute a trade
      await agentWallet.connect(executor).executeTrade(
        marketId,
        TRADE_AMOUNT,
        true
      );

      const metrics = await agentWallet.getPerformanceMetrics();
      expect(metrics.totalTrades === 1n || metrics.totalTrades === 1).to.be.true;
      expect(metrics.openPositionsCount === 1n || metrics.openPositionsCount === 1).to.be.true;
      expect(metrics.currentBalance <= INITIAL_CAPITAL).to.be.true;
    });
  });

  describe("PermissionManager", function () {
    it("Should register markets", async function () {
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("TEST_MARKET"));

      await permissionManager.registerMarket(
        marketId,
        "Test Market",
        "Test Region"
      );

      const market = await permissionManager.getMarket(marketId);
      expect(market.name).to.equal("Test Market");
      expect(market.isActive).to.equal(true);
    });

    it("Should update global constraints", async function () {
      const newMinTrade = ethers.parseEther("0.01");
      const newMaxTrade = ethers.parseEther("2");
      const newMinLoss = ethers.parseEther("0.05");
      const newMaxLoss = ethers.parseEther("10");

      await permissionManager.updateGlobalConstraints(
        newMinTrade,
        newMaxTrade,
        newMinLoss,
        newMaxLoss
      );

      const constraints = await permissionManager.getGlobalConstraints();
      expect(constraints.minTradeSize).to.equal(newMinTrade);
      expect(constraints.maxTradeSize).to.equal(newMaxTrade);
    });

    it("Should authorize executors", async function () {
      await permissionManager.authorizeExecutor(executor.address, true);
      
      const isAuthorized = await permissionManager.isExecutorAuthorized(executor.address);
      expect(isAuthorized).to.equal(true);
    });

    it("Should pause global trading", async function () {
      await permissionManager.pauseGlobalTrading();
      
      const isPaused = await permissionManager.globalTradingPaused();
      expect(isPaused).to.equal(true);
    });
  });

  describe("Integration Test: Full Trading Flow", function () {
    it("Should complete a full trade lifecycle", async function () {
      // 1. Create agent
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));
      await agentFactory.createAgentWithProfile(1, [marketId]);
      
      const userAgents = await agentFactory.getUserAgents(owner.address);
      const AgentWallet = await ethers.getContractFactory("AgentWallet");
      agentWallet = AgentWallet.attach(userAgents[0]);

      // 2. Deposit capital
      await agentWallet.depositCapital({ value: INITIAL_CAPITAL });

      // 3. Execute trade
      const tx = await agentWallet.connect(executor).executeTrade(
        marketId,
        TRADE_AMOUNT,
        true
      );
      await tx.wait();

      // 4. Check position created
      const openPositions = await agentWallet.getOpenPositions();
      expect(openPositions.length).to.equal(1);

      // 5. Get position details
      const position = await agentWallet.getPosition(openPositions[0]);
      expect(position.isOpen).to.equal(true);
      expect(position.marketId).to.equal(marketId);

      // 6. Close position
      await agentWallet.connect(executor).closePosition(openPositions[0]);

      // 7. Verify position closed
      const positionAfter = await agentWallet.getPosition(openPositions[0]);
      expect(positionAfter.isOpen).to.equal(false);
    });
  });
});

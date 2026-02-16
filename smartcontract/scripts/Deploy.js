import hre from "hardhat";
import fs from "fs";

async function main() {
    const connection = await hre.network.connect();
    const { ethers } = connection;
    const networkName = connection.networkName ?? hre.globalOptions?.network ?? "unknown";

    console.log("Starting deployment of Autonomous Political Trading Agent contracts...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString(), "\n");

    // Configuration
    const EXECUTOR_ADDRESS = process.env.EXECUTOR_ADDRESS || deployer.address;
    const FEE_COLLECTOR_ADDRESS = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;

    console.log("Configuration:");
    console.log("- Executor Address:", EXECUTOR_ADDRESS);
    console.log("- Fee Collector:", FEE_COLLECTOR_ADDRESS);
    console.log("\n");

    // 1. Deploy MockPredictionMarket
    console.log("1. Deploying MockPredictionMarket...");
    const MockPredictionMarket = await ethers.getContractFactory("MockPredictionMarket");
    const predictionMarket = await MockPredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
    const predictionMarketAddress = await predictionMarket.getAddress();
    console.log("✅ MockPredictionMarket deployed to:", predictionMarketAddress);
    console.log("\n");

    // 2. Deploy PermissionManager
    console.log("2. Deploying PermissionManager...");
    const PermissionManager = await ethers.getContractFactory("PermissionManager");
    const permissionManager = await PermissionManager.deploy();
    await permissionManager.waitForDeployment();
    const permissionManagerAddress = await permissionManager.getAddress();
    console.log("✅ PermissionManager deployed to:", permissionManagerAddress);
    console.log("\n");

    // 3. Deploy MarketAdapter
    console.log("3. Deploying MarketAdapter...");
    const MarketAdapter = await ethers.getContractFactory("MarketAdapter");
    const marketAdapter = await MarketAdapter.deploy(FEE_COLLECTOR_ADDRESS);
    await marketAdapter.waitForDeployment();
    const marketAdapterAddress = await marketAdapter.getAddress();
    console.log("✅ MarketAdapter deployed to:", marketAdapterAddress);
    console.log("\n");

    // 4. Deploy AgentFactory
    console.log("4. Deploying AgentFactory...");
    const AgentFactory = await ethers.getContractFactory("AgentFactory");
    const agentFactory = await AgentFactory.deploy(
        EXECUTOR_ADDRESS,
        predictionMarketAddress
    );
    await agentFactory.waitForDeployment();
    const agentFactoryAddress = await agentFactory.getAddress();
    console.log("✅ AgentFactory deployed to:", agentFactoryAddress);
    console.log("\n");

    // Setup: Add prediction market to adapter
    console.log("5. Setting up MarketAdapter...");
    const addMarketTx = await marketAdapter.addMarket(
        predictionMarketAddress,
        0 // MarketType.POLYMARKET (or use appropriate type)
    );
    await addMarketTx.wait();
    console.log("✅ Added prediction market to adapter");
    console.log("\n");

    // Setup: Register markets in PermissionManager
    console.log("6. Registering markets in PermissionManager...");
    const marketId1 = ethers.keccak256(ethers.toUtf8Bytes("NIGERIA_ELECTION_2027"));
    const marketId2 = ethers.keccak256(ethers.toUtf8Bytes("SA_POLICY_CHANGE"));

    const registerTx = await permissionManager.batchRegisterMarkets(
        [marketId1, marketId2],
        ["Nigerian Presidential Election 2027", "South Africa Mining Policy Change 2026"],
        ["Nigeria", "South Africa"]
    );
    await registerTx.wait();
    console.log("✅ Registered default markets");
    console.log("\n");

    // Setup: Authorize executor
    console.log("7. Authorizing executor...");
    const authorizeTx = await permissionManager.authorizeExecutor(EXECUTOR_ADDRESS, true);
    await authorizeTx.wait();
    console.log("✅ Authorized executor:", EXECUTOR_ADDRESS);
    console.log("\n");

    // Deployment Summary
    console.log("=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("MockPredictionMarket:", predictionMarketAddress);
    console.log("PermissionManager:   ", permissionManagerAddress);
    console.log("MarketAdapter:       ", marketAdapterAddress);
    console.log("AgentFactory:        ", agentFactoryAddress);
    console.log("=".repeat(60));
    console.log("\n");

    // Save deployment addresses
    console.log("📝 Saving deployment addresses...");
    const deploymentInfo = {
        network: networkName,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            MockPredictionMarket: predictionMarketAddress,
            PermissionManager: permissionManagerAddress,
            MarketAdapter: marketAdapterAddress,
            AgentFactory: agentFactoryAddress,
        },
        configuration: {
            executor: EXECUTOR_ADDRESS,
            feeCollector: FEE_COLLECTOR_ADDRESS,
        },
    };

    fs.writeFileSync(
        `deployment-${networkName}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("✅ Deployment info saved to deployment-" + networkName + ".json");
    console.log("\n");

    // Next steps
    console.log("=".repeat(60));
    console.log("NEXT STEPS");
    console.log("=".repeat(60));
    console.log("1. Verify contracts on BaseScan (set BASESCAN_API_KEY in .env first):");
    console.log("   npx hardhat run scripts/Verify.js --network", networkName);
    console.log("\n2. Create a test agent using the factory");
    console.log("\n3. Connect your OpenClaw backend to the executor address");
    console.log("\n4. Start trading!");
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

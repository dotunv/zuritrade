import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const connection = await hre.network.connect();
  const networkName = connection.networkName ?? hre.globalOptions?.network ?? process.env.HARDHAT_NETWORK ?? "baseSepolia";
  const deploymentPath = path.join(__dirname, "..", `deployment-${networkName}.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found: ${deploymentPath}`);
    console.error("Deploy first with: npx hardhat run scripts/Deploy.js --network", networkName);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts, configuration } = deployment;

  console.log("Verifying contracts on", networkName, "...\n");

  const verify = async (name, address, constructorArgs = [], contractFqn) => {
    try {
      await verifyContract(
        {
          address,
          constructorArgs,
          contract: contractFqn,
          provider: "etherscan",
        },
        hre,
      );
      console.log("✅", name, "verified at", address);
    } catch (err) {
      if (err.message?.includes("Already Verified") || err.message?.includes("already verified")) {
        console.log("✅", name, "already verified at", address);
      } else {
        console.error("❌", name, "verification failed:", err.message);
        throw err;
      }
    }
  };

  await verify("MockPredictionMarket", contracts.MockPredictionMarket, [], "contracts/Mock/MockPredictionMarket.sol:MockPredictionMarket");
  await verify("PermissionManager", contracts.PermissionManager, []);
  await verify("MarketAdapter", contracts.MarketAdapter, [configuration.feeCollector]);
  await verify("AgentFactory", contracts.AgentFactory, [
    configuration.executor,
    contracts.MockPredictionMarket,
  ]);

  console.log("\n✅ All contracts verified.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

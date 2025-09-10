/**
 * Run Complete Multisig Workflow
 * 
 * This script runs the entire multisig workflow:
 * 1. Prepare transaction
 * 2. Sign with signer 1
 * 3. Sign with signer 2
 * 4. Send transaction
 */

import { execSync } from "child_process";
import * as path from "path";

console.log("🚀 Starting multisig workflow...\n");

try {
  // Step 1: Prepare transaction
  console.log("1️⃣  Preparing transaction...");
  execSync("npx tsx src/prepare-tx.ts", { stdio: "inherit" });
  console.log("✅ Transaction prepared\n");

  // Step 2: Sign with signer 1
  console.log("2️⃣  Signing with signer 1...");
  execSync("npx tsx src/sign-tx.ts 1", { stdio: "inherit" });
  console.log("✅ Signed by signer 1\n");

  // Step 3: Sign with signer 2
  console.log("3️⃣  Signing with signer 2...");
  execSync("npx tsx src/sign-tx.ts 2", { stdio: "inherit" });
  console.log("✅ Signed by signer 2\n");

  // Step 4: Send transaction
  console.log("4️⃣  Sending transaction...");
  execSync("npx tsx src/send-tx.ts", { stdio: "inherit" });
  console.log("✅ Transaction sent\n");

  console.log("🎉 Multisig workflow completed successfully!");

} catch (error) {
  console.error("❌ Workflow failed:", error);
  process.exit(1);
}

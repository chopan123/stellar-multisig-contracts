/**
 * Send Transaction Script
 * 
 * This script loads a signed XDR transaction and submits it to the network.
 */

import {
  Networks,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables
dotenv.config();

// ---------------------------------------------------------------------
// 0. Soroban RPC (from environment variables)
const rpc = new SorobanRpc.Server(process.env.SOROBAN_RPC_URL!);

// ---------------------------------------------------------------------
// Main flow
(async () => {
  try {
    // Check if signed candidate exists
    if (!fs.existsSync("signed-xdr-candidate.xdr")) {
      throw new Error("signed-xdr-candidate.xdr not found. Run sign-tx.ts first.");
    }

    // Load the signed transaction
    const signedXdr = fs.readFileSync("signed-xdr-candidate.xdr", "utf8");
    const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

    console.log("📄 Loaded signed transaction from signed-xdr-candidate.xdr");
    console.log("🚀 Submitting transaction to network...");

    // Submit the transaction
    const result = await rpc.sendTransaction(tx);
    
    console.log("✅ Transaction submitted successfully!");
    console.log("📄 Result:", result);
    
    // Clean up intermediate files
    const filesToClean = [
      "unsigned-tx.xdr",
      "signed-by-signer-1.xdr", 
      "signed-by-signer-2.xdr",
      "signed-by-signer-3.xdr",
      "signed-xdr-candidate.xdr"
    ];
    
    filesToClean.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🧹 Cleaned up ${file}`);
      }
    });
    
  } catch (error) {
    console.error("❌ Error sending transaction:", error);
    process.exit(1);
  }
})();

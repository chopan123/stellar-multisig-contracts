/**
 * Sign Transaction with Signer 1
 * 
 * This script loads an unsigned XDR transaction and signs it with signer 1,
 * then exports the partially signed XDR.
 */

import {
  Keypair,
  Networks,
  Transaction,
} from "@stellar/stellar-sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables
dotenv.config();

// ---------------------------------------------------------------------
// 1. Generate signer 1 keypair from environment variables
const signer1 = Keypair.fromPublicKey(process.env.SIGNER_PUBLIC_0!);

console.log("🔑  Signer 1:", signer1.publicKey());

// ---------------------------------------------------------------------
// Main flow
(async () => {
  try {
    // Check if unsigned transaction exists
    if (!fs.existsSync("unsigned-tx.xdr")) {
      throw new Error("unsigned-tx.xdr not found. Run prepare-tx.ts first.");
    }

    // Load the unsigned transaction
    const unsignedXdr = fs.readFileSync("unsigned-tx.xdr", "utf8");
    const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET);

    console.log("📄 Loaded unsigned transaction");

    // Sign with signer 1
    tx.sign(signer1);

    // Export as XDR
    const signedXdr = tx.toXDR();
    
    // Save to file
    fs.writeFileSync("signed-by-signer-1.xdr", signedXdr);
    
    console.log("✅ Transaction signed by signer 1 and saved to signed-by-signer-1.xdr");
    console.log("📄 XDR:", signedXdr);
    
  } catch (error) {
    console.error("❌ Error signing transaction:", error);
    process.exit(1);
  }
})();

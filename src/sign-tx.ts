/**
 * Sign Transaction Script
 * 
 * This script loads an XDR transaction and signs it with the specified signer.
 * Usage: tsx src/sign-tx.ts <signer-number>
 * Example: tsx src/sign-tx.ts 1
 */

import {
  Keypair,
  Networks,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables
dotenv.config();

// ---------------------------------------------------------------------
// Get signer number from command line arguments
const signerNumber = process.argv[2];

if (!signerNumber || !['1', '2', '3'].includes(signerNumber)) {
  console.error("❌ Please specify signer number (1, 2, or 3)");
  console.error("Usage: tsx src/sign-tx.ts <signer-number>");
  console.error("Example: tsx src/sign-tx.ts 1");
  process.exit(1);
}

// ---------------------------------------------------------------------
// Generate signer keypair from environment variables
let signer: Keypair;
let inputFile: string;
let outputFile: string;

switch (signerNumber) {
  case '1':
    signer = Keypair.fromSecret(process.env.SIGNER_SECRET_0!);
    inputFile = "unsigned-tx.xdr";
    outputFile = "signed-by-signer-1.xdr";
    break;
  case '2':
    signer = Keypair.fromSecret(process.env.SIGNER_SECRET_1!);
    inputFile = "signed-by-signer-1.xdr";
    outputFile = "signed-by-signer-2.xdr";
    break;
  case '3':
    signer = Keypair.fromSecret(process.env.SIGNER_SECRET_2!);
    inputFile = "signed-by-signer-2.xdr";
    outputFile = "signed-by-signer-3.xdr";
    break;
}

console.log(`🔑  Signer ${signerNumber}:`, signer.publicKey());

// ---------------------------------------------------------------------
// Main flow
(async () => {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      throw new Error(`${inputFile} not found. Run prepare-tx.ts first.`);
    }

    // Load the transaction
    const xdrContent = fs.readFileSync(inputFile, "utf8");
    const tx = TransactionBuilder.fromXDR(xdrContent, Networks.TESTNET);

    console.log(`📄 Loaded transaction from ${inputFile}`);

    // Sign with the specified signer
    tx.sign(signer);

    // Export as XDR
    const signedXdr = tx.toXDR();
    
    // Save to specific signer file
    fs.writeFileSync(outputFile, signedXdr);
    
    // Also save as candidate file (latest signed version)
    fs.writeFileSync("signed-xdr-candidate.xdr", signedXdr);
    
    console.log(`✅ Transaction signed by signer ${signerNumber} and saved to ${outputFile}`);
    console.log("📄 Also saved as signed-xdr-candidate.xdr");
    console.log("📄 XDR:", signedXdr);
    
  } catch (error) {
    console.error("❌ Error signing transaction:", error);
    process.exit(1);
  }
})();

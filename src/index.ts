// =======================
// 1. Imports and Setup
// =======================
import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  Networks,
  rpc as SorobanRpc,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, assembleTransaction } from "@stellar/stellar-sdk/rpc";

import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();


// Create a new RPC server instance for interacting with Soroban
const rpc = new SorobanRpc.Server("https://mainnet.sorobanrpc.com");

// Load the keypair from the environment variable (make sure PRIVATE_KEY is set in .env)
const keypair = Keypair.fromSecret(process.env.PRIVATE_KEY!);

// =======================
// 2. Helper Types and Functions
// =======================

// Interface for DEX distribution return values
export interface DistributionReturn {
  protocol_id: SupportedProtocols;
  path: string[];
  parts: number;
  is_exact_in: boolean;
  poolHashes?: string[];
}

// Helper function to parse DEX distribution data into ScVal format for contract invocation
const dexDistributionParser = (
  dexDistributionRaw: DistributionReturn[]
): xdr.ScVal => {
  const dexDistributionScVal = dexDistributionRaw.map((distribution) => {
    return xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("bytes"),
        val: poolHashesToScVal(distribution.poolHashes),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("parts"),
        val: nativeToScVal(distribution.parts, { type: "u32" }),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("path"),
        val: nativeToScVal(
          distribution.path.map((pathAddress) => new Address(pathAddress))
        ),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("protocol_id"),
        val: nativeToScVal(protocolIdToNumber(distribution.protocol_id), {
          type: "u32",
        }),
      }),
    ]);
  });

  return xdr.ScVal.scvVec(dexDistributionScVal);
};

// Helper to convert pool hashes (if any) to ScVal format
function poolHashesToScVal(poolHashes?: string[]): xdr.ScVal {
  if (!poolHashes || poolHashes.length === 0) {
    return nativeToScVal(null);
  }

  // Convert each Base64 string to ScVal (BytesN<32>)
  const scVec: xdr.ScVal[] = poolHashes.map((base64Str) => {
    // Basic validation for non-empty string
    if (!base64Str || typeof base64Str !== "string") {
      throw new Error(`Invalid Base64 string: ${base64Str}`);
    }

    try {
      // Decode Base64 string to Buffer
      const buf = Buffer.from(base64Str, "base64");

      // Validate buffer length (must be 32 bytes for BytesN<32>)
      if (buf.length !== 32) {
        throw new Error(
          `Expected 32 bytes, got ${buf.length} bytes for Base64 string: ${base64Str}`
        );
      }

      // Create ScVal for BytesN<32>
      return xdr.ScVal.scvBytes(buf);
    } catch (e) {
      throw new Error(`Invalid Base64 string: ${base64Str}`);
    }
  });

  // Wrap the vector in an Option::Some
  return xdr.ScVal.scvVec(scVec);
}

// Helper to convert protocol enum to number for contract call
function protocolIdToNumber(protocolId: SupportedProtocols) {
  switch (protocolId) {
    case SupportedProtocols.SOROSWAP:
      return 0;
    case SupportedProtocols.PHOENIX:
      return 1;
    case SupportedProtocols.AQUA:
      return 2;
    default:
      throw new Error(`Invalid protocol id: ${protocolId}`);
  }
}

// Enum for supported DEX protocols
export enum SupportedProtocols {
  SOROSWAP = "soroswap",
  PHOENIX = "phoenix",
  AQUA = "aqua",
  COMET = "comet",
}

// =======================
// 3. Transaction Sending Logic
// =======================

// Function to simulate and send a transaction to the network
export async function sendTransaction(
    transaction: Transaction,
    simulate: boolean,
    source: Keypair
  ) {
    // Simulate the transaction first
    const simulationResponse = await rpc.simulateTransaction(transaction);
  
    if (Api.isSimulationError(simulationResponse)) {
      throw Error(`Simulation error`);
    } else if (simulate) {
      // If only simulation is requested, return the simulation result
      return simulationResponse;
    }
    
    // Assemble and sign the transaction
    const assembledTransaction = assembleTransaction(transaction, simulationResponse);
    const prepped_tx = assembledTransaction.build();
    prepped_tx.sign(source);
    
    // Get the transaction hash
    const tx_hash = prepped_tx.hash().toString("hex");
    
    // Send the transaction to the network
    const response = await rpc.sendTransaction(prepped_tx);
    const status = response.status;
    
    let txResponse;
    // Poll for transaction status until it is successful
    while (status === "PENDING") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      txResponse = await rpc.getTransaction(tx_hash);
  
      if (txResponse.status === "SUCCESS") {
        break;
      }
    }
    return txResponse;
  }

// =======================
// 4. Construct Contract Arguments
// =======================

// Prepare arguments for the Soroswap aggregator contract swap
// This is where you can adjust the swap parameters and add a fee if needed
const soroswapArgs: xdr.ScVal[] = [
  new Address(
    "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"
  ).toScVal(), // Input token address
  new Address(
    "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"
  ).toScVal(), // Output token address
  nativeToScVal(9000000, { type: "i128" }), // Amount in (adjust this for fee logic)
  nativeToScVal(0, { type: "i128" }), // Minimum amount out
  dexDistributionParser([
    {
      protocol_id: SupportedProtocols.SOROSWAP,
      path: [
        "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
        "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
      ],
      parts: 10,
      is_exact_in: true,
      poolHashes: [],
    },
  ]), // DEX distribution (can be modified for fee routing)
  new Address(keypair.publicKey()).toScVal(), // User address
  nativeToScVal(Math.floor(Date.now() / 1000) + 3600, { type: "u64" }), // Deadline
];
// =======================
// 6. Main Execution: Build, Simulate, and Send Transaction
// =======================

(async () => {
  // Log the public key being used
  console.log("🚀 | keypair.publicKey():", keypair.publicKey());

  const aggregatorContract = new Contract("CDEM2W2D2SC7VU3NOCIKHZWCUNCAUWI5GUGHSWBJNBENRHSVIMUT6EM2")

  const operation = aggregatorContract.call("swap_exact_tokens_for_tokens", ...soroswapArgs)

  // Fetch the latest account state from the network
  const account = await rpc.getAccount(keypair.publicKey());

  // Build the transaction with the operation
  const buildTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
    timebounds: {
      minTime: 0,
      maxTime: 0,
    },
  })
    .setTimeout(0)
    .addOperation(operation)
    .build();

  // Simulate and send the transaction
  const sim = await sendTransaction(buildTx, true, keypair);

  // Log the simulation/transaction result
  console.log("🚀 | sim:", sim);
})();
# Soroswap Test API Fees

This repository is for testing the usage of the Stellar Router SDK to include a fee on top of the Soroswap aggregator contract. The goal is to demonstrate how you can programmatically add a fee to swaps performed via the Soroswap aggregator, enabling fee support.

It includes examples of how to build, simulate, and send transactions that perform swaps and transfers using Soroswap and other supported protocols, with the ability to add custom fee logic.

## Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

## Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/joaquinsoza/stellar-router-sdk-aggregator-fee.git
   cd stellar-router-sdk-aggregator-fee
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
3. **Configure environment variables:**
   Create a `.env` file in the root directory with the following variables:
   ```env
   PRIVATE_KEY=YOUR_STELLAR_SECRET_KEY
   RECEIVER_PUBLIC_KEY=DESTINATION_PUBLIC_KEY
   ```
   - `PRIVATE_KEY`: The secret key of the account that will sign and send transactions.
   - `RECEIVER_PUBLIC_KEY`: The public key of the account that will receive tokens in the transfer example.

## How to Use
1. **Edit the script if needed:**
   - The main logic is in `src/index.ts`. You can adjust the swap/transfer parameters, fee logic, or contracts as needed.
2. **Run the script:**
   ```sh
   npm start
   # or
   yarn start
   # or directly with tsx
   npx tsx src/index.ts
   ```
   The script will:
   - Build and simulate a swap and transfer transaction
   - Add a fee on top of the Soroswap aggregator transaction
   - Send the transaction to the Stellar network
   - Output the transaction hash and status

## Notes
- This script is for demonstration and testing purposes. Do not use your mainnet private key with significant funds unless you understand the risks.
- Make sure your account has enough XLM to cover transaction fees.
- The script uses the public Soroban RPC endpoint: `https://mainnet.sorobanrpc.com`.

## License
MIT
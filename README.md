# Stellar Multisig Contracts

This project demonstrates a 2-of-3 multisig workflow with Stellar and Soroban contracts.

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Multisig Master Account Secret Key
MASTER_SECRET=your_master_secret_key_here

# Signer Public Keys (3 signers for 2-of-3 multisig)
SIGNER_PUBLIC_0=your_signer_0_public_key_here
SIGNER_PUBLIC_1=your_signer_1_public_key_here
SIGNER_PUBLIC_2=your_signer_2_public_key_here

# Network Configuration
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
```

## Scripts

### Setup

**Setup Multisig Account** - Initialize the 2-of-3 multisig configuration:
```bash
npm run setup
```

This script will:
- Fund the master account via Friendbot
- Configure the multisig with three signers
- Set thresholds to require 2 signatures
- Display the final account configuration

### Transaction Workflow

1. **Prepare Transaction** - Creates unsigned XDR:
   ```bash
   npm run prepare-tx
   ```

2. **Sign with Signer 1** - Signs the XDR with first signer:
   ```bash
   npm run sign-1
   ```

3. **Sign with Signer 2** - Signs the XDR with second signer:
   ```bash
   npm run sign-2
   ```

4. **Send Transaction** - Submits the fully signed XDR:
   ```bash
   npm run send-tx
   ```

### Complete Workflow

Run the entire multisig workflow in one command:
```bash
npm run workflow
```

### Original Demo

Run the original demonstration script:
```bash
npm start
```

## File Flow

The scripts create and use these intermediate files:
- `unsigned-tx.xdr` - Transaction prepared but not signed
- `signed-by-signer-1.xdr` - Transaction signed by signer 1
- `fully-signed-tx.xdr` - Transaction signed by both signers
- Files are automatically cleaned up after successful submission

## Typical Usage

1. **First time setup**: Run `npm run setup` to configure the multisig account
2. **Create transactions**: Run `npm run prepare-tx` to create a new transaction
3. **Sign transactions**: Use `npm run sign-1` and `npm run sign-2` to sign
4. **Submit transactions**: Use `npm run send-tx` to submit to the network

## Security Notes

- Never commit your `.env` file (it's in `.gitignore`)
- Keep your secret keys secure
- This is for demonstration purposes - use proper key management in production

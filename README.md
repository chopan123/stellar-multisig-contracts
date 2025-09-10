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

# Signer Public Keys (for multisig setup)
SIGNER_PUBLIC_0=your_signer_0_public_key_here
SIGNER_PUBLIC_1=your_signer_1_public_key_here
SIGNER_PUBLIC_2=your_signer_2_public_key_here

# Signer Secret Keys (for signing transactions)
SIGNER_SECRET_0=your_signer_0_secret_key_here
SIGNER_SECRET_1=your_signer_1_secret_key_here
SIGNER_SECRET_2=your_signer_2_secret_key_here

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

2. **Sign Transaction** - Signs the XDR with specified signer:
   ```bash
   npm run sign-1    # Sign with signer 1
   npm run sign-2    # Sign with signer 2
   npm run sign-3    # Sign with signer 3
   ```

   Or use the script directly:
   ```bash
   tsx src/sign-tx.ts 1    # Sign with signer 1
   tsx src/sign-tx.ts 2    # Sign with signer 2
   tsx src/sign-tx.ts 3    # Sign with signer 3
   ```

3. **Send Transaction** - Submits the fully signed XDR:
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
- `signed-by-signer-2.xdr` - Transaction signed by signer 2
- `signed-by-signer-3.xdr` - Transaction signed by signer 3
- Files are automatically cleaned up after successful submission

## Typical Usage

1. **First time setup**: Run `npm run setup` to configure the multisig account
2. **Create transactions**: Run `npm run prepare-tx` to create a new transaction
3. **Sign transactions**: Use `npm run sign-1` and `npm run sign-2` to sign (2-of-3 required)
4. **Submit transactions**: Use `npm run send-tx` to submit to the network

## Multisig Requirements

- **2-of-3 signatures required** for any transaction
- Master key cannot sign transactions (weight = 0)
- Any 2 of the 3 signers can approve a transaction
- Signatures must be applied in sequence (signer 1, then signer 2, etc.)

## Security Notes

- Never commit your `.env` file (it's in `.gitignore`)
- Keep your secret keys secure
- This is for demonstration purposes - use proper key management in production
- **Setup**: Uses master secret + signer public keys
- **Signing**: Uses signer secret keys

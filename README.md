# KAIA-MCP Server

![NPM Version](https://img.shields.io/npm/v/@tamago-labs/kaia-mcp)

A comprehensive Model Context Protocol (MCP) server for interacting with multiple DeFi protocols on the KAIA blockchain. This server provides AI agents with the ability to query market data, manage positions, and execute transactions across lending protocols, DEXs, and staking platforms in the Kaia ecosystem.

## Features

### 📊 Multi-Protocol Support
- **Lending Protocols**: KiloLend (Compound v2 fork) and other lending platforms
- **DEX Integration**: DragonSwap V3 and more
- **Staking Platforms**: Kaia staking and liquid staking (planned)
- **Cross-Protocol Operations**: Yield farming strategies and portfolio optimization

### 📈 Market Information
- Get all lending markets with real-time blockchain data
- Fetch current supply/borrow APYs directly from smart contracts
- Real-time market utilization and TVL calculations
- Live price feeds from CoinGecko API
- Fetch protocol statistics and TVL
- Monitor market utilization and health

### 👛 Wallet Management
- Get wallet information and token balances
- Check account liquidity and health factors
- Monitor borrowing capacity
- Multi-protocol position tracking

### 💰 Transaction Operations (Transaction Mode)
- Send native KAIA tokens
- Send ERC-20 tokens
- Wrap/unwrap KAIA to WKAIA
- Check and manage token allowances
- Enter markets as collateral
- Supply assets to lending markets
- Borrow from lending markets
- Repay borrowed positions
- **Complete withdraw operations** (redeem cTokens or underlying tokens)
- DEX swaps and liquidity operations

## Real Blockchain Data Integration

The KAIA-MCP server fetches real-time data directly from the Kaia blockchain:

### 🔄 Live Market Data
- **Supply/Borrow APYs**: Calculated directly from smart contract interest rates
- **Total Supply/Borrows**: Real-time values from cToken contracts
- **Utilization Rates**: Live calculations based on actual market liquidity
- **Price Feeds**: Real-time token prices from CoinGecko API

### 📊 Account Information
- **Position Balances**: Actual user balances from protocol contracts
- **Health Factors**: Real-time calculations using Comptroller contract data
- **Collateral Values**: Live USD valuations based on current prices
- **Borrowing Capacity**: Accurate calculations using real market data

### 🔗 Smart Contract Integration

#### KiloLend (Compound v2) Contracts
- **Comptroller**: `0x0B5f0Ba5F13eA4Cb9C8Ee48FB75aa22B451470C2`
- **Price Oracle**: `0xBB265F42Cce932c5e383536bDf50B82e08eaf454`
- **cToken Markets**: Direct integration with all lending markets
- **Real-time Events**: Live blockchain state updates

#### DragonSwap V3 Contracts
- **Router**: `0xA324880f884036E3d21a09B90269E1aC57c7EC8a`
- **Quoter V2**: `0x673d88960D320909af24db6eE7665aF223fec060`
- **Factory**: `0x7431A23897ecA6913D5c81666345D39F27d946A4`


## Using with Claude Desktop

1. Install Claude Desktop if you haven't already
2. Open Claude Desktop settings
3. Add the KAIA MCP client to your configuration:

```json
{
  "mcpServers": {
    "kaia-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@tamago-labs/kaia-mcp"
      ],
      "env": {
        "KAIA_RPC_URL": "https://public-en.node.kaia.io",
        "KAIA_AGENT_MODE": "transaction",
        "KAIA_PRIVATE_KEY": "YOUR_PRIVATE_KEY"
      },
      "disabled": false
    }
  }
}
```

You can run it in read-only mode by omitting `KAIA_PRIVATE_KEY` and setting `KAIA_AGENT_MODE` to "readonly" (or omitting it entirely, as it defaults to readonly).


## Architecture

This MCP server follows a clean, modular architecture designed for multi-protocol support:

```
src/
├── agent/           # Core agent classes
│   └── wallet.ts    # Unified WalletAgent for all operations
├── mcp/             # MCP tool definitions
│   ├── index.ts     # Tool registry and exports
│   ├── wallet/      # KiloLend tool implementations
│   └── dragonswap/  # DragonSwap tool implementations
├── contracts/       # Smart contract interfaces
│   ├── comptroller.ts
│   ├── ctoken.ts
│   └── erc20.ts
├── dragonswap/      # DragonSwap V3 integration
│   ├── config.ts    # DragonSwap configuration
│   ├── router.ts    # Swap routing logic
│   └── contracts/abi/  # DragonSwap contract ABIs
├── utils/           # Utility functions (validation, formatting, errors)
└── config.ts        # Configuration management
```

### Key Design Principles

- **Multi-Protocol Pattern**: Extensible architecture for adding new DeFi protocols
- **Single Agent Pattern**: One `WalletAgent` class handles both read-only and transaction operations
- **Mode-Based Operation**: Automatically switches between read-only and transaction modes based on private key availability
- **Real Blockchain Data**: Direct integration with Kaia mainnet smart contracts
- **Type Safety**: Full TypeScript support with proper type definitions
- **Error Handling**: Comprehensive error handling with detailed error messages

## Installation

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
KAIA_RPC_URL="https://public-en.node.kaia.io"         # KAIA Mainnet RPC URL

# Optional
KAIA_PRIVATE_KEY="your_private_key_here"             # Wallet private key (for transaction mode)
KAIA_AGENT_MODE="readonly"                           # "readonly" or "transaction" (defaults to readonly)
KAIA_NETWORK="kaia"                                  # Network (only kaia supported currently)
```

### Agent Modes

#### Read-Only Mode (Default)
- Query market data
- Check wallet balances
- Monitor positions
- Get swap quotes
- No transaction capabilities

#### Transaction Mode
- All read-only capabilities
- Execute transactions
- Supply/borrow assets
- Transfer tokens
- Execute DEX swaps

## Available Tools

### KiloLend Tools

#### Read-Only Tools
| Tool | Description |
|------|-------------|
| `get_wallet_info` | Get wallet information and token balances |
| `get_account_liquidity` | Check account liquidity and health factor |
| `get_markets` | Get all lending markets with rates |
| `get_protocol_stats` | Get protocol statistics and TVL |

#### Transaction Tools
| Tool | Description |
|------|-------------|
| `send_native_token` | Send native KAIA tokens |
| `send_erc20_token` | Send ERC-20 tokens |
| `wrap_kaia` | Wrap KAIA to WKAIA |
| `unwrap_kaia` | Unwrap WKAIA to KAIA |
| `check_allowance` | Check token allowance for operations |
| `approve_token` | Approve tokens for KiloLend operations |
| `enter_market` | Enter markets to enable collateral usage |
| `supply_to_market` | Supply assets to lending market |
| `borrow_from_market` | Borrow from lending market |
| `repay_borrow` | Repay borrowed positions |
| `redeem_tokens` | Redeem cTokens (withdraw by cToken amount) |
| `redeem_underlying` | Redeem underlying tokens (withdraw by underlying amount) |

### DragonSwap Tools

#### Read-Only Tools
| Tool | Description |
|------|-------------|
| `dragonswap_get_pool_info` | Get DragonSwap pool information |
| `dragonswap_get_swap_quote` | Get swap quotes without executing |
| `dragonswap_get_route` | Get best routing path for swaps (supports multi-hop) |

#### Transaction Tools
| Tool | Description |
|------|-------------|
| `dragonswap_execute_swap` | Execute token swaps on DragonSwap |

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "kaia-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "KAIA_RPC_URL": "https://public-en.node.kaia.io",
        "KAIA_PRIVATE_KEY": "your_private_key",
        "KAIA_AGENT_MODE": "transaction"
      }
    }
  }
}
```

### Start the Server

```bash
# Start in read-only mode
KAIA_RPC_URL=https://public-en.node.kaia.io KAIA_AGENT_MODE=readonly node dist/index.js

# Start in transaction mode
KAIA_RPC_URL=https://public-en.node.kaia.io KAIA_PRIVATE_KEY=your_key KAIA_AGENT_MODE=transaction node dist/index.js
```

### Example Tool Calls

#### Get KiloLend Market Information
```json
{
  "tool": "get_markets",
  "arguments": {}
}
```

#### Check Account Health
```json
{
  "tool": "get_account_liquidity",
  "arguments": {
    "account_address": "0x..."
  }
}
```

#### Supply to KiloLend Market (Transaction Mode)
```json
{
  "tool": "kaia_supply_to_lending",
  "arguments": {
    "token_symbol": "USDT",
    "amount": "1000"
  }
}
```

#### Borrow from KiloLend Market (Transaction Mode)
```json
{
  "tool": "kaia_borrow_from_lending",
  "arguments": {
    "token_symbol": "KAIA",
    "amount": "100"
  }
}
```

#### Repay Borrowed Position (Transaction Mode)
```json
{
  "tool": "kaia_repay_borrow",
  "arguments": {
    "token_symbol": "KAIA",
    "amount": "50"
  }
}
```

#### Redeem cTokens (Withdraw by cToken Amount)
```json
{
  "tool": "kaia_redeem_tokens",
  "arguments": {
    "token_symbol": "USDT",
    "ctoken_amount": "100000000"
  }
}
```

#### Redeem Underlying Tokens (Withdraw by Underlying Amount)
```json
{
  "tool": "kaia_redeem_underlying",
  "arguments": {
    "token_symbol": "USDT",
    "underlying_amount": "500"
  }
}
```

#### Wrap KAIA to WKAIA (Transaction Mode)
```json
{
  "tool": "kaia_wrap_kaia",
  "arguments": {
    "amount": "100"
  }
}
```

#### Unwrap WKAIA to KAIA (Transaction Mode)
```json
{
  "tool": "kaia_unwrap_kaia",
  "arguments": {
    "amount": "100"
  }
}
```

#### Check Token Allowance
```json
{
  "tool": "kaia_check_allowance",
  "arguments": {
    "token_symbol": "USDT",
    "spender_address": "0x498823F094f6F2121CcB4e09371a57A96d619695"
  }
}
```

#### Approve Token for KiloLend Operations
```json
{
  "tool": "kaia_approve_token",
  "arguments": {
    "token_symbol": "USDT",
    "spender_address": "0x498823F094f6F2121CcB4e09371a57A96d619695",
    "amount": "1000"
  }
}
```

#### Enter Market as Collateral
```json
{
  "tool": "kaia_enter_market",
  "arguments": {
    "ctoken_addresses": ["0x498823F094f6F2121CcB4e09371a57A96d619695"]
  }
}
```

#### Get DragonSwap Quote
```json
{
  "tool": "dragonswap_get_swap_quote",
  "arguments": {
    "tokenIn": "0x3a8B8E5395787622360e5348C8C93b432e5F2A6B",
    "tokenOut": "0xd077A400968890EaCc75cDc901F0356c943e4fDb",
    "amountIn": "1000000000000000000",
    "fee": "3000"
  }
}
```

#### Execute DragonSwap Swap (Transaction Mode)
```json
{
  "tool": "dragonswap_execute_swap",
  "arguments": {
    "tokenIn": "0x3a8B8E5395787622360e5348C8C93b432e5F2A6B",
    "tokenOut": "0xd077A400968890EaCc75cDc901F0356c943e4fDb",
    "amountIn": "1000000000000000000",
    "amountOutMinimum": "1000000",
    "fee": "3000",
    "deadline": "1893456000"
  }
}
```

## Supported Networks

- **Kaia Mainnet**: Production KAIA blockchain
  - **RPC URL**: `https://public-en.node.kaia.io`

## Supported Tokens

### KiloLend Supported Tokens
- **KAIA**: Native KAIA token
- **USDT**: Tether USD
- **SIX**: SIX token
- **BORA**: BORA token
- **MBX**: MARBLEX token
- **stKAIA**: Staked KAIA

### DragonSwap Supported Tokens
- **KAIA**: Native token (`0x0000000000000000000000000000000000000000`)
- **WKAI**: Wrapped KAIA (`0x19aac5f612f524b754ca7e7c41cbfa2e981a4432`)
- **USDT**: Official USDT(`0xd077a400968890eacc75cdc901f0356c943e4fdb`)
- **USDT**: Wormhole USDT(`0x5c7F8A570d578ED84E63fDFA7b1eE72dE1a1476A`)
- **BORA**: BORA Token (`0x02cBE46fB8A1F579254a9B485788f2D86cAD51aa`)
- **MBX**: MBX Token (`0xD068c52d81f4409B9502dA926aCE3301cc41f623`)
- **stKAIA**: Lair Staked KAIA (`0x42952B873ed6f7f0A7E4992E2a9818E3A9001995`)
 

## Future Protocol Support

We're actively working on adding support for:

- **KlaySwap**: Leading Kaia DEX for swaps and liquidity
- **Additional Lending Protocols**: More lending platforms
- **Staking Protocols**: Kaia staking and liquid staking
- **Yield Farming**: Cross-protocol yield optimization
 
## Development

### Building
```bash
npm run build
```

### Testing
```bash
# Test DragonSwap functionality
node scripts/test-dragonswap-router.js
node scripts/test-dragonswap-quote.js

# Run all tests
npm test
```

### Linting
```bash
npm run lint
```

## Contract Addresses

### Kaia Mainnet

#### KiloLend (Compound v2)
- **Comptroller**: `0x0B5f0Ba5F13eA4Cb9C8Ee48FB75aa22B451470C2`
- **Price Oracle**: `0xBB265F42Cce932c5e383536bDf50B82e08eaf454`
- **Markets**:
  - cUSDT: `0x498823F094f6F2121CcB4e09371a57A96d619695`
  - cSIX: `0xC468dFD0C96691035B3b1A4CA152Cb64F0dbF64c`
  - cBORA: `0x7a937C07d49595282c711FBC613c881a83B9fDFD`
  - cMBX: `0xE321e20F0244500A194543B1EBD8604c02b8fA85`
  - cKAIA: `0x98Ab86C97Ebf33D28fc43464353014e8c9927aB3`
  - cStKAIA: `0x0BC926EF3856542134B06DCf53c86005b08B9625`

#### DragonSwap V3
- **Router**: `0xA324880f884036E3d21a09B90269E1aC57c7EC8a`
- **Quoter V2**: `0x673d88960D320909af24db6eE7665aF223fec060`
- **Factory**: `0x7431A23897ecA6913D5c81666345D39F27d946A4`

## API Response Format

All tools return responses in this format:

```json
{
  "status": "success|error",
  "message": "Human-readable message",
  "data": { ... },
  "recommendations": ["Actionable advice..."]
}
```


## Troubleshooting

If you're using Ubuntu or another Linux environment with NVM, you'll need to manually configure the path. Follow these steps:

1. Install the KAIA MCP under your current NVM-managed Node.js version.

```bash
npm install -g @tamago-labs/kaia-mcp
```

2. Due to how NVM installs libraries, you may need to use absolute paths in your config. Replace the example values below with your actual username and Node version:

```json
{
  "mcpServers": {
    "kaia-mcp": {
      "command": "/home/YOUR_NAME/.nvm/versions/node/YOUR_NODE_VERSION/bin/node",
      "args": [
        "/home/YOUR_NAME/.nvm/versions/node/YOUR_NODE_VERSION/bin/@tamago-labs/kaia-mcp"
      ],
      "env": {
        "KAIA_RPC_URL": "https://public-en.node.kaia.io",
        "KAIA_AGENT_MODE": "transaction",
        "KAIA_PRIVATE_KEY": "YOUR_PRIVATE_KEY"
      }
    }
  }
}
```

3. Restart Claude Desktop and it should work now.

### Environment Variable Issues

If you encounter issues with environment variables not being recognized:

1. **Check required variables**: Make sure `KAIA_RPC_URL` is always set
2. **Verify mode settings**: `KAIA_AGENT_MODE` should be either "readonly" or "transaction"
3. **Private key format**: `KAIA_PRIVATE_KEY` must be 64 hex characters (with or without 0x prefix)
4. **Debug logging**: The server will log all configuration on startup to stderr

Example environment validation output:
```
✅ KAIA-MCP environment configuration valid
📍 Mode: transaction
📍 Network: kaia
📍 RPC URL: https://public-en.node.kaia.io
📍 Chain ID: 8217
📍 Native Currency: KAIA
📍 Account: 0x1234...
📍 Using provided private key for transactions
```

## Work with Local Files

When working with local files especially when using KAIA CLI tools for smart contract development to create, build, and test a Move package on your machine—you'll need to import an additional MCP server library of `filesystem` made by Claude team. Use with:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "${workspaceFolder}"
  ],
  "env":{
        
  },
  "disabled": false
}
```

`workspaceFolder` refers to your working directory. You can provide more than one argument. Subfolders or specific files can then be referenced in your AI prompt.

If you're using Linux and encounter issues during setup, please refer to the troubleshooting section.
 
## License

MIT License - see LICENSE file for details.

# KAIA-MCP Server

![NPM Version](https://img.shields.io/npm/v/@tamago-labs/kaia-mcp)
![License](https://img.shields.io/badge/license-MIT-blue) 

> **AI × DeFi Infrastructure for the Kaia Ecosystem**

The **KAIA-MCP Server** enables **AI agents** to interact directly with DeFi protocols on the **KAIA blockchain**.  
Built on the **Model Context Protocol (MCP)**, it connects tools like **Claude Desktop** or **Cursor.ai** with live blockchain data and transaction execution.

---

## Features

### Multi-Protocol Support
- **Lending:** KiloLend (Compound v2 fork) for supply, borrow, and repay  
- **DEX:** DragonSwap V3 for quotes and swaps  
- **Price API:** Real-time token prices from CoinMarketCap & CoinGecko API  
- **AI-Managed Vaults:** Automated cross-protocol strategies to boost yield *(planned)*  
- **Market Intelligence:** Real-time APYs, utilization, and TVL  
- **Smart Wallet:** Unified position and balance tracking  

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

### Agent Modes

#### Read-Only Mode (Default)
- **Purpose**: Safe exploration and data analysis without transaction capabilities
- **Use Case**: Perfect for research, market analysis, and monitoring positions
- **Capabilities**: Query market data, check wallet balances, monitor positions, get swap quotes
- **Security**: No private key required - completely safe for data access
- **Configuration**: Set `KAIA_AGENT_MODE` to "readonly" or omit the private key

#### Transaction Mode
- **Purpose**: Full DeFi operations with the ability to execute transactions
- **Use Case**: Active trading, lending, borrowing, and portfolio management
- **Capabilities**: All read-only features plus execute transactions, supply/borrow assets, transfer tokens, execute DEX swaps
- **Security**: Requires `KAIA_PRIVATE_KEY` - ensure secure key management
- **Configuration**: Set `KAIA_AGENT_MODE` to "transaction" and provide a valid private key

## Architecture

This MCP server follows a clean, modular architecture designed for multi-protocol support:

```
src/
├── agent/
│   └── wallet.ts            # Unified WalletAgent for all operations
├── mcp/                     # MCP tool definitions and implementations
│   ├── index.ts             # Main MCP server entry point and tool registry
│   ├── kilolend/           # KiloLend protocol tools
│   ├── dragonswap/          # DragonSwap V3 protocol tools
│   ├── price-api/          # Price API tools for token prices
│   └── wallet/              # General wallet operations
├── tools/                  # Core utility functions
│   └── price-api/          # Price API core functions
├── contracts/               # Smart contract interfaces and ABIs
│   ├── comptroller.ts       # KiloLend Comptroller contract
│   ├── ctoken.ts           # KiloLend cToken contracts
│   ├── erc20.ts            # Standard ERC-20 interface
│   ├── wkaia.ts            # WKAIA contract interface
│   └── dragonswap/         # DragonSwap contract ABIs
├── utils/                  # Utility functions and helpers
│   ├── errors.ts           # Error handling classes
│   ├── formatting.ts       # Token amount formatting utilities
│   └── validation.ts       # Input validation functions
├── config.ts               # Configuration management and environment setup
├── types.ts                # TypeScript type definitions
└── index.ts                # Main server entry point
```

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

## Available Tools

### Wallet Tools

#### Read-Only Tools
| Tool | Description |
|------|-------------|
| `get_wallet_info` | Get wallet information and token balances |

#### Transaction Tools
| Tool | Description |
|------|-------------|
| `send_native_token` | Send native KAIA tokens |
| `send_erc20_token` | Send ERC-20 tokens |
| `wrap_kaia` | Wrap KAIA to WKAIA |
| `unwrap_kaia` | Unwrap WKAIA to KAIA |
| `check_allowance` | Check token allowance for operations |
| `approve_token` | Approve tokens for operations |

### KiloLend Tools

#### Read-Only Tools
| Tool | Description |
|------|-------------|
| `get_account_liquidity` | Check account liquidity and health factor |
| `get_markets` | Get all lending markets with rates |
| `get_protocol_stats` | Get protocol statistics and TVL |

#### Transaction Tools
| Tool | Description |
|------|-------------|
| `enter_market` | Enter markets to enable collateral usage |
| `supply_to_market` | Supply assets to lending market |
| `borrow_from_market` | Borrow from lending market |
| `repay_borrow` | Repay borrowed positions |
| `redeem_tokens` | Redeem cTokens (withdraw by cToken amount) |
| `redeem_underlying` | Redeem underlying tokens (withdraw by underlying amount) |

### Price API Tools

#### Read-Only Tools
| Tool | Description |
|------|-------------|
| `get_all_prices` | Get all available prices from KiloLend price API |
| `get_token_prices` | Get prices for specific tokens (e.g., ['KAIA', 'BTC', 'ETH']) |
| `get_kaia_ecosystem_prices` | Get KAIA ecosystem token prices only (KAIA, BORA, MBX, SIX, SOMNIA, stKAIA) |
| `get_major_crypto_prices` | Get major cryptocurrency prices (BTC, ETH) |
| `get_quick_prices` | Quick price overview of KAIA, BTC, and ETH |

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


## Supported Tokens

### KiloLend Supported Tokens
- **KAIA**: Native KAIA token
- **USDT**: Tether USD (`0xd077a400968890eacc75cdc901f0356c943e4fdb`)
- **SIX**: SIX token (`0xEf82b1C6A550e730D8283E1eDD4977cd01FAF435`)
- **BORA**: BORA token (`0x02cBE46fB8A1F579254a9B485788f2D86cAD51aa`)
- **MBX**: MARBLEX token (`0xD068c52d81f4409B9502dA926aCE3301cc41f623`)
- **stKAIA**: Lair Staked KAIA (`0x42952B873ed6f7f0A7E4992E2a9818E3A9001995`)

### DragonSwap Supported Tokens
- **KAIA**: Native token
- **WKAIA**: Wrapped KAIA (`0x19aac5f612f524b754ca7e7c41cbfa2e981a4432`)
- **USDT**: Official USDT(`0xd077a400968890eacc75cdc901f0356c943e4fdb`)
- **USDT**: Wormhole USDT(`0x5c13e303a62fc5dedf5b52d66873f2e59fedadc2`)
- **BORA**: BORA Token (`0x02cBE46fB8A1F579254a9B485788f2D86cAD51aa`)
- **MBX**: MARBLEX Token (`0xD068c52d81f4409B9502dA926aCE3301cc41f623`)
- **stKAIA**: Lair Staked KAIA (`0x42952B873ed6f7f0A7E4992E2a9818E3A9001995`)
 

## Future Protocol Support

We're actively working on adding support for:

- **Additional Lending Protocols**: More lending platforms
- **Staking Protocols**: Liquid staking and Lair Finance integration
- **Cross-Chain Messaging**: Chainlink CCIP for cross-chain operations
- **Yield Farming**: Cross-protocol yield optimization

## Contract Addresses

### Kaia Mainnet

#### KiloLend (Compound v2)
- **Comptroller**: `0x0B5f0Ba5F13eA4Cb9C8Ee48FB75aa22B451470C2`
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

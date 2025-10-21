# KAIA-MCP Server

A comprehensive Model Context Protocol (MCP) server for interacting with multiple DeFi protocols on the KAIA blockchain. This server provides AI agents with the ability to query market data, manage positions, and execute transactions across lending protocols, DEXs, and staking platforms in the Kaia ecosystem.

## Features

### 📊 Multi-Protocol Support
- **Lending Protocols**: KiloLend and other lending platforms
- **DEX Integration**: KlaySwap, DragonSwap, and more (coming soon)
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
- Supply assets to lending markets
- Borrow from lending markets
- Repay borrowed positions
- DEX swaps and liquidity operations (coming soon)

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
- **Comptroller**: `0x0B5f0Ba5F13eA4Cb9C8Ee48FB75aa22B451470C2`
- **Price Oracle**: `0xBB265F42Cce932c5e383536bDf50B82e08eaf454`
- **cToken Markets**: Direct integration with all lending markets
- **Real-time Events**: Live blockchain state updates

## Architecture

This MCP server follows a clean, modular architecture designed for multi-protocol support:

```
src/
├── agent/           # Core agent classes
│   └── wallet.ts    # Unified WalletAgent for all operations
├── mcp/             # MCP tool definitions
│   ├── index.ts     # Tool registry and exports
│   └── wallet/      # Individual tool implementations
├── contracts/       # Smart contract interfaces
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
RPC_URL="https://public-en.node.kaia.io"         # KAIA Mainnet RPC URL
PRIVATE_KEY="your_private_key_here"              # Wallet private key (for transaction mode)

# Optional
AGENT_MODE="read-only"                           # "read-only" or "transaction"
PRICE_API_URL="https://api.coingecko.com/api/v3" # Price API for token values
```

### Agent Modes

#### Read-Only Mode (Default)
- Query market data
- Check wallet balances
- Monitor positions
- No transaction capabilities

#### Transaction Mode
- All read-only capabilities
- Execute transactions
- Supply/borrow assets
- Transfer tokens

## Available Tools

### Read-Only Tools

| Tool | Description |
|------|-------------|
| `kaia_get_wallet_info` | Get wallet information and token balances |
| `kaia_get_account_liquidity` | Check account liquidity and health factor |
| `kaia_get_lending_markets` | Get all lending markets with rates |
| `kaia_get_lending_stats` | Get protocol statistics and TVL |

### Transaction Tools

| Tool | Description |
|------|-------------|
| `kaia_send_native_token` | Send native KAIA tokens |
| `kaia_send_erc20_token` | Send ERC-20 tokens |
| `kaia_supply_to_lending` | Supply assets to lending market |
| `kaia_borrow_from_lending` | Borrow from lending market |
| `kaia_repay_lending` | Repay borrowed positions |

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
        "RPC_URL": "https://public-en.node.kaia.io",
        "PRIVATE_KEY": "your_private_key",
        "AGENT_MODE": "transaction"
      }
    }
  }
}
```

### Example Tool Calls

#### Get Market Information
```json
{
  "tool": "kaia_get_lending_markets",
  "arguments": {}
}
```

#### Check Account Health
```json
{
  "tool": "kaia_get_account_liquidity",
  "arguments": {
    "account_address": "0x..."
  }
}
```

#### Supply to Market (Transaction Mode)
```json
{
  "tool": "kaia_supply_to_lending",
  "arguments": {
    "ctoken_address": "0x...",
    "amount": "1000",
    "private_key": "your_private_key"
  }
}
```

## Supported Networks

- **Kaia Mainnet**: Production KAIA blockchain

## Supported Tokens

- **KAIA**: Native KAIA token
- **USDT**: Tether USD
- **SIX**: SIX token
- **BORA**: BORA token
- **MBX**: MARBLEX token
- **stKAIA**: Staked KAIA

## Future Protocol Support

We're actively working on adding support for:

- **KlaySwap**: Leading Kaia DEX for swaps and liquidity
- **DragonSwap**: Emerging DEX with innovative features
- **Additional Lending Protocols**: More lending platforms
- **Staking Protocols**: Kaia staking and liquid staking
- **Yield Farming**: Cross-protocol yield optimization

## Security Considerations

- Private keys are handled securely and never logged
- Transaction mode requires explicit private key
- Read-only mode is safe for production use
- Always verify transaction parameters before execution

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Contract Addresses

### Kaia Mainnet
- Comptroller: `0x0B5f0Ba5F13eA4Cb9C8Ee48FB75aa22B451470C2`
- Price Oracle: `0xBB265F42Cce932c5e383536bDf50B82e08eaf454`
- Markets:
  - cUSDT: `0x498823F094f6F2121CcB4e09371a57A96d619695`
  - cSIX: `0xC468dFD0C96691035B3b1A4CA152Cb64F0dbF64c`
  - cBORA: `0x7a937C07d49595282c711FBC613c881a83B9fDFD`
  - cMBX: `0xE321e20F0244500A194543B1EBD8604c02b8fA85`
  - cKAIA: `0x98Ab86C97Ebf33D28fc43464353014e8c9927aB3`
  - cStKAIA: `0x0BC926EF3856542134B06DCf53c86005b08B9625`

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

## Error Handling

The server provides detailed error messages for:
- Network connectivity issues
- Invalid parameters
- Insufficient balances
- Transaction failures
- Contract interaction errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the examples in `EXAMPLES.md`

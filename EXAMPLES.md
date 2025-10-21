# KiloLend MCP Server - Usage Examples

This document provides examples of how to use the KiloLend MCP server with various AI assistants and clients.

## Setup

1. **Install and build the server:**
```bash
npm install
npm run build
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Add to your MCP client configuration:**

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kilolend": {
      "command": "node",
      "args": ["/path/to/kilolend-mcp/dist/index.js"],
      "env": {
        "PRIVATE_KEY": "your-private-key-here"
      }
    }
  }
}
```

### Other MCP Clients

For other MCP-compatible clients, use the same configuration format.

## Available Tools

### 1. `get_wallet_info`
Get wallet information including balances and network details.

**Example Request:**
```json
{
  "tool": "get_wallet_info",
  "arguments": {}
}
```

**Example Response:**
```json
{
  "address": "0x1234...5678",
  "nativeBalance": "1000.5 KAIA",
  "tokens": [
    {
      "symbol": "USDT",
      "balance": "500.0",
      "valueUSD": 500.0
    }
  ],
  "network": {
    "chainId": 8217,
    "name": "KAIA"
  }
}
```

### 2. `get_markets`
Get all lending markets with rates and utilization data.

**Example Request:**
```json
{
  "tool": "get_markets",
  "arguments": {}
}
```

**Example Response:**
```json
{
  "markets": [
    {
      "symbol": "cUSDT",
      "underlyingSymbol": "USDT",
      "supplyApy": "5.5%",
      "borrowApy": "7.2%",
      "totalSupply": "1000000",
      "totalBorrows": "500000",
      "utilizationRate": "50.0%",
      "collateralFactor": "75.0%",
      "price": 1.0,
      "isListed": true
    }
  ]
}
```

### 3. `get_account_liquidity`
Check account health factor and positions.

**Example Request:**
```json
{
  "tool": "get_account_liquidity",
  "arguments": {
    "account": "0x1234...5678"
  }
}
```

**Example Response:**
```json
{
  "liquidity": "1000.0",
  "shortfall": "0.0",
  "healthFactor": 2.5,
  "totalCollateralUSD": 5000,
  "totalBorrowUSD": 2000,
  "positions": [
    {
      "symbol": "cUSDT",
      "supplied": "1000.0",
      "borrowed": "0.0",
      "collateralUSD": 1000.0,
      "borrowUSD": 0.0
    }
  ]
}
```

### 4. `get_protocol_stats`
Get overall protocol statistics including TVL.

**Example Request:**
```json
{
  "tool": "get_protocol_stats",
  "arguments": {}
}
```

**Example Response:**
```json
{
  "totalTVL": 10000000,
  "totalBorrows": 5000000,
  "utilization": 50.0,
  "markets": [...],
  "prices": {
    "USDT": 1.0,
    "KAIA": 0.5
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Transaction Operations (with Private Key)

When a private key is provided, additional transaction tools become available:

### 5. `send_native_token`
Send KAIA to another address.

**Example Request:**
```json
{
  "tool": "send_native_token",
  "arguments": {
    "to": "0x8765...4321",
    "amount": "10.5"
  }
}
```

### 6. `send_erc20_token`
Send ERC-20 tokens to another address.

**Example Request:**
```json
{
  "tool": "send_erc20_token",
  "arguments": {
    "token": "USDT",
    "to": "0x8765...4321",
    "amount": "100"
  }
}
```

### 7. `supply_to_market`
Supply tokens to a lending market.

**Example Request:**
```json
{
  "tool": "supply_to_market",
  "arguments": {
    "token": "USDT",
    "amount": "1000"
  }
}
```

### 8. `borrow_from_market`
Borrow tokens from a lending market.

**Example Request:**
```json
{
  "tool": "borrow_from_market",
  "arguments": {
    "token": "USDT",
    "amount": "500"
  }
}
```

### 9. `repay_borrow`
Reborrow borrowed tokens.

**Example Request:**
```json
{
  "tool": "repay_borrow",
  "arguments": {
    "token": "USDT",
    "amount": "200"
  }
}
```

## Example Conversations

### Checking Portfolio Health

**User:** "What's my current position in KiloLend?"

**AI Assistant:** I'll check your KiloLend positions for you.
[Uses `get_account_liquidity` tool]

"Your current KiloLend portfolio:
- Total Collateral: $5,000
- Total Borrows: $2,000
- Health Factor: 2.5 (Healthy)
- Positions:
  - Supplied: 1,000 USDT ($1,000)
  - Supplied: 8,000 KAIA ($4,000)
  - Borrowed: 500 USDT ($500)
  - Borrowed: 3,000 KAIA ($1,500)"

### Finding Best Yields

**User:** "Which markets have the highest supply rates right now?"

**AI Assistant:** Let me check the current market rates for you.
[Uses `get_markets` tool]

"Here are the current supply APYs:
- MBX: 8.5% APY
- STAKED_KAIA: 7.2% APY
- BORA: 6.8% APY
- USDT: 5.5% APY
- SIX: 4.9% APY
- KAIA: 4.2% APY

MBX currently offers the highest supply rate at 8.5% APY with 65% utilization."

### Supplying to a Market

**User:** "I want to supply 1000 USDT to KiloLend"

**AI Assistant:** I'll help you supply 1,000 USDT to KiloLend.
[Uses `supply_to_market` tool]

"Successfully supplied 1,000 USDT to KiloLend!
Transaction: 0xabc123...
You're now earning 5.5% APY on your USDT supply."

## Security Notes

1. **Private Key Security:** Never share your private key or commit it to version control.
2. **Read-Only Mode:** The server works in read-only mode without a private key.
3. **Transaction Verification:** Always verify transaction details before execution.
4. **Test First:** Consider testing on testnet before using mainnet funds.

## Error Handling

The server provides detailed error messages for common issues:

- **Insufficient Balance:** When you don't have enough tokens for a transaction
- **Insufficient Liquidity:** When borrowing would exceed your health factor
- **Market Not Listed:** When trying to interact with an unsupported market
- **Invalid Parameters:** When input parameters are malformed

## Supported Tokens

- **KAIA** (native)
- **USDT** (Tether)
- **SIX** (Six Network)
- **BORA** (BORA Protocol)
- **MBX** (MarbleX)
- **STAKED_KAIA** (Staked KAIA)

## Integration Examples

### Python Integration

```python
import subprocess
import json

def call_kilolend_tool(tool_name, arguments=None):
    process = subprocess.Popen(
        ['node', 'dist/index.js'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True
    )
    
    request = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments or {}
        },
        "id": 1
    }
    
    stdout, _ = process.communicate(json.dumps(request))
    return json.loads(stdout)

# Get wallet info
result = call_kilolend_tool("get_wallet_info")
print(result)
```

### Node.js Integration

```javascript
const { spawn } = require('child_process');

async function callKiloLendTool(toolName, arguments = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', ['dist/index.js']);
    
    const request = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: toolName, arguments },
      id: 1
    };
    
    process.stdin.write(JSON.stringify(request));
    process.stdin.end();
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data;
    });
    
    process.on('close', () => {
      try {
        resolve(JSON.parse(output));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Usage
const result = await callKiloLendTool('get_markets');
console.log(result);

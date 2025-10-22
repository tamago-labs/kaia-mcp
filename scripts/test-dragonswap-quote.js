// Simple quote test using a more straightforward approach
const { createPublicClient, http, parseUnits, formatUnits, getAddress } = require('viem');
const { kaia } = require('viem/chains');

// DragonSwap configuration
const DRAGONSWAP_CONTRACTS = {
  factory: "0x7431A23897ecA6913D5c81666345D39F27d946A4",
  quoter: "0x5e4e4b0e6291c0a3360a4a3c7a6c3b4c4b5c6d7e" // Example quoter address
};

// Token addresses
const TOKENS = {
  USDT: "0x5C13E303a62Fc5DEdf5B52D66873f2E59fEdADC2",
  USDC: "0x608792Deb376CCE1c9FA4D0E6B7b44f507CfFa6A"
};

// Factory ABI
const FACTORY_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" }
    ],
    name: "getPool",
    outputs: [{ internalType: "address", name: "pool", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
];

// Simple quote using tick-based calculation
function calculateSimpleQuote(tick, amountIn, isToken0Input) {
  // Convert tick to price using the formula: price = 1.0001^tick
  // For simplicity, we'll use a basic approximation
  const price = Math.pow(1.0001, tick);
  
  if (isToken0Input) {
    // USDT is token0, USDC is token1
    // price = token1/token0 = USDC/USDT
    const amountOut = amountIn * price;
    return Math.floor(amountOut);
  } else {
    // USDC is token1, USDT is token0
    // price = token1/token0 = USDC/USDT
    const amountOut = amountIn / price;
    return Math.floor(amountOut);
  }
}

async function testSimpleQuote() {
  console.log('🔍 Testing Simple Quote Calculation');
  
  const publicClient = createPublicClient({
    chain: kaia,
    transport: http('https://public-en.node.kaia.io')
  });

  try {
    console.log('📡 Connecting to KAIA network...');
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Connected. Current block: ${blockNumber}`);

    // Get pool address for 0.05% fee tier
    const poolAddress = await publicClient.readContract({
      address: DRAGONSWAP_CONTRACTS.factory,
      abi: FACTORY_ABI,
      functionName: 'getPool',
      args: [
        getAddress(TOKENS.USDT),
        getAddress(TOKENS.USDC),
        500 // 0.05% fee
      ]
    });

    console.log(`🏊 Pool address: ${poolAddress}`);

    if (poolAddress === '0x0000000000000000000000000000000000000000') {
      console.log('❌ Pool does not exist');
      return;
    }

    // Get pool slot0 to get current tick
    const SLOT0_ABI = [
      {
        inputs: [],
        name: "slot0",
        outputs: [
          { internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
          { internalType: "int24", name: "tick", type: "int24" },
          { internalType: "uint16", name: "observationIndex", type: "uint16" },
          { internalType: "uint16", name: "observationCardinality", type: "uint16" },
          { internalType: "uint16", name: "observationCardinalityNext", type: "uint16" },
          { internalType: "uint8", name: "feeProtocol", type: "uint8" },
          { internalType: "bool", name: "unlocked", type: "bool" }
        ],
        stateMutability: "view",
        type: "function"
      }
    ];

    const slot0 = await publicClient.readContract({
      address: poolAddress,
      abi: SLOT0_ABI,
      functionName: 'slot0'
    });

    const tick = Array.isArray(slot0) ? slot0[1] : slot0.tick;
    console.log(`📉 Current tick: ${tick}`);

    // Test quotes with different amounts
    const testAmounts = ['1', '10', '100', '1000'];
    
    console.log('\n💱 Testing USDT to USDC quotes:');
    for (const amount of testAmounts) {
      const amountIn = parseUnits(amount, 6); // 6 decimals for both tokens
      const amountOut = calculateSimpleQuote(tick, Number(amount), true);
      const formattedOut = formatUnits(amountOut.toString(), 6);
      console.log(`${amount} USDT = ${formattedOut} USDC`);
    }

    console.log('\n🔄 Testing USDC to USDT quotes:');
    for (const amount of testAmounts) {
      const amountIn = parseUnits(amount, 6); // 6 decimals for both tokens
      const amountOut = calculateSimpleQuote(tick, Number(amount), false);
      const formattedOut = formatUnits(amountOut.toString(), 6);
      console.log(`${amount} USDC = ${formattedOut} USDT`);
    }

    // Calculate approximate price
    const price = Math.pow(1.0001, tick);
    console.log(`\n💰 Approximate price: 1 USDT = ${price.toFixed(6)} USDC`);
    console.log(`💰 Reverse price: 1 USDC = ${(1/price).toFixed(6)} USDT`);

    console.log('\n🎉 Simple quote test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimpleQuote().catch(console.error);

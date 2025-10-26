/**
 * Simple DragonSwap Quote Test
 * Tests the quote functionality to identify issues
 */

const { WalletAgent } = require('../dist/index.js');

// Token addresses
const TOKENS = {
  WKAIA: "0x19aac5f612f524b754ca7e7c41cbfa2e981a4432",
  USDT: "0xd077a400968890eacc75cdc901f0356c943e4fdb",
  BORA: "0x02cbE46fB8A1F579254a9B485788f2D86Cad51aa",
  SIX: "0xEf82b1C6A550e730D8283E1eDD4977cd01FAF435",
};

async function testQuote(agent, tokenInSymbol, tokenOutSymbol, amount) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 TEST: ${amount} ${tokenInSymbol} → ${tokenOutSymbol}`);
  console.log(`${'═'.repeat(70)}`);
  
  const tokenIn = TOKENS[tokenInSymbol];
  const tokenOut = TOKENS[tokenOutSymbol];
  
  try {
    // First, check pool info
    console.log('\n1️⃣ Checking pool information...');
    const pools = await agent.getAllPools(tokenIn, tokenOut);
    
    if (pools.length === 0) {
      console.log('❌ No pools found for this pair');
      return;
    }
    
    console.log(`✅ Found ${pools.length} pool(s):`);
    pools.forEach(pool => {
      console.log(`   - Fee: ${pool.feeTierName}, Liquidity: ${pool.liquidity}, Address: ${pool.address}`);
    });
    
    // Get quote
    console.log('\n2️⃣ Getting swap quote...');
    const quote = await agent.getSwapQuote({
      tokenIn,
      tokenOut,
      amountIn: amount.toString(),
      amountInDecimals: 18,
      slippage: 50
    });
    
    console.log('✅ Quote received:');
    console.log(`   Input: ${quote.amountInFormatted} ${quote.tokenInSymbol}`);
    console.log(`   Output: ${quote.amountOutFormatted} ${quote.tokenOutSymbol}`);
    console.log(`   Estimated Price: ${quote.estimatedPrice}`);
    console.log(`   Selected Fee Tier: ${quote.selectedFeeTier}`);
    console.log(`   Price Impact: ${quote.priceImpact}%`);
    console.log(`   Liquidity Score: ${quote.liquidityScore}`);
    console.log(`   Trade Size Category: ${quote.tradeSizeCategory}`);
    
    // Verify the math
    console.log('\n3️⃣ Verifying calculation...');
    const effectivePrice = parseFloat(quote.amountOutFormatted) / parseFloat(quote.amountInFormatted);
    console.log(`   Calculated effective price: ${effectivePrice}`);
    console.log(`   Quote estimated price: ${quote.estimatedPrice}`);
    const priceDiff = Math.abs(effectivePrice - quote.estimatedPrice) / quote.estimatedPrice * 100;
    console.log(`   Price difference: ${priceDiff.toFixed(4)}%`);
    
    if (priceDiff > 1) {
      console.log('   ⚠️  WARNING: Price difference is significant');
    } else {
      console.log('   ✅ Price calculation looks correct');
    }
    
    return quote;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 DRAGONSWAP QUOTE TEST');
  console.log('═'.repeat(70));
  console.log('Testing DragonSwap V3 quote functionality\n');
  
  // Initialize agent in read-only mode
  const agent = new WalletAgent({ mode: 'readonly' });
  
  const testCases = [
    { tokenIn: 'WKAIA', tokenOut: 'USDT', amount: 1 },
    { tokenIn: 'WKAIA', tokenOut: 'USDT', amount: 10 },
    { tokenIn: 'WKAIA', tokenOut: 'USDT', amount: 100 },
    { tokenIn: 'USDT', tokenOut: 'WKAIA', amount: 1 }
  ];
  
  for (const testCase of testCases) {
    await testQuote(agent, testCase.tokenIn, testCase.tokenOut, testCase.amount);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('🎉 ALL TESTS COMPLETED');
  console.log('═'.repeat(70) + '\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

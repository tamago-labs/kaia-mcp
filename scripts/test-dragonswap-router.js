// Test the updated DragonSwap router with tick-based calculation
const { dragonSwapRouter } = require('../dist/index.js');

async function testUpdatedRouter() {
  console.log('🔍 Testing Updated DragonSwap Router');
  
  // Use corrected checksum addresses
  const USDT = "0xd077a400968890eacc75cdc901f0356c943e4fdb"; // Official USDT (fixed checksum)
  const WKAI = "0x19aac5f612f524b754ca7e7c41cbfa2e981a4432"; // WKAI
  
  try {
    // Test Official USDT to WKAI quote
    console.log('\n💱 Testing Official USDT to WKAI quote:');
    const usdtToWkaiQuote = await dragonSwapRouter.getQuoteExactInput({
      tokenIn: USDT, // Official USDT (fixed checksum)
      tokenOut: WKAI, // WKAI
      amountIn: "100",
      amountInDecimals: 6,
      slippage: 50
    });
    
    console.log(`✅ USDT to WKAI Quote:`);
    console.log(`   Amount In: ${usdtToWkaiQuote.amountInFormatted} USDT`);
    console.log(`   Amount Out: ${usdtToWkaiQuote.amountOutFormatted} WKAI`);
    console.log(`   Pool Fee: ${usdtToWkaiQuote.route?.pools[0]?.fee}`);
    console.log(`   Pool Address: ${usdtToWkaiQuote.route?.pools[0]?.address}`);
    console.log(`   Liquidity: ${usdtToWkaiQuote.route?.pools[0]?.liquidity}`);

    // Test WKAI to Official USDT quote
    console.log('\n🔄 Testing WKAI to Official USDT quote:');
    const wkaiToUsdtQuote = await dragonSwapRouter.getQuoteExactInput({
      tokenIn: WKAI, // WKAI
      tokenOut: USDT, // Official USDT (fixed checksum)
      amountIn: "100000000000000000000", // 100 WKAI (18 decimals)
      amountInDecimals: 18,
      slippage: 50
    });
    
    console.log(`✅ WKAI to USDT Quote:`);
    console.log(`   Amount In: ${wkaiToUsdtQuote.amountInFormatted} WKAI`);
    console.log(`   Amount Out: ${wkaiToUsdtQuote.amountOutFormatted} USDT`);
    console.log(`   Pool Fee: ${wkaiToUsdtQuote.route?.pools[0]?.fee}`);
    console.log(`   Pool Address: ${wkaiToUsdtQuote.route?.pools[0]?.address}`);
    console.log(`   Liquidity: ${wkaiToUsdtQuote.route?.pools[0]?.liquidity}`);

    // Test all available pools for this pair
    console.log('\n🏊 Testing all available pools for USDT/WKAI:');
    const allPools = await dragonSwapRouter.getAllPools(
      USDT, // Official USDT (fixed checksum)
      WKAI  // WKAI
    );
    
    console.log(`✅ Found ${allPools.length} pools:`);
    allPools.forEach((pool, index) => {
      console.log(`   Pool ${index + 1}:`);
      console.log(`     Address: ${pool.address}`);
      console.log(`     Fee: ${pool.fee} (${pool.fee / 100}%)`);
      console.log(`     Liquidity: ${pool.liquidity}`);
      console.log(`     Tick: ${pool.tick}`);
    });

    // Test different amounts to see how quotes scale
    console.log('\n📈 Testing different amounts:');
    const amounts = ["10", "50", "100", "500", "1000"];
    
    for (const amount of amounts) {
      try {
        const quote = await dragonSwapRouter.getQuoteExactInput({
          tokenIn: USDT, // Official USDT 
          tokenOut: WKAI, // WKAI
          amountIn: amount,
          amountInDecimals: 6,
          slippage: 50
        });
        
        console.log(`   ${amount} USDT = ${quote.amountOutFormatted} WKAI`);
      } catch (error) {
        console.log(`   ${amount} USDT = ERROR: ${error.message}`);
      }
    }

    console.log('\n🎉 USDT/WKAI pair test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUpdatedRouter().catch(console.error);

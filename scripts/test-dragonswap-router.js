// Test the updated DragonSwap router with tick-based calculation
const { dragonSwapRouter } = require('../dist/index.js');

async function testUpdatedRouter() {
  console.log('🔍 Testing Updated DragonSwap Router');
  
  try {
    // Test USDT to USDC quote
    console.log('\n💱 Testing USDT to USDC quote:');
    const usdtToUsdcQuote = await dragonSwapRouter.getQuoteExactInput({
      tokenIn: "0x5C13E303a62Fc5DEdf5B52D66873f2E59fEdADC2", // USDT
      tokenOut: "0x608792Deb376CCE1c9FA4D0E6B7b44f507CfFa6A", // USDC
      amountIn: "100",
      amountInDecimals: 6,
      slippage: 50
    });
    
    console.log(`✅ USDT to USDC Quote:`);
    console.log(`   Amount In: ${usdtToUsdcQuote.amountInFormatted} USDT`);
    console.log(`   Amount Out: ${usdtToUsdcQuote.amountOutFormatted} USDC`);
    console.log(`   Pool Fee: ${usdtToUsdcQuote.route?.pools[0]?.fee}`);
    console.log(`   Pool Address: ${usdtToUsdcQuote.route?.pools[0]?.address}`);

    // Test USDC to USDT quote
    console.log('\n🔄 Testing USDC to USDT quote:');
    const usdcToUsdtQuote = await dragonSwapRouter.getQuoteExactInput({
      tokenIn: "0x608792Deb376CCE1c9FA4D0E6B7b44f507CfFa6A", // USDC
      tokenOut: "0x5C13E303a62Fc5DEdf5B52D66873f2E59fEdADC2", // USDT
      amountIn: "100",
      amountInDecimals: 6,
      slippage: 50
    });
    
    console.log(`✅ USDC to USDT Quote:`);
    console.log(`   Amount In: ${usdcToUsdtQuote.amountInFormatted} USDC`);
    console.log(`   Amount Out: ${usdcToUsdtQuote.amountOutFormatted} USDT`);
    console.log(`   Pool Fee: ${usdcToUsdtQuote.route?.pools[0]?.fee}`);
    console.log(`   Pool Address: ${usdcToUsdtQuote.route?.pools[0]?.address}`);

    // Test pool info
    console.log('\n🏊 Testing pool info:');
    const poolInfo = await dragonSwapRouter.getPoolInfo(
      "0x5C13E303a62Fc5DEdf5B52D66873f2E59fEdADC2", // USDT
      "0x608792Deb376CCE1c9FA4D0E6B7b44f507CfFa6A", // USDC
      500 // 0.05% fee
    );
    
    if (poolInfo) {
      console.log(`✅ Pool Info:`);
      console.log(`   Address: ${poolInfo.address}`);
      console.log(`   Token0: ${poolInfo.token0}`);
      console.log(`   Token1: ${poolInfo.token1}`);
      console.log(`   Fee: ${poolInfo.fee}`);
      console.log(`   Liquidity: ${poolInfo.liquidity}`);
      console.log(`   Tick: ${poolInfo.tick}`);
    } else {
      console.log(`❌ Pool not found`);
    }

    console.log('\n🎉 Updated router test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUpdatedRouter().catch(console.error);

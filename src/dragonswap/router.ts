import { publicClient, networkInfo } from '../config';
import { createWalletClient, http, WalletClient, Account } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { kaia } from 'viem/chains';
import { DRAGONSWAP_CONTRACTS, TOKENS, FEE_TIERS, DEFAULT_SLIPPAGE, DEFAULT_DEADLINE } from './config';
import { Address, parseUnits, formatUnits, Hex, encodeFunctionData, maxUint256 } from 'viem';
import SwapRouterABI from './contracts/abi/SwapRouter.json';
import QuoterV2ABI from './contracts/abi/QuoterV2.json';
import { ERC20_ABI } from '../contracts/erc20';

/**
 * Public interface for DragonSwap router operations
 * Only exposes methods that should be publicly accessible
 */
export interface IDragonSwapRouter {
  getQuoteExactInput(params: SwapParams): Promise<SwapQuote>;
  executeExactInputSwap(params: SwapParams): Promise<`0x${string}`>;
  getPoolInfo(token0: Address, token1: Address, fee: number): Promise<PoolInfo | null>;
  getAllPools(token0: Address, token1: Address): Promise<PoolInfo[]>;
  getTokenBalance(token: Address, walletAddress?: Address): Promise<string>;
}

export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  amountInDecimals: number;
  slippage?: number; // in basis points (e.g., 50 = 0.5%)
  recipient?: Address;
  deadline?: number; // in minutes
}

export interface SwapQuote {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  amountOut: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  priceImpact?: number;
  gasEstimate?: bigint;
  route?: {
    pools: Array<{
      address: Address;
      fee: number;
      liquidity?: string;
    }>;
  };
}

export interface PoolInfo {
  address: Address;
  token0: Address;
  token1: Address;
  fee: number;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  token0Price?: string;
  token1Price?: string;
}

class DragonSwapRouter {
  private publicClient = publicClient;
  private walletClient: WalletClient;
  private account: Account;

  constructor(privateKey?: string) {
    if (privateKey) {
      // Ensure private key is in correct hex format
      const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      this.account = privateKeyToAccount(formattedPrivateKey as Address);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: kaia,
        transport: http(networkInfo.rpcProviderUrl)
      });
    } else {
      // Use the config account as fallback
      this.account = (require('../config')).account;
      this.walletClient = (require('../config')).walletClient;
    }
  }

  /**
   * Get a quote for an exact input swap
   */
  async getQuoteExactInput(params: SwapParams): Promise<SwapQuote> {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      amountInDecimals,
      slippage = DEFAULT_SLIPPAGE
    } = params;

    // Convert amount to wei
    const amountInWei = parseUnits(amountIn, amountInDecimals);

    try {
      // Try different fee tiers to find the best route 
      const feeTiers = [FEE_TIERS.LOWEST, FEE_TIERS.LOW, FEE_TIERS.MEDIUM, FEE_TIERS.HIGH, FEE_TIERS.HIGHEST];
      let bestQuote: SwapQuote | null = null;

      for (const fee of feeTiers) {
        try {
          // console.log(`Trying fee tier ${fee}...`);
          const quote = await this.calculateQuoteFromPool(tokenIn, tokenOut, amountIn, amountInDecimals, fee);
          // console.log(`Quote for fee ${fee}:`, quote);
          
          if (!bestQuote || BigInt(bestQuote.amountOut) < BigInt(quote.amountOut)) {
            bestQuote = quote;
            // console.log(`New best quote found for fee ${fee}`);
          }
        } catch (error: any) {
          // Skip this fee tier if pool doesn't exist
          // console.log(`Fee tier ${fee} failed:`, error.message);
          continue;
        }
      }

      // console.log("bestQuote: ", bestQuote)

      if (!bestQuote) {
        throw new Error('No available pools found for this token pair');
      }

      // Calculate minimum amount out based on slippage
      const slippageMultiplier = (10000 - slippage) / 10000;
      const minAmountOutWei = (BigInt(bestQuote.amountOut) * BigInt(Math.floor(slippageMultiplier * 10000))) / 10000n;

      return {
        ...bestQuote,
        amountOut: minAmountOutWei.toString(),
      };

    } catch (error) {
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate quote directly from pool data using tick-based calculation
   */
  private async calculateQuoteFromPool(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: string,
    amountInDecimals: number,
    fee: number
  ): Promise<SwapQuote> {
    // Get pool info
    const poolInfo = await this.getPoolInfo(tokenIn, tokenOut, fee);
    if (!poolInfo) {
      throw new Error(`Pool does not exist for fee tier ${fee}`);
    }

    if (BigInt(poolInfo.liquidity) === 0n) {
      throw new Error(`Pool has no liquidity for fee tier ${fee}`);
    }

    // Get token decimals
    const [tokenInDecimals, tokenOutDecimals] = await Promise.all([
      this.getTokenDecimals(tokenIn),
      this.getTokenDecimals(tokenOut)
    ]);

    // Calculate quote using tick-based formula
    const amountInWei = parseUnits(amountIn, tokenInDecimals);
    const isToken0Input = tokenIn.toLowerCase() === poolInfo.token0.toLowerCase();
    
    const amountOutWei = this.calculateAmountOutFromTick(
      poolInfo.tick,
      amountInWei,
      tokenInDecimals,
      tokenOutDecimals,
      isToken0Input
    );

    const amountOutFormatted = formatUnits(amountOutWei, tokenOutDecimals);

    return {
      tokenIn,
      tokenOut,
      amountIn: amountInWei.toString(),
      amountOut: amountOutWei.toString(),
      amountInFormatted: amountIn,
      amountOutFormatted,
      route: {
        pools: [{
          address: poolInfo.address,
          fee,
          liquidity: poolInfo.liquidity
        }]
      }
    };
  }

  /**
   * Calculate amount out using tick-based formula
   */
  private calculateAmountOutFromTick(
    tick: number,
    amountIn: bigint,
    tokenInDecimals: number,
    tokenOutDecimals: number,
    isToken0Input: boolean
  ): bigint {
    // Convert tick to price using the formula: price = 1.0001^tick
    const price = Math.pow(1.0001, tick);
    
    // Adjust for decimals
    const decimalAdjustment = Math.pow(10, tokenInDecimals - tokenOutDecimals);
    const adjustedPrice = price * decimalAdjustment;
    
    let amountOut: number;
    if (isToken0Input) {
      // token0 in, token1 out
      amountOut = Number(amountIn) * adjustedPrice;
    } else {
      // token1 in, token0 out
      amountOut = Number(amountIn) / adjustedPrice;
    }
    
    return BigInt(Math.floor(amountOut));
  }

  /**
   * Get token decimals
   */
  private async getTokenDecimals(token: Address): Promise<number> {
    const tokenContract = {
      address: token,
      abi: ERC20_ABI,
    };

    try {
      const decimals = await this.publicClient.readContract({
        ...tokenContract,
        functionName: 'decimals',
      });
      return Number(decimals);
    } catch (error) {
      return 18; // Default to 18 decimals
    }
  }

  /**
   * Execute an exact input swap
   */
  async executeExactInputSwap(params: SwapParams): Promise<`0x${string}`> {
    const quote = await this.getQuoteExactInput(params);
    
    const {
      tokenIn,
      tokenOut,
      slippage = DEFAULT_SLIPPAGE,
      recipient = this.account.address,
      deadline = DEFAULT_DEADLINE
    } = params;

    // Calculate deadline timestamp
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);

    // Determine if we need to approve tokens
    if (tokenIn !== TOKENS.KAIA) {
      await this.approveToken(tokenIn, DRAGONSWAP_CONTRACTS.swapRouter, quote.amountIn);
    }

    // Prepare swap parameters
    const swapParams = {
      tokenIn,
      tokenOut,
      fee: BigInt(quote.route?.pools[0]?.fee || FEE_TIERS.MEDIUM),
      recipient,
      deadline: BigInt(deadlineTimestamp),
      amountIn: BigInt(quote.amountIn),
      amountOutMinimum: BigInt(quote.amountOut),
      sqrtPriceLimitX96: 0n, // No price limit
    };

    const swapRouterContract = {
      address: DRAGONSWAP_CONTRACTS.swapRouter,
      abi: SwapRouterABI,
    };

    // Execute the swap
    const { request } = await this.publicClient.simulateContract({
      ...swapRouterContract,
      functionName: 'exactInputSingle',
      args: [swapParams],
      account: this.account,
      value: tokenIn === TOKENS.KAIA ? BigInt(quote.amountIn) : 0n,
    });

    const hash = await this.walletClient.writeContract(request);
    return hash;
  }

  /**
   * Get pool information for a token pair
   */
  async getPoolInfo(token0: Address, token1: Address, fee: number): Promise<PoolInfo | null> {
    try {
      // Get pool address from factory
      const factoryContract = {
        address: DRAGONSWAP_CONTRACTS.factory,
        abi: [
          {
            "inputs": [
              {"internalType": "address", "name": "tokenA", "type": "address"},
              {"internalType": "address", "name": "tokenB", "type": "address"},
              {"internalType": "uint24", "name": "fee", "type": "uint24"}
            ],
            "name": "getPool",
            "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const,
      };

      const poolAddress = await this.publicClient.readContract({
        ...factoryContract,
        functionName: 'getPool',
        args: [token0, token1, fee],
      });

      if (poolAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      // Get pool data
      const poolContract = {
        address: poolAddress,
        abi: [
          {
            "inputs": [],
            "name": "token0",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "token1",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "fee",
            "outputs": [{"internalType": "uint24", "name": "", "type": "uint24"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "liquidity",
            "outputs": [{"internalType": "uint128", "name": "", "type": "uint128"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "slot0",
            "outputs": [
              {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
              {"internalType": "int24", "name": "tick", "type": "int24"},
              {"internalType": "uint16", "name": "observationIndex", "type": "uint16"},
              {"internalType": "uint16", "name": "observationCardinality", "type": "uint16"},
              {"internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16"},
              {"internalType": "uint8", "name": "feeProtocol", "type": "uint8"},
              {"internalType": "bool", "name": "unlocked", "type": "bool"}
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const,
      };

      const [poolToken0, poolToken1, poolFee, liquidity, slot0] = await this.publicClient.multicall({
        contracts: [
          { ...poolContract, functionName: 'token0' },
          { ...poolContract, functionName: 'token1' },
          { ...poolContract, functionName: 'fee' },
          { ...poolContract, functionName: 'liquidity' },
          { ...poolContract, functionName: 'slot0' },
        ],
      });
 
      return {
        address: poolAddress,
        token0: poolToken0.result as Address,
        token1: poolToken1.result as Address,
        fee: Number(poolFee.result),
        liquidity: liquidity.result?.toString() || '0',
        sqrtPriceX96: slot0.result?.[0]?.toString() || '0',
        tick: Number(slot0.result?.[1] || 0),
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Get all available pools for a token pair across different fee tiers
   */
  async getAllPools(token0: Address, token1: Address): Promise<PoolInfo[]> {
    const feeTiers = [FEE_TIERS.LOWEST, FEE_TIERS.LOW, FEE_TIERS.MEDIUM, FEE_TIERS.HIGH, FEE_TIERS.HIGHEST];
    const pools: PoolInfo[] = [];

    for (const fee of feeTiers) {
      const poolInfo = await this.getPoolInfo(token0, token1, fee);
      if (poolInfo) {
        pools.push(poolInfo);
      }
    }

    return pools;
  }

  /**
   * Approve token for spending by DragonSwap router
   */
  private async approveToken(token: Address, spender: Address, amount: string): Promise<void> {
    const tokenContract = {
      address: token,
      abi: ERC20_ABI,
    };

    // Check current allowance
    const currentAllowance = await this.publicClient.readContract({
      ...tokenContract,
      functionName: 'allowance',
      args: [this.account.address, spender],
    });

    if (BigInt(currentAllowance as bigint) >= BigInt(amount)) {
      return; // Already approved
    }

    // Approve the token
    const { request } = await this.publicClient.simulateContract({
      ...tokenContract,
      functionName: 'approve',
      args: [spender, maxUint256],
      account: this.account,
    });

    await this.walletClient.writeContract(request);
  }

  /**
   * Get token balance
   */
  async getTokenBalance(token: Address, walletAddress?: Address): Promise<string> {
    const address = walletAddress || this.account.address;

    if (token === TOKENS.KAIA) {
      const balance = await this.publicClient.getBalance({ address });
      return formatUnits(balance, 18);
    }

    const tokenContract = {
      address: token,
      abi: ERC20_ABI,
    };

    const balance = await this.publicClient.readContract({
      ...tokenContract,
      functionName: 'balanceOf',
      args: [address],
    });

    return formatUnits(balance as bigint, 18); // Assuming 18 decimals
  }
}

// Factory function to create DragonSwap router with private key
export function createDragonSwapRouter(privateKey?: string): IDragonSwapRouter {
  return new DragonSwapRouter(privateKey);
}

// Default export for backward compatibility (will be initialized from main index)
export let dragonSwapRouter: IDragonSwapRouter;

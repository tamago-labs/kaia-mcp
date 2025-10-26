import { createPublicClient, createWalletClient, http, WalletClient, Address, parseUnits, formatUnits, maxUint256 } from 'viem';
import { privateKeyToAccount, type Account } from 'viem/accounts';
import { kaia } from 'viem/chains';
import { publicClient, networkInfo, apiConfig, DRAGONSWAP_CONTRACTS, SWAP_TOKENS, FEE_TIERS, DEFAULT_SLIPPAGE, DEFAULT_DEADLINE } from '../config';
import { formatTokenAmount } from '../utils/formatting';
import {
  COMPTROLLER_ADDRESS,
  COMPTROLLER_ABI
} from '../contracts/comptroller';
import {
  CTOKEN_ABI,
  SYMBOL_TO_CTOKEN,
  TOKEN_ADDRESSES
} from '../contracts/ctoken';
import { ERC20_ABI } from '../contracts/erc20';
import {
  TransactionError,
  InsufficientBalanceError,
  ValidationError,
  handleContractError
} from '../utils/errors';
import { validateTransactionParams } from '../utils/validation';
import axios from 'axios';

export class WalletAgent {
  private account: Account | null = null;
  private walletClient: WalletClient | null = null;
  private isReadonly: boolean = true;

  constructor(config?: { privateKey?: string; mode?: 'readonly' | 'transaction' } | string) {
    // Handle different constructor signatures
    let privateKey: string | undefined;

    if (typeof config === 'string') {
      // Backward compatibility: constructor(privateKey: string)
      privateKey = config;
    } else if (config && typeof config === 'object') {
      // New signature: constructor({ privateKey?, mode? })
      if (config.mode === 'readonly') {
        privateKey = undefined;
      } else {
        privateKey = config.privateKey;
      }
    }

    if (privateKey) {
      // Initialize wallet for transaction capabilities
      // Ensure private key is properly formatted as hex string
      const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

      // Validate private key format
      if (!/^0x[0-9a-fA-F]{64}$/.test(formattedPrivateKey)) {
        throw new Error(`Invalid private key format. Expected 64 hex characters (32 bytes), got: ${formattedPrivateKey.length - 2} characters`);
      }

      this.account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: kaia,
        transport: http(networkInfo.rpcProviderUrl)
      });
      this.isReadonly = false;
    } else {
      // Read-only mode - no private key
      this.isReadonly = true;
    }
  }

  // ===== CONNECTION METHODS =====

  async connect(): Promise<void> {
    // Connection is handled in constructor, but kept for compatibility
  }

  async disconnect(): Promise<void> {
    // Cleanup if needed
  }

  // ===== WALLET INFO METHODS =====

  getAddress(): Address | null {
    return this.account?.address || null;
  }

  isTransactionMode(): boolean {
    return !this.isReadonly;
  }

  async getWalletInfo() {
    if (!this.account) {
      throw new Error('Wallet not initialized. Provide private key for wallet operations.');
    }

    try {
      const balance = await publicClient.getBalance({
        address: this.account.address
      });

      const prices = await this.fetchPrices();
      const tokens = [];

      // Get token balances for major tokens
      for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
        try {
          const tokenBalance = await this.getTokenBalance(address, this.account.address);
          const price = prices[symbol] || 0;
          const balanceFormatted = Number(tokenBalance) / 1e18;
          const balanceUSD = balanceFormatted * price;

          if (balanceUSD > 0.01) { // Only show tokens with meaningful value
            tokens.push({
              symbol,
              address,
              balance: balanceFormatted.toString(),
              balanceUSD: balanceUSD.toFixed(2),
              price
            });
          }
        } catch (error) {
          // Skip tokens that fail to load
        }
      }

      return {
        address: this.account.address,
        nativeBalance: formatTokenAmount(balance, 'KAIA'),
        nativeBalanceUSD: (Number(balance) / 1e18 * (prices.KAIA || 0)).toFixed(2),
        tokens,
        network: {
          chainId: networkInfo.chainId,
          name: 'KAIA',
          rpcUrl: networkInfo.rpcProviderUrl
        },
        mode: this.isReadonly ? 'read-only' : 'transaction'
      };
    } catch (error: any) {
      throw new Error(`Failed to get wallet info: ${error.message}`);
    }
  }

  // ===== MARKET DATA METHODS =====

  async getMarketData(cTokenAddress: Address) {
    try {
      const [exchangeRate, supplyRate, borrowRate, totalSupply, totalBorrows, cash] = await Promise.all([
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'exchangeRateStored'
        }),
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'supplyRatePerBlock'
        }),
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'borrowRatePerBlock'
        }),
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'totalSupply'
        }),
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'totalBorrows'
        }),
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'getCash'
        })
      ]) as [bigint, bigint, bigint, bigint, bigint, bigint];

      return {
        exchangeRate: exchangeRate.toString(),
        supplyRatePerBlock: supplyRate.toString(),
        borrowRatePerBlock: borrowRate.toString(),
        totalSupply: totalSupply.toString(),
        totalBorrows: totalBorrows.toString(),
        cash: cash.toString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get market data: ${error.message}`);
    }
  }

  async getAllMarkets() {
    try {
      const prices = await this.fetchPrices();
      const markets = [];

      for (const [symbol, cTokenAddress] of Object.entries(SYMBOL_TO_CTOKEN)) {
        try {
          const marketData = await this.getMarketData(cTokenAddress as Address);
          const price = prices[symbol] || 0;

          // Calculate real values
          const exchangeRate = parseFloat(marketData.exchangeRate) / 1e18;
          const supplyRatePerBlock = parseFloat(marketData.supplyRatePerBlock);
          const borrowRatePerBlock = parseFloat(marketData.borrowRatePerBlock);
          const totalSupply = parseFloat(marketData.totalSupply) / 1e18;
          const totalBorrows = parseFloat(marketData.totalBorrows) / 1e18;
          const cash = parseFloat(marketData.cash) / 1e18;

          // Convert block rates to APY (assuming 1 block per second on KAIA)
          const blocksPerYear = 31536000;
          const supplyApy = (Math.pow(1 + supplyRatePerBlock / 1e18, blocksPerYear) - 1) * 100;
          const borrowApy = (Math.pow(1 + borrowRatePerBlock / 1e18, blocksPerYear) - 1) * 100;

          const utilization = (totalSupply * exchangeRate) > 0 ?
            (totalBorrows / (totalSupply * exchangeRate)) * 100 : 0;

          markets.push({
            symbol: `c${symbol}`,
            underlyingSymbol: symbol,
            cTokenAddress,
            underlyingAddress: TOKEN_ADDRESSES[symbol as keyof typeof TOKEN_ADDRESSES],
            supplyApy: supplyApy.toFixed(2),
            borrowApy: borrowApy.toFixed(2),
            totalSupply: (totalSupply * exchangeRate).toFixed(6),
            totalBorrows: totalBorrows.toFixed(6),
            cash: cash.toFixed(6),
            utilizationRate: utilization.toFixed(2),
            exchangeRate: exchangeRate.toFixed(6),
            price,
            isListed: true
          });
        } catch (error) {
          console.warn(`Failed to load data for ${symbol}:`, error);
        }
      }

      return markets;
    } catch (error: any) {
      throw new Error(`Failed to get all markets: ${error.message}`);
    }
  }

  // ===== ACCOUNT LIQUIDITY METHODS =====

  async getAccountLiquidity(accountAddress?: Address) {
    const address = accountAddress || this.getAddress();
    if (!address) {
      throw new Error('No address provided and wallet not initialized');
    }

    try {
      const [error, liquidity, shortfall] = await publicClient.readContract({
        address: COMPTROLLER_ADDRESS,
        abi: COMPTROLLER_ABI,
        functionName: 'getAccountLiquidity',
        args: [address]
      }) as [bigint, bigint, bigint];

      if (Number(error) !== 0) {
        throw new Error(`Comptroller error: ${error}`);
      }

      // Get user's positions
      const assetsIn = await publicClient.readContract({
        address: COMPTROLLER_ADDRESS,
        abi: COMPTROLLER_ABI,
        functionName: 'getAssetsIn',
        args: [address]
      }) as Address[];

      const positions = [];
      let totalCollateralUSD = 0;
      let totalBorrowUSD = 0;

      for (const cTokenAddress of assetsIn) {
        try {
          const position = await this.getUserPosition(cTokenAddress, address);
          if (position) {
            positions.push(position);
            totalCollateralUSD += position.supplyValueUSD;
            totalBorrowUSD += position.borrowValueUSD;
          }
        } catch (error) {
          console.error(`Failed to get position for ${cTokenAddress}:`, error);
        }
      }

      const healthFactor = totalBorrowUSD > 0 ? totalCollateralUSD / totalBorrowUSD : 999;

      return {
        liquidity: (Number(liquidity) / 1e18).toString(),
        shortfall: (Number(shortfall) / 1e18).toString(),
        healthFactor,
        totalCollateralUSD,
        totalBorrowUSD,
        positions
      };
    } catch (error: any) {
      throw new Error(`Failed to get account liquidity: ${error.message}`);
    }
  }

  private async getUserPosition(cTokenAddress: Address, userAddress: Address) {
    try {
      const [accountSnapshot, cTokenBalance] = await Promise.all([
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'getAccountSnapshot',
          args: [userAddress]
        }),
        publicClient.readContract({
          address: cTokenAddress,
          abi: CTOKEN_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        })
      ]) as [[bigint, bigint, bigint, bigint], bigint];

      const [error, , borrowBalance, exchangeRateMantissa] = accountSnapshot;

      if (Number(error) !== 0) {
        return null;
      }

      const supplyBalance = (cTokenBalance * exchangeRateMantissa) / 10n ** 18n;
      const marketSymbol = this.findMarketSymbolByCToken(cTokenAddress);
      const price = await this.getTokenPrice(marketSymbol);

      return {
        cTokenAddress,
        symbol: marketSymbol,
        underlyingSymbol: marketSymbol,
        supplyBalance: (Number(supplyBalance) / 1e18).toString(),
        borrowBalance: (Number(borrowBalance) / 1e18).toString(),
        supplyValueUSD: (Number(supplyBalance) / 1e18) * price,
        borrowValueUSD: (Number(borrowBalance) / 1e18) * price,
        collateralFactor: '75.0',
        isCollateral: true
      };
    } catch (error) {
      return null;
    }
  }

  // ===== PROTOCOL STATS METHODS =====

  async getProtocolStats() {
    try {
      const markets = await this.getAllMarkets();
      const prices = await this.fetchPrices();

      let totalTVL = 0;
      let totalBorrows = 0;

      for (const market of markets) {
        totalTVL += parseFloat(market.totalSupply) * market.price;
        totalBorrows += parseFloat(market.totalBorrows) * market.price;
      }

      const utilization = totalTVL > 0 ? (totalBorrows / totalTVL) * 100 : 0;

      return {
        totalTVL,
        totalBorrows,
        utilization,
        markets,
        prices,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get protocol stats: ${error.message}`);
    }
  }

  // ===== ALLOWANCE AND MARKET ENTRY METHODS =====

  async checkAllowance(tokenSymbol: string, spenderAddress: Address): Promise<string> {
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      throw new ValidationError(`Token ${tokenSymbol} not supported`);
    }

    if (tokenSymbol === 'KAIA') {
      return "115792089237316195423570985008687907853269984665640564039457584007913129639935"; // Max uint256 for native token
    }

    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [this.getAddress()!, spenderAddress]
      }) as bigint;

      return allowance.toString();
    } catch (error: any) {
      throw new Error(`Failed to check allowance: ${error.message}`);
    }
  }

  async approveToken(tokenSymbol: string, spenderAddress: Address, amount?: string): Promise<string> {
    this.requireTransactionMode();

    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      throw new ValidationError(`Token ${tokenSymbol} not supported`);
    }

    if (tokenSymbol === 'KAIA') {
      throw new ValidationError('KAIA is native token and does not require approval');
    }

    try {
      const amountWei = amount ? parseUnits(amount, 18) :
        BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'); // Max uint256

      const txHash = await this.walletClient!.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amountWei],
        account: this.account!,
        chain: kaia
      });

      return txHash;
    } catch (error) {
      throw handleContractError(error);
    }
  }

  async checkMarketMembership(cTokenAddress: Address): Promise<boolean> {
    const userAddress = this.getAddress();
    if (!userAddress) {
      throw new Error('Wallet not initialized');
    }

    try {
      const assetsIn = await publicClient.readContract({
        address: COMPTROLLER_ADDRESS,
        abi: COMPTROLLER_ABI,
        functionName: 'getAssetsIn',
        args: [userAddress]
      }) as Address[];

      return assetsIn.includes(cTokenAddress);
    } catch (error: any) {
      throw new Error(`Failed to check market membership: ${error.message}`);
    }
  }

  async enterMarkets(cTokenAddresses: Address[]): Promise<string> {
    this.requireTransactionMode();

    try {
      const txHash = await this.walletClient!.writeContract({
        address: COMPTROLLER_ADDRESS,
        abi: COMPTROLLER_ABI,
        functionName: 'enterMarkets',
        args: [cTokenAddresses],
        account: this.account!,
        chain: kaia
      });

      return txHash;
    } catch (error) {
      throw handleContractError(error);
    }
  }

  // ===== TRANSACTION METHODS =====

  async sendNativeToken(to: Address, amount: string): Promise<string> {
    this.requireTransactionMode();

    const validation = validateTransactionParams({ to, amount });
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    try {
      const balance = await publicClient.getBalance({
        address: this.getAddress()!
      });

      const amountWei = parseUnits(amount, 18);

      if (balance < amountWei) {
        throw new InsufficientBalanceError('KAIA', amount, balance.toString());
      }

      const txHash = await this.walletClient!.sendTransaction({
        to,
        value: amountWei,
        account: this.account!,
        chain: kaia
      });

      return txHash;
    } catch (error) {
      throw handleContractError(error);
    }
  }

  async sendERC20Token(tokenSymbol: string, to: Address, amount: string): Promise<string> {
    this.requireTransactionMode();

    const validation = validateTransactionParams({ to, amount, symbol: tokenSymbol });
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      throw new ValidationError(`Token ${tokenSymbol} not supported`);
    }

    try {
      const txHash = await this.walletClient!.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, parseUnits(amount, 18)],
        account: this.account!,
        chain: kaia
      });

      return txHash;
    } catch (error) {
      throw handleContractError(error);
    }
  }

  async supplyToMarket(tokenSymbol: string, amount: string): Promise<string> {
    this.requireTransactionMode();

    const cTokenAddress = SYMBOL_TO_CTOKEN[tokenSymbol as keyof typeof SYMBOL_TO_CTOKEN];
    if (!cTokenAddress) {
      throw new ValidationError(`Market ${tokenSymbol} not available`);
    }

    try {
      // Check if user is in the market, if not, enter market
      const isInMarket = await this.checkMarketMembership(cTokenAddress);
      if (!isInMarket) {
        await this.enterMarkets([cTokenAddress]);
      }

      // For ERC20 tokens, check and handle allowance
      if (tokenSymbol !== 'KAIA') {
        const currentAllowance = await this.checkAllowance(tokenSymbol, cTokenAddress);
        const amountWei = parseUnits(amount, 18);

        if (BigInt(currentAllowance) < amountWei) {
          await this.approveToken(tokenSymbol, cTokenAddress);
        }
      }

      const amountWei = parseUnits(amount, 18);

      const txHash = await this.walletClient!.writeContract({
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'mint',
        args: [amountWei],
        account: this.account!,
        chain: kaia
      });

      return txHash;
    } catch (error) {
      throw handleContractError(error);
    }
  }

  async borrowFromMarket(tokenSymbol: string, amount: string): Promise<string> {
    this.requireTransactionMode();

    const cTokenAddress = SYMBOL_TO_CTOKEN[tokenSymbol as keyof typeof SYMBOL_TO_CTOKEN];
    if (!cTokenAddress) {
      throw new ValidationError(`Market ${tokenSymbol} not available`);
    }

    try {
      const amountWei = parseUnits(amount, 18);

      const txHash = await this.walletClient!.writeContract({
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'borrow',
        args: [amountWei],
        account: this.account!,
        chain: kaia
      });

      return txHash;
    } catch (error) {
      throw handleContractError(error);
    }
  }

  async repayBorrow(tokenSymbol: string, amount?: string): Promise<string> {
    this.requireTransactionMode();

    const cTokenAddress = SYMBOL_TO_CTOKEN[tokenSymbol as keyof typeof SYMBOL_TO_CTOKEN];
    if (!cTokenAddress) {
      throw new ValidationError(`Market ${tokenSymbol} not available`);
    }

    try {
      // For ERC20 tokens, check and handle allowance
      if (tokenSymbol !== 'KAIA') {
        const currentAllowance = await this.checkAllowance(tokenSymbol, cTokenAddress);
        const amountWei = amount ? parseUnits(amount, 18) :
          BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

        if (BigInt(currentAllowance) < amountWei) {
          await this.approveToken(tokenSymbol, cTokenAddress);
        }
      }

      const amountWei = amount ? parseUnits(amount, 18) :
        BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

      const txHash = await this.walletClient!.writeContract({
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'repayBorrow',
        args: [amountWei],
        account: this.account!,
        chain: kaia
      });

      return txHash;
    } catch (error) {
      throw handleContractError(error);
    }
  }

  // ===== DRAGONSWAP METHODS =====

  async getSwapQuote(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountInDecimals?: number;
    slippage?: number;
  }) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      amountInDecimals = 18,
      slippage = DEFAULT_SLIPPAGE
    } = params;

    // Parse token symbols to addresses
    const tokenInAddress = this.parseTokenSymbol(tokenIn);
    const tokenOutAddress = this.parseTokenSymbol(tokenOut);

    // Convert amount to wei
    const amountInWei = parseUnits(amountIn, amountInDecimals);

    try {
      // Get dynamic fee tier priorities based on trade characteristics
      const prioritizedFeeTiers = this.getOptimalFeeTiers(amountInWei, amountInDecimals);
      const quotes: any[] = [];

      for (const fee of prioritizedFeeTiers) {
        try {
          const quote = await this.calculateQuoteFromPool(tokenInAddress, tokenOutAddress, amountIn, amountInDecimals, fee);

          // Calculate liquidity score for this quote
          const liquidityScore = this.calculateLiquidityScore(quote, amountInWei);

          quotes.push({
            ...quote,
            liquidityScore,
            feeTier: fee,
            priceImpact: this.calculatePriceImpact(quote, amountInWei)
          });
        } catch (error) {
          // Skip this fee tier if pool doesn't exist
          continue;
        }
      }

      if (quotes.length === 0) {
        throw new Error('No available pools found for this token pair');
      }

      // Select best quote based on liquidity-weighted scoring
      const bestQuote = this.selectBestQuote(quotes);

      // Calculate minimum amount out based on slippage
      const slippageMultiplier = (10000 - slippage) / 10000;
      const minAmountOutWei = (BigInt(bestQuote.amountOut) * BigInt(Math.floor(slippageMultiplier * 10000))) / 10000n;

      // Get current balances for context (only if wallet is initialized)
      let balanceIn = "0";
      let balanceOut = "0";
      try {
        const walletAddress = this.getAddress();
        if (walletAddress) {
          balanceIn = await this.getSwapTokenBalance(tokenInAddress, walletAddress);
          balanceOut = await this.getSwapTokenBalance(tokenOutAddress, walletAddress);
        }
      } catch (error: any) {
        // Skip balance fetching in read-only mode or if it fails
        console.warn("Could not fetch token balances:", error.message);
      }

      return {
        ...bestQuote,
        amountOut: minAmountOutWei.toString(),
        tokenInSymbol: this.getTokenSymbol(tokenIn),
        tokenOutSymbol: this.getTokenSymbol(tokenOut),
        currentBalanceIn: balanceIn,
        currentBalanceOut: balanceOut,
        estimatedPrice: parseFloat(bestQuote.amountOutFormatted) / parseFloat(bestQuote.amountInFormatted),
        liquidityScore: bestQuote.liquidityScore,
        priceImpact: bestQuote.priceImpact,
        selectedFeeTier: bestQuote.feeTier,
        tradeSizeCategory: this.categorizeTradeSize(amountInWei, amountInDecimals)
      };
    } catch (error) {
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeSwap(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountInDecimals?: number;
    slippage?: number;
    recipient?: string;
    deadline?: number;
  }): Promise<string> {
    this.requireTransactionMode();

    const quote = await this.getSwapQuote(params);

    const {
      tokenIn,
      tokenOut,
      slippage = DEFAULT_SLIPPAGE,
      recipient = this.getAddress()!,
      deadline = DEFAULT_DEADLINE
    } = params;

    // Parse token addresses
    const tokenInAddress = this.parseTokenSymbol(tokenIn);
    const tokenOutAddress = this.parseTokenSymbol(tokenOut);

    // Calculate deadline timestamp
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);

    // Determine if we need to approve tokens
    if (tokenInAddress !== SWAP_TOKENS.KAIA) {
      await this.approveSwapToken(tokenInAddress, DRAGONSWAP_CONTRACTS.swapRouter, quote.amountIn);
    }

    // Prepare swap parameters
    const swapParams = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      fee: BigInt(quote.route?.pools[0]?.fee || FEE_TIERS.MEDIUM),
      recipient: recipient as Address,
      deadline: BigInt(deadlineTimestamp),
      amountIn: BigInt(quote.amountIn),
      amountOutMinimum: BigInt(quote.amountOut),
      sqrtPriceLimitX96: 0n, // No price limit
    };

    // Import SwapRouterABI dynamically
    const SwapRouterABI = await import('../contracts/dragonswap/SwapRouter.json').then(m => m.default);

    // Execute swap
    const { request } = await publicClient.simulateContract({
      address: DRAGONSWAP_CONTRACTS.swapRouter,
      abi: SwapRouterABI,
      functionName: 'exactInputSingle',
      args: [swapParams],
      account: this.account!,
      value: tokenInAddress === SWAP_TOKENS.KAIA ? BigInt(quote.amountIn) : 0n,
    });

    const hash = await this.walletClient!.writeContract(request);
    return hash;
  }

  async getPoolInfo(token0: string, token1: string, fee: number) {
    const token0Address = this.parseTokenSymbol(token0);
    const token1Address = this.parseTokenSymbol(token1);

    try {
      // Get pool address from factory
      const factoryContract = {
        address: DRAGONSWAP_CONTRACTS.factory,
        abi: [
          {
            "inputs": [
              { "internalType": "address", "name": "tokenA", "type": "address" },
              { "internalType": "address", "name": "tokenB", "type": "address" },
              { "internalType": "uint24", "name": "fee", "type": "uint24" }
            ],
            "name": "getPool",
            "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const,
      };

      const poolAddress = await publicClient.readContract({
        ...factoryContract,
        functionName: 'getPool',
        args: [token0Address, token1Address, fee],
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
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "token1",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "fee",
            "outputs": [{ "internalType": "uint24", "name": "", "type": "uint24" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "liquidity",
            "outputs": [{ "internalType": "uint128", "name": "", "type": "uint128" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "slot0",
            "outputs": [
              { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
              { "internalType": "int24", "name": "tick", "type": "int24" },
              { "internalType": "uint16", "name": "observationIndex", "type": "uint16" },
              { "internalType": "uint16", "name": "observationCardinality", "type": "uint16" },
              { "internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16" },
              { "internalType": "uint8", "name": "feeProtocol", "type": "uint8" },
              { "internalType": "bool", "name": "unlocked", "type": "bool" }
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const,
      };

      const [poolToken0, poolToken1, poolFee, liquidity, slot0] = await publicClient.multicall({
        contracts: [
          { ...poolContract, functionName: 'token0' },
          { ...poolContract, functionName: 'token1' },
          { ...poolContract, functionName: 'fee' },
          { ...poolContract, functionName: 'liquidity' },
          { ...poolContract, functionName: 'slot0' },
        ],
      });

      const sqrtPrice = slot0.result?.[0] || 0n;
      const tick = Number(slot0.result?.[1] || 0);

      // Calculate price from sqrtPriceX96 if available
      let price0 = "0";
      let price1 = "0";

      if (sqrtPrice > 0n) {
        // Price = (sqrtPriceX96 / 2^96)^2
        const price = (sqrtPrice * sqrtPrice) / (BigInt(2) ** BigInt(96));
        price0 = formatUnits(price, 18);
        price1 = (1 / parseFloat(price0 || "0")).toString();
      }

      return {
        address: poolAddress,
        token0: poolToken0.result as Address,
        token1: poolToken1.result as Address,
        fee: Number(poolFee.result),
        liquidity: liquidity.result?.toString() || '0',
        sqrtPriceX96: sqrtPrice.toString(),
        tick,
        token0Price: price0,
        token1Price: price1,
        feeTierName: this.getFeeTierName(Number(poolFee.result)),
        balance0: "0", // Would need additional calls to get balances
        balance1: "0",
      };

    } catch (error) {
      return null;
    }
  }

  async getAllPools(token0: string, token1: string) {
    const feeTiers = [FEE_TIERS.LOWEST, FEE_TIERS.LOW, FEE_TIERS.MEDIUM, FEE_TIERS.HIGH, FEE_TIERS.HIGHEST];
    const pools = [];

    for (const fee of feeTiers) {
      const poolInfo = await this.getPoolInfo(token0, token1, fee);
      if (poolInfo) {
        pools.push(poolInfo);
      }
    }

    return pools;
  }

  async getBestRoute(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountInDecimals?: number;
  }) {
    // For now, implement single-hop routing
    // Multi-hop routing can be added later
    const quote = await this.getSwapQuote(params);

    return {
      type: 'single-hop',
      route: quote.route,
      quote,
      gasEstimate: quote.gasEstimate || '0'
    };
  }

  // ===== DRAGONSWAP HELPER METHODS =====

  private async calculateQuoteFromPool(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: string,
    amountInDecimals: number,
    fee: number
  ) {
    // Get pool info
    const poolInfo = await this.getPoolInfo(tokenIn.toString(), tokenOut.toString(), fee);
    if (!poolInfo) {
      throw new Error(`Pool does not exist for fee tier ${fee}`);
    }

    if (BigInt(poolInfo.liquidity) === 0n) {
      throw new Error(`Pool has no liquidity for fee tier ${fee}`);
    }

    // Get token decimals
    const [tokenInDecimals, tokenOutDecimals] = await Promise.all([
      this.getSwapTokenDecimals(tokenIn),
      this.getSwapTokenDecimals(tokenOut)
    ]);

    // Calculate quote using tick-based formula
    const amountInWei = parseUnits(amountIn, tokenInDecimals);
    const isToken0Input = tokenIn.toLowerCase() === poolInfo.token0.toLowerCase();

    const amountOutWei = this.calculateAmountOutFromSqrtPrice(
      BigInt(poolInfo.sqrtPriceX96),
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

  private calculateAmountOutFromSqrtPrice(
    sqrtPriceX96: bigint,
    amountIn: bigint,
    tokenInDecimals: number,
    tokenOutDecimals: number,
    isToken0Input: boolean
  ): bigint {
    // FIXED: Using proper Uniswap V3 price calculation with correct decimal handling
    // sqrtPriceX96 = sqrt(price) * 2^96 where price = token1/token0 in raw units (wei/wei)

    const Q96 = BigInt(2) ** BigInt(96);

    // Calculate price = (sqrtPriceX96 / 2^96)^2
    // This gives us price in raw units where price = token1/token0
    const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
    const priceRaw = sqrtPrice * sqrtPrice;

    // CRITICAL FIX: Get token0 and token1 decimals (NOT input/output decimals)
    // The pool always stores price as token1/token0, so we must use the correct decimals
    const token0Decimals = isToken0Input ? tokenInDecimals : tokenOutDecimals;
    const token1Decimals = isToken0Input ? tokenOutDecimals : tokenInDecimals;

    // Convert price from raw units (wei/wei) to human-readable
    // price_human = price_raw * 10^(token0Decimals - token1Decimals)
    const priceHuman = priceRaw * Math.pow(10, token0Decimals - token1Decimals);

    // Convert amountIn to human-readable
    const amountInHuman = Number(amountIn) / Math.pow(10, tokenInDecimals);

    let amountOutHuman: number;

    if (isToken0Input) {
      // Swapping token0 for token1
      // amount1_out = amount0_in * (token1/token0)
      amountOutHuman = amountInHuman * priceHuman;
    } else {
      // Swapping token1 for token0
      // amount0_out = amount1_in / (token1/token0) = amount1_in * (token0/token1)
      amountOutHuman = amountInHuman / priceHuman;
    }

    // Convert back to wei with tokenOut decimals
    const amountOutWei = BigInt(Math.floor(amountOutHuman * Math.pow(10, tokenOutDecimals)));

    return amountOutWei;
  }

  private async getSwapTokenDecimals(token: Address): Promise<number> {
    if (
      token === SWAP_TOKENS.KAIA ||
      token === SWAP_TOKENS.WKAIA ||
      token === SWAP_TOKENS.WKAI ||
      token === SWAP_TOKENS.BORA ||
      token === SWAP_TOKENS.SIX ||
      token === SWAP_TOKENS.MBX ||
      token === SWAP_TOKENS.STAKED_KAIA ||
      token === SWAP_TOKENS.STKAIA ||
      token === SWAP_TOKENS.RKLAY ||
      token === SWAP_TOKENS.WETH ||
      token === SWAP_TOKENS.ETH ||
      token === SWAP_TOKENS.BTCB
    ) {
      return 18;
    }

    if (
      token === SWAP_TOKENS.USDT ||
      token === SWAP_TOKENS.USDT_OFFICIAL ||
      token === SWAP_TOKENS.USDT_WORMHOLE
    ) {
      return 6;
    }

    try {
      const decimals = await publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      return Number(decimals);
    } catch (error) {
      return 18; // Default to 18 decimals
    }
  }

  private async getSwapTokenBalance(token: Address, walletAddress?: Address): Promise<string> {
    const address = walletAddress || this.getAddress()!;

    if (token === SWAP_TOKENS.KAIA) {
      const balance = await publicClient.getBalance({ address });
      return formatUnits(balance, 18);
    }

    const balance = await publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    // Get actual decimals for this token
    const decimals = await this.getSwapTokenDecimals(token);
    return formatUnits(balance as bigint, decimals);
  }

  private async approveSwapToken(token: Address, spender: Address, amount: string): Promise<void> {
    if (token === SWAP_TOKENS.KAIA) {
      return; // KAIA doesn't need approval
    }

    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [this.getAddress()!, spender],
    });

    if (BigInt(currentAllowance as bigint) >= BigInt(amount)) {
      return; // Already approved
    }

    // Approve token
    const { request } = await publicClient.simulateContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, maxUint256],
      account: this.account!,
    });

    await this.walletClient!.writeContract(request);
  }

  private parseTokenSymbol(token: string): Address {
    // Check if it's a known token symbol
    const upperToken = token.toUpperCase();
    if (SWAP_TOKENS[upperToken as keyof typeof SWAP_TOKENS]) {
      return SWAP_TOKENS[upperToken as keyof typeof SWAP_TOKENS] as Address;
    }

    // Check if it's already an address
    if (token.startsWith('0x') && token.length === 42) {
      return token as Address;
    }

    throw new Error(`Invalid token address or symbol: ${token}`);
  }

  private getTokenSymbol(token: string): string {
    const upperToken = token.toUpperCase();
    if (SWAP_TOKENS[upperToken as keyof typeof SWAP_TOKENS]) {
      return upperToken;
    }

    // If it's an address, return shortened version
    if (token.startsWith('0x') && token.length === 42) {
      return `${token.slice(0, 6)}...${token.slice(-4)}`;
    }

    return token;
  }

  private getFeeTierName(fee: number): string {
    switch (fee) {
      case FEE_TIERS.LOWEST: return '0.01%';
      case FEE_TIERS.LOW: return '0.05%';
      case FEE_TIERS.MEDIUM: return '0.1%';
      case FEE_TIERS.HIGH: return '0.3%';
      case FEE_TIERS.HIGHEST: return '1%';
      default: return `${fee / 10000}%`;
    }
  }

  // ===== HELPER METHODS =====

  private requireTransactionMode(): void {
    if (this.isReadonly) {
      throw new Error('This operation requires transaction mode. Provide a private key to enable transactions.');
    }
  }

  async getTokenBalance(tokenAddress: Address, accountAddress: Address): Promise<bigint> {
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [accountAddress]
      });

      return balance as bigint;
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  private async fetchPrices(): Promise<Record<string, number>> {
    try {
      const response = await axios.get(apiConfig.priceUrl, { timeout: apiConfig.timeout });

      const prices: Record<string, number> = {};

      // Parse KiloLend API response format
      if (response.data?.success && response.data?.data) {
        const priceData = response.data.data;

        // Map API symbols to our internal symbols
        for (const item of priceData) {
          switch (item.symbol) {
            case 'KAIA':
              prices['KAIA'] = item.price;
              break;
            case 'BORA':
              prices['BORA'] = item.price;
              break;
            case 'MARBLEX':
              prices['MBX'] = item.price;
              break;
            case 'STAKED_KAIA':
              prices['STAKED_KAIA'] = item.price;
              break;
            case 'USDT':
              prices['USDT'] = item.price;
              break;
            case 'SIX':
              prices['SIX'] = item.price;
              break;
          }
        }
      }

      // Set fallback values for missing tokens
      if (!prices['USDT']) prices['USDT'] = 1.0;
      if (!prices['SIX']) prices['SIX'] = 0.1;

      return prices;
    } catch (error) {
      console.warn('Failed to fetch prices from KiloLend API, using fallback values');
      return {
        KAIA: 0.105, // Current approximate price
        USDT: 1.0,
        SIX: 0.1,
        BORA: 0.067, // Current approximate price
        MBX: 0.104, // Current approximate price
        STAKED_KAIA: 0.112 // Current approximate price
      };
    }
  }

  private findMarketSymbolByCToken(cTokenAddress: Address): string {
    const symbolMap: Record<string, string> = {
      '0x498823F094f6F2121CcB4e09371a57A96d619695': 'USDT',
      '0xC468dFD0C96691035B3b1A4CA152Cb64F0dbF64c': 'SIX',
      '0x7a937C07d49595282c711FBC613c881a83B9fDFD': 'BORA',
      '0xE321e20F0244500A194543B1EBD8604c02b8fA85': 'MBX',
      '0x98Ab86C97Ebf33D28fc43464353014e8c9927aB3': 'KAIA',
      '0x0BC926EF3856542134B06DCf53c86005b08B9625': 'STAKED_KAIA'
    };
    return symbolMap[cTokenAddress] || 'UNKNOWN';
  }

  private async getTokenPrice(symbol: string): Promise<number> {
    try {
      const prices = await this.fetchPrices();
      return prices[symbol] || 0;
    } catch (error) {
      return 0;
    }
  }

  async waitForTransaction(txHash: string): Promise<any> {
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as Address
      });
      return receipt;
    } catch (error) {
      throw new TransactionError(`Transaction ${txHash} failed`, txHash);
    }
  }

  // ===== LIQUIDITY-AWARE ROUTING METHODS =====

  private calculateLiquidityScore(quote: any, amountInWei: bigint): number {
    // Calculate liquidity score based on pool liquidity vs trade size
    const poolLiquidity = BigInt(quote.route?.pools[0]?.liquidity || '0');

    if (poolLiquidity === 0n) {
      return 0;
    }

    // Calculate trade size as percentage of pool liquidity
    const tradeSizeRatio = Number(amountInWei) / Number(poolLiquidity);

    // Higher score for pools with more liquidity relative to trade size
    // Score = 1 / (1 + tradeSizeRatio * 10) - gives higher scores to pools with better liquidity
    const liquidityScore = 1 / (1 + tradeSizeRatio * 10);

    return liquidityScore;
  }

  private calculatePriceImpact(quote: any, amountInWei: bigint): number {
    // Calculate price impact based on the trade size relative to pool liquidity
    const poolLiquidity = BigInt(quote.route?.pools[0]?.liquidity || '0');

    if (poolLiquidity === 0n) {
      return 100; // 100% price impact for empty pool
    }

    // Simple price impact estimation: tradeSize / (tradeSize + liquidity)
    const tradeSize = Number(amountInWei);
    const liquidity = Number(poolLiquidity);

    const priceImpact = (tradeSize / (tradeSize + liquidity)) * 100;

    return Math.min(priceImpact, 100); // Cap at 100%
  }

  private selectBestQuote(quotes: any[]): any {
    if (quotes.length === 0) {
      throw new Error('No quotes available');
    }

    if (quotes.length === 1) {
      return quotes[0];
    }

    // Score each quote based on multiple factors
    const scoredQuotes = quotes.map(quote => {
      const outputAmount = parseFloat(quote.amountOutFormatted);
      const liquidityScore = quote.liquidityScore;
      const priceImpact = quote.priceImpact;
      const feeTier = quote.feeTier;

      // Base score from output amount (normalized)
      const maxOutput = Math.max(...quotes.map(q => parseFloat(q.amountOutFormatted)));
      const outputScore = outputAmount / maxOutput;

      // Penalty for high price impact
      const priceImpactPenalty = priceImpact / 100; // Convert to 0-1 scale

      // Penalty for high fee tiers
      const feePenalty = feeTier / 10000; // Convert basis points to 0-1 scale

      // Combined score: weighted average of factors
      // We prioritize: output amount (40%), liquidity (30%), low price impact (20%), low fees (10%)
      const combinedScore = (
        outputScore * 0.4 +
        liquidityScore * 0.3 +
        (1 - priceImpactPenalty) * 0.2 +
        (1 - feePenalty) * 0.1
      );

      return {
        ...quote,
        combinedScore
      };
    });

    // Select quote with highest combined score
    const bestQuote = scoredQuotes.reduce((best, current) =>
      current.combinedScore > best.combinedScore ? current : best
    );

    return bestQuote;
  }

  // ===== DYNAMIC FEE TIER SELECTION METHODS =====

  private getOptimalFeeTiers(amountInWei: bigint, amountInDecimals: number): number[] {
    const tradeSizeCategory = this.categorizeTradeSize(amountInWei, amountInDecimals);

    switch (tradeSizeCategory) {
      case 'micro':
        // For micro trades, prioritize lowest fees for better rates
        return [FEE_TIERS.LOWEST, FEE_TIERS.LOW, FEE_TIERS.MEDIUM, FEE_TIERS.HIGH, FEE_TIERS.HIGHEST];

      case 'small':
        // For small trades, balance between fees and liquidity
        return [FEE_TIERS.LOW, FEE_TIERS.MEDIUM, FEE_TIERS.LOWEST, FEE_TIERS.HIGH, FEE_TIERS.HIGHEST];

      case 'medium':
        // For medium trades, prioritize liquidity over lowest fees
        return [FEE_TIERS.MEDIUM, FEE_TIERS.HIGH, FEE_TIERS.LOW, FEE_TIERS.LOWEST, FEE_TIERS.HIGHEST];

      case 'large':
        // For large trades, prioritize high liquidity pools
        return [FEE_TIERS.HIGH, FEE_TIERS.MEDIUM, FEE_TIERS.HIGHEST, FEE_TIERS.LOW, FEE_TIERS.LOWEST];

      case 'whale':
        // For whale trades, prioritize highest liquidity pools
        return [FEE_TIERS.HIGHEST, FEE_TIERS.HIGH, FEE_TIERS.MEDIUM, FEE_TIERS.LOW, FEE_TIERS.LOWEST];

      default:
        // Default to standard ordering
        return [FEE_TIERS.LOWEST, FEE_TIERS.LOW, FEE_TIERS.MEDIUM, FEE_TIERS.HIGH, FEE_TIERS.HIGHEST];
    }
  }

  private categorizeTradeSize(amountInWei: bigint, amountInDecimals: number): string {
    // Convert to human-readable amount for categorization
    const amountInHuman = Number(amountInWei) / Math.pow(10, amountInDecimals);

    // Define trade size categories (in USD equivalent terms)
    // These thresholds can be adjusted based on typical trading patterns
    if (amountInHuman < 10) {
      return 'micro';      // < $10 USD equivalent
    } else if (amountInHuman < 100) {
      return 'small';      // $10 - $100 USD equivalent
    } else if (amountInHuman < 1000) {
      return 'medium';     // $100 - $1,000 USD equivalent
    } else if (amountInHuman < 10000) {
      return 'large';      // $1,000 - $10,000 USD equivalent
    } else {
      return 'whale';      // > $10,000 USD equivalent
    }
  }
}

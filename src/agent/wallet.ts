import { createPublicClient, createWalletClient, http, WalletClient, Address, parseUnits } from 'viem';
import { privateKeyToAccount, type Account } from 'viem/accounts';
import { kaia } from 'viem/chains';
import { publicClient, networkInfo, apiConfig } from '../config';
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

  constructor(privateKey?: string) {
    if (privateKey) {
      // Initialize wallet for transaction capabilities
      this.account = privateKeyToAccount(privateKey as Address);
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
            // Note: USDT and SIX are not in the API response, use fallbacks
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
}

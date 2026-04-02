/**
 * packages/paper-execution/src/paper-wallet.ts
 * Tracks fake USDT balance and asset holdings. No real funds.
 */
import { v4 as uuid } from 'uuid';
import type { PortfolioBalance, AssetBalance } from '@crypto-paper-bot/shared-types';

export class PaperWallet {
  private usdt: number;
  private assets: Map<string, number> = new Map();
  private readonly initialBalance: number;
  private realizedPnlSession = 0;
  private realizedPnlAllTime = 0;
  private lastTickerPrices: Map<string, number> = new Map();

  constructor(initialUsdt: number) {
    this.usdt = initialUsdt;
    this.initialBalance = initialUsdt;
  }

  getAvailableUsdt(): number { return this.usdt; }
  getAssetBalance(asset: string): number { return this.assets.get(asset) ?? 0; }

  /** Deduct USDT, credit base asset (buy fill) */
  executeBuy(asset: string, quantity: number, totalCostUsdt: number): void {
    if (totalCostUsdt > this.usdt) {
      throw new Error(`Insufficient balance: need ${totalCostUsdt}, have ${this.usdt}`);
    }
    this.usdt -= totalCostUsdt;
    this.assets.set(asset, (this.assets.get(asset) ?? 0) + quantity);
  }

  /** Deduct base asset, credit USDT (sell fill) */
  executeSell(asset: string, quantity: number, netReceivedUsdt: number): void {
    const held = this.assets.get(asset) ?? 0;
    if (quantity > held) {
      throw new Error(`Insufficient ${asset}: need ${quantity}, have ${held}`);
    }
    this.assets.set(asset, held - quantity);
    this.usdt += netReceivedUsdt;
  }

  recordRealizedPnl(pnl: number): void {
    this.realizedPnlSession += pnl;
    this.realizedPnlAllTime += pnl;
  }

  updateTickerPrice(symbol: string, price: number): void {
    this.lastTickerPrices.set(symbol, price);
  }

  getSnapshot(unrealizedPnl = 0, lockedInPositions = 0): PortfolioBalance {
    const assetBalances: AssetBalance[] = [
      { asset: 'USDT', free: this.usdt, locked: 0, totalUsdt: this.usdt },
    ];

    for (const [asset, qty] of this.assets) {
      if (qty > 0) {
        const price = this.lastTickerPrices.get(`${asset}/USDT`) ?? 0;
        const totalUsdt = qty * price;
        assetBalances.push({ asset, free: qty, locked: 0, totalUsdt });
      }
    }

    const totalEquityUsdt = this.usdt + lockedInPositions + unrealizedPnl;

    return {
      id: uuid(),
      snapshotAt: new Date(),
      totalEquityUsdt,
      availableUsdt: this.usdt,
      lockedInPositions,
      unrealizedPnl,
      realizedPnlSession: this.realizedPnlSession,
      realizedPnlAllTime: this.realizedPnlAllTime,
      assets: assetBalances,
      initialBalance: this.initialBalance,
      returnPct: ((totalEquityUsdt - this.initialBalance) / this.initialBalance) * 100,
    };
  }
}

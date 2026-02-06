// Trading Analysis Types

export interface TradeSetup {
    symbol: string;
    name: string;
    sector: string;
    currentPrice: number;
    dayChange: number;
    dayChangePercent: number;
    bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    entry: number;
    stopLoss: number;
    target1: number;
    target2: number;
    shares: number;
    riskAmount: number;
    riskRewardRatio: string;
    volumeConfirm: boolean;
}

export interface KeyLevels {
    prevHigh: number;
    prevLow: number;
    vwap: number;
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
    invalidation: number;
}

export interface VolumeData {
    currentVolume: number;
    avgVolume20Day: number;
    relativeVolume: number;
    status: 'STRONG' | 'GOOD' | 'WEAK';
    entryThreshold: number;
}

export interface TechnicalIndicators {
    rsi: number;
    rsiStatus: 'OVERBOUGHT' | 'NEUTRAL' | 'OVERSOLD';
    macd: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    macdNote: string;
    ma50: number;
    ma200: number;
    priceVsMa50: 'ABOVE' | 'BELOW';
    priceVsMa200: 'ABOVE' | 'BELOW';
}

export interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
    autoCheck?: boolean; // Auto-checked based on data
}

export interface RiskSummary {
    positionValue: number;
    riskAmount: number;
    rewardPotential: number;
    maxDailyLoss: number;
    accountRiskPercent: number;
}

export interface TradeAnalysis {
    setup: TradeSetup;
    keyLevels: KeyLevels;
    volume: VolumeData;
    technicals: TechnicalIndicators;
    risk: RiskSummary;
}

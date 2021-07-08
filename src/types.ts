import {
    SwapTypes
} from '@balancer-labs/sor2';
import { BigNumber } from './utils/bignumber';

export interface TradeInfo {
    title: string;
    swapType: SwapTypes;
    tokenIn: string;
    tokenOut: string;
    maxPools: number;
    swapAmountWei: BigNumber;
    swapAmountNormalised: BigNumber;
    gasPriceWei: BigNumber;
    tokenInDecimals: number;
    tokenOutDecimals: number;
    pools: SubgraphPoolBase[];
}

export interface Result {
    title: string;
    timeData: TimeData;
    returnAmountWei: BigNumber;
    swaps: any;
}

export interface TimeData {
    fullSwap: number;
}

export interface SubgraphPoolBase {
    id: string;
    address: string;
    poolType: string;
    swapFee: string;
    totalShares: string;
    tokens: SubGraphToken[];
    tokensList: string[];

    // Weighted & Element field
    totalWeight?: string;

    // Stable specific fields
    amp?: string;

    // Element specific fields
    expiryTime?: number;
    unitSeconds?: number;
    principalToken?: string;
    baseToken?: string;
}

export interface SubGraphToken {
    address: string;
    balance: string;
    decimals: string | number;
    // Stable & Element field
    weight?: string;
}
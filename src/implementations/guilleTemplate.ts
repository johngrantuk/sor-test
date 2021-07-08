import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from '../utils/bignumber';
import * as sorv2 from '@balancer-labs/sor2';
import {
    SwapTypes,
    DisabledOptions,
    SwapInfo,
    PoolFilter,
    bnum
} from '@balancer-labs/sor2';
import {
    Result,
    TradeInfo
} from "../types";
import { performance } from 'perf_hooks';

export async function getSwapsGuille(tradeInfo: TradeInfo, swapCost: BigNumber): Promise<Result> {

    const fullSwapStart = performance.now();
    const r = processSwaps(
        { pools: tradeInfo.pools },
        tradeInfo.tokenIn,
        tradeInfo.tokenOut,
        tradeInfo.maxPools,
        tradeInfo.swapType,
        swapCost,
    );
    const fullSwapEnd = performance.now();
    const timeData = {
        fullSwap: fullSwapEnd - fullSwapStart
    }

    const result: Result = {
        title: 'Guille SOR',
        timeData: timeData,
        returnAmountWei: r.returnAmount,
        swaps: r.swaps
    }
    return result;
}

function processSwaps(
    pools,
    tokenIn,
    tokenOut,
    maxPools,
    swapType,
    swapCost
){
    // Implements new methods
    // Will have to manipulate pool data into correct format first?
    return { 
        returnAmount: bnum(0),
        swaps: []
    }
}
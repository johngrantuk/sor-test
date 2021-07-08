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

export async function getSwapsV2(tradeInfo: TradeInfo, swapCost: BigNumber): Promise<Result> {

    // This isn't used for any onchain calls at the moment
    const provider = new JsonRpcProvider();

    const fullSwapStart = performance.now();
    const r: SwapInfo = await getV2Swap(
        { pools: tradeInfo.pools },
        tradeInfo.tokenIn,
        tradeInfo.tokenOut,
        tradeInfo.tokenInDecimals,
        tradeInfo.tokenOutDecimals,
        tradeInfo.maxPools,
        tradeInfo.swapType,
        tradeInfo.swapAmountNormalised,
        swapCost,
        bnum(0),
        provider
    );
    const fullSwapEnd = performance.now();
    const timeData = {
        fullSwap: fullSwapEnd - fullSwapStart
    }

    const result: Result = {
        title: 'V2 SOR',
        timeData: timeData,
        returnAmountWei: r.returnAmount,
        swaps: r.swaps
    }
    return result;
}

export async function getV2Swap(
    pools: any,
    tokenIn: string,
    tokenOut: string,
    tokenInDecimals: number,
    tokenOutDecimals: number,
    maxPools: number,
    swapType: SwapTypes,
    swapAmountNormalised: BigNumber,
    costOutputToken: BigNumber,
    gasPrice: BigNumber,
    provider: JsonRpcProvider,
    swapCost: BigNumber = new BigNumber('100000'),
    disabledOptions: DisabledOptions = { isOverRide: false, disabledTokens: [] }
): Promise<SwapInfo> {
    const sor = new sorv2.SOR(
        provider,
        gasPrice,
        maxPools,
        1,
        JSON.parse(JSON.stringify(pools)),
        swapCost,
        disabledOptions
    );

    if (swapType === SwapTypes.SwapExactIn)
        await sor.setCostOutputToken(
            tokenOut,
            tokenOutDecimals,
            costOutputToken
        );
    else {
        await sor.setCostOutputToken(tokenIn, tokenInDecimals, costOutputToken);
    }

    // Means we don't use onChain balance info.
    const isFetched = await sor.fetchPools(false);

    const swapInfo: SwapInfo = await sor.getSwaps(
        tokenIn,
        tokenOut,
        swapType,
        swapAmountNormalised,
        { timestamp: 0, poolTypeFilter: PoolFilter.All }
    );

    return swapInfo;
}
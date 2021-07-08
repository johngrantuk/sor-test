// Uses SOR V1 from Balancer (Needs tidied!)
import * as sor from '@balancer-labs/sor';
import { 
    Pools as SubGraphPoolsV1,
    Pool as SubGraphPoolV1,
    Token as SubGraphTokenV1,
    DisabledOptions
} from '@balancer-labs/sor/dist/types';
import { 
    SubgraphPoolBase,
    SubGraphPoolsBase,
    bnum,
    scale,
    SwapTypes
} from '@balancer-labs/sor2';
import { performance } from 'perf_hooks';
import { BigNumber } from '../utils/bignumber';
import {
    Result, 
    TimeData, 
    TradeInfo
} from "../types";

export async function getSwapsV1(tradeInfo: TradeInfo, swapCost: BigNumber): Promise<Result>{
    const r = await getV1Swap(
        swapCost,
        tradeInfo.maxPools,
        { pools: tradeInfo.pools },
        tradeInfo.swapType,
        tradeInfo.tokenIn,
        tradeInfo.tokenOut,
        tradeInfo.swapAmountWei
    );

    const result: Result = {
        title: 'V1 SOR',
        timeData: r.timeData,
        returnAmountWei: r.returnAmount,
        swaps: r.swaps
    }

    return result;
}

export async function getV1Swap(
    costOutputToken: BigNumber,
    maxPools: number,
    allPools: any,// SubGraphPoolsV1,
    swapType: SwapTypes,
    tokenIn: string,
    tokenOut: string,
    swapAmount: BigNumber,
    disabledOptions: DisabledOptions = { isOverRide: false, disabledTokens: [] }
) {
    tokenIn = tokenIn.toLowerCase();
    tokenOut = tokenOut.toLowerCase();

    let timeData: TimeData = { fullSwap: 0 };

    let swapTypeStr = `swapExactIn`;
    if(swapType === SwapTypes.SwapExactOut)
        swapTypeStr = `swapExactOut`;

    // V1 will always ONLY use Weighted Pools
    const weightedPools = filterToWeightedPoolsOnly(allPools);
    if (weightedPools.pools.length === 0)
        return { swaps: [], returnAmount: bnum(0), timeData };

    // Helper - Filters for only pools with balance and converts to wei/bnum format.
    let poolsWithOnChainBalances = formatToV1schema(
        JSON.parse(JSON.stringify(weightedPools))
    );

    const fullSwapStart = performance.now();

    const filterPoolsStart = performance.now();

    let poolstokenIn, poolstokenOut, directPools, hopTokens;
    [directPools, hopTokens, poolstokenIn, poolstokenOut] = sor.filterPools(
        poolsWithOnChainBalances.pools, // allPoolsCorrect.pools,
        tokenIn,
        tokenOut,
        maxPools,
        disabledOptions
    );
    const filterPoolsEnd = performance.now();
    const sortPoolsMostLiquidStart = performance.now();

    // For each hopToken, find the most liquid pool for the first and the second hops
    let mostLiquidPoolsFirstHop, mostLiquidPoolsSecondHop;
    [
        mostLiquidPoolsFirstHop,
        mostLiquidPoolsSecondHop,
    ] = sor.sortPoolsMostLiquid(
        tokenIn,
        tokenOut,
        hopTokens,
        poolstokenIn,
        poolstokenOut
    );

    const sortPoolsMostLiquidEnd = performance.now();
    const parsePoolDataStart = performance.now();

    // Finds the possible paths to make the swap, each path can be a direct swap
    // or a multihop composed of 2 swaps
    let pools, pathData;
    [pools, pathData] = sor.parsePoolData(
        directPools,
        tokenIn,
        tokenOut,
        mostLiquidPoolsFirstHop,
        mostLiquidPoolsSecondHop,
        hopTokens
    );

    const parsePoolDataEnd = performance.now();
    const processPathsStart = performance.now();

    // For each path, find its spot price, slippage and limit amount
    // The spot price of a multihop is simply the multiplication of the spot prices of each
    // of the swaps. The slippage of a multihop is a bit more complicated (out of scope for here)
    // The limit amount is due to the fact that Balancer protocol limits a trade to 50% of the pool
    // balance of tokenIn (for swapExactIn) and 33.33% of the pool balance of tokenOut (for
    // swapExactOut)
    // 'paths' are ordered by ascending spot price
    let paths = sor.processPaths(pathData, pools, swapTypeStr);

    const processPathsEnd = performance.now();
    const processEpsOfInterestMultiHopStart = performance.now();

    // epsOfInterest stores a list of all relevant prices: these are either
    // 1) Spot prices of a path
    // 2) Prices where paths cross, meaning they would move to the same spot price after trade
    //    for the same amount traded.
    // For each price of interest we have:
    //   - 'bestPathsIds' a list of the id of the best paths to get to this price and
    //   - 'amounts' a list of how much each path would need to trade to get to that price of
    //     interest
    let epsOfInterest = sor.processEpsOfInterestMultiHop(
        paths,
        swapTypeStr,
        maxPools
    );

    const processEpsOfInterestMultiHopEnd = performance.now();
    const smartOrderRouterMultiHopEpsOfInterestStart = performance.now();

    // Returns 'swaps' which is the optimal list of swaps to make and
    // 'swapAmount' which is the total amount of tokenOut (eg. DAI) will be returned
    let swaps, returnAmount;
    [swaps, returnAmount] = sor.smartOrderRouterMultiHopEpsOfInterest(
        pools,
        paths,
        swapTypeStr,
        swapAmount,
        maxPools,
        costOutputToken,
        epsOfInterest
    );

    const smartOrderRouterMultiHopEpsOfInterestEnd = performance.now();
    const fullSwapEnd = performance.now();

    timeData = {
        fullSwap: fullSwapEnd - fullSwapStart,
        // filterPools: filterPoolsEnd - filterPoolsStart,
        // sortPools: sortPoolsMostLiquidEnd - sortPoolsMostLiquidStart,
        // parsePool: parsePoolDataEnd - parsePoolDataStart,
        // processPaths: processPathsEnd - processPathsStart,
        // processEps:
        //     processEpsOfInterestMultiHopEnd - processEpsOfInterestMultiHopStart,
        // filter: 'N/A',
        // sor:
        //     smartOrderRouterMultiHopEpsOfInterestEnd -
        //     smartOrderRouterMultiHopEpsOfInterestStart,
    };

    return { swaps, returnAmount, timeData };
}

// Helper to filter pools to contain only Weighted pools
export function filterToWeightedPoolsOnly(pools: any) {
    let weightedPools = { pools: [] };

    for (let pool of pools.pools) {
        if (pool.poolType === 'Weighted') weightedPools.pools.push(pool);
        // if (pool.amp === undefined) weightedPools.pools.push(pool);
    }
    return weightedPools;
}

/*
Helper to format V2 pools to V1 pool format.
Only weighted pools with balance.
Scales from normalised field values.
Changes weight field to denormWeight.
*/
function formatToV1schema(poolsV2: SubGraphPoolsBase): SubGraphPoolsV1 {
    let weightedPools: SubGraphPoolsBase = { pools: [] };

    for (let pool of poolsV2.pools) {
        // Only check first balance since AFAIK either all balances are zero or none are:
        if (pool.tokens.length != 0)
            if (pool.tokens[0].balance != '0')
                if (pool.poolType !== 'Stable' && pool.poolType !== 'Element')
                    weightedPools.pools.push(pool); // Do not include element pools
    }
    const poolsv1: SubGraphPoolV1[] = [];

    for (let i = 0; i < weightedPools.pools.length; i++) {
        const v1Pool: SubGraphPoolV1 = formatToV1Pool(weightedPools.pools[i]);
        poolsv1.push(v1Pool);
    }

    return { pools: poolsv1 };
}

function formatToV1Pool(pool: SubgraphPoolBase): SubGraphPoolV1 {
    const v1tokens: SubGraphTokenV1[] = [];
    pool.tokens.forEach(token => {
        v1tokens.push({
            address: token.address,
            balance: scale(
                bnum(token.balance),
                Number(token.decimals)
            ),
            decimals: Number(token.decimals),
            denormWeight: scale(bnum(token.weight), 18),
        });
    });

    const v1Pool: SubGraphPoolV1 = {
        id: pool.id,
        swapFee: scale(bnum(pool.swapFee), 18),
        totalWeight: scale(bnum(pool.totalWeight), 18),
        // totalShares: pool.totalShares.toString(),
        tokensList: pool.tokensList,
        tokens: v1tokens
    };

    return v1Pool;
}
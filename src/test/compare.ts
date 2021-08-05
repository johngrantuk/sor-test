import { assert } from "chai";
import {
    bnum,
    SwapTypes
} from '@balancer-labs/sor2';
import { 
    tradeFiles, 
    loadTradeFile  
} from "../tradeFiles";
import { getSwapsV1 } from "../implementations/sorV1";
import { getSwapsV2 } from "../implementations/sorV2";
import { getSwapsTemplate } from "../implementations/newTemplate";
import { 
    TradeInfo,
    Result
} from "../types";


// Loop through each tradeFile and run specified tests
describe("Compare SOR implementations against a range of tests", () => {
    tradeFiles.forEach(tradeFile => {
        compareTest(tradeFile);
    });
});

// This is a basic compare test where V2 results must be gte to V1 results
// Should be able to add new tests as we wish
async function compareTest(tradeFile: string) {
    it(`Compare Test: ${tradeFile}`, async () => {
        // Load trade info and pools from test file
        const tradeInfo = loadTradeFile(tradeFile);

        // Will need to test various
        const swapCost = bnum(0);

        // Get result from each implementation
        const swapV1: Result = await getSwapsV1(tradeInfo, swapCost);
        const swapV2: Result = await getSwapsV2(tradeInfo, swapCost);
        const swapTemplate: Result = await getSwapsTemplate(tradeInfo, swapCost);

        const results: Result[] = [swapV1, swapV2, swapTemplate];
        printResults(tradeInfo, results);
        assertResults(results);
    }).timeout(10000);
}

// Assert each result is gte to previous
function assertResults(results: Result[]) {
    if(results.length < 2){
        console.log('Only Single Result');
        console.log(results[0]);
        return;
    }

    for(let i = 1;i < results.length;i++){
        const check = results[i].returnAmountWei.gte(results[i - 1].returnAmountWei)
        assert(check, `${results[i].title} less than ${results[i - 1].title}`);
    }
}

// Prints useful info and results
function printResults(tradeInfo: TradeInfo, results: Result[], verbose: boolean = false){
    console.log(`Pools From File: ${tradeInfo.title}`);
    if (tradeInfo.swapType === SwapTypes.SwapExactIn)
        console.log(`SwapExactIn`);
    else
        console.log(`SwapExactOut`);
    console.log(`In: ${tradeInfo.tokenIn.toLowerCase()}, (${tradeInfo.tokenInDecimals} decimals)`);
    console.log(`Out: ${tradeInfo.tokenOut.toLowerCase()}, (${tradeInfo.tokenOutDecimals} decimals)`);
    console.log(`Swap Amt (Wei): ${tradeInfo.swapAmountWei.toString()}`);
    console.log(`Max Pools: ${tradeInfo.maxPools}`);

    let tableData = [];
    results.forEach(result => {
        tableData.push({
            SOR: result.title,
            'Full SOR Time': result.timeData.fullSwap,
            'Return Amt (Wei)': result.returnAmountWei.toString(),
        });
    });

    console.table(tableData);

    if (verbose) {
        results.forEach(result => {
            console.log(`${result.title} Swaps: `);
            console.log(result.swaps);
        });
    }
}

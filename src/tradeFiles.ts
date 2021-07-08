import * as fs from 'fs';
import {
    SwapTypes,
    bnum
} from '@balancer-labs/sor2';
import { 
    TradeInfo
} from './types';

const testDir = `${__dirname}/tradeFiles/`;

// These files will be considered for tests. Comment a file to ignore.
export const tradeFiles = [
    'gusdBug',
    'gusdBugSinglePath',
    '25178485-blockKovan', // UI-506, WETH to WBTC Bug
    'elementFinanceTest_multihop_1path',
    'elementFinanceTest_multihop_2paths',
    'elementFinanceTest_multihop_1path_swapExactOut',
    'elementFinanceTest_multihop_2paths_swapExactOut', // Returning a second swap with -ve amount
    'elementFinanceTestFourPools',
    'elementFinanceTest1',
    'elementFinanceTest2',
    'elementFinanceTest3',
    'elementFinanceTest4',
    '0x04ec8acaa4f419bc1525eaa8d37faae2d4acb64c5521a3718593c626962de170', // Dust amounts
    '0xa7a3cf76686c6d6aa6e976724b4463c6f7b0e98453ad3a8488b6e9daa2fecc42', // Dust amounts
    '0xab11cdebd9d96f2f4d9d29f0df62de0640c457882d92435aff2a7c1049a0be6a', // Dust amounts
    '0x0a554ce1e35b9820f121ac7faa97069650df754117d6c5eb7c1158f915878343',
    '0x139894ec2cacfeca1035e78968124dbb2d34034bde146f5f2ab311ada75ad04f',
    '0x21d5562b317f9d3b57b3406ee868ad882ab3c87cd67f7af2ff55042e59702bef',
    '0x32286e13c9dbfe92f4d9527bfe2ff18edf10dedb55e08b11710bf84cebf4de6d',
    '0x39fbeeaacdffc7186135ad169c0bbdbdddb42901a3c12cac2081af603f52ccda',
    '0x4538a9ba66778343983d39a744e6c337ee497247be50090e8feb18761d275306',
    '0x462bd3a36b8a1fdf64e0d9dcf88d18c1d246b4dfca1704f26f883face2612c18',
    '0x5fccb4ca1117b8a274bc6e939c63493203e5744cdf04d0045cf2bc08b01f4c18',
    '0x5fd850f563e180d962bc8e243fbfa27a410e9610faff5f1ecbd2ccdf6599f907',
    '0x6b4011c5e4c17293c0db18fb63e334544107b6451d7e74ce9c88b0b1c07b8fda',
    '0x820b13539ec5117e04380b53c766de9aa604bfb5d751392d3df3d1beff26e30a',
    '0x855d140758a5d0e8839d772ffa8e3afecc522bfbae621cdc91069bfeaaac490c',
    '0x9308920064cab0e15ca98444ec9f91092d24aba03dd383c168f6cc2e45954e0e',
    '0x99cc915640bbb9ef7dd6979062fea2a34eff2b400398a4c00405462840956818',
    '0xfab93b6aece1282a829e8bdcdf2a1aee193a10134279a0a16c989ca71644e85b',
    'fleek-11-03-21',
    'subgraphPoolsDecimalsTest',
    'subgraphPoolsLarge',
    'subgraphPoolsSmallWithTrade',
    '0x03b36dce65627cf8a2a392788c2d319659c8de26b2f83f8d117558891fa59216',
    '0x24ecf45a2fc734c487abcfcdaec558e5d6cc1fb4a7c85ad6b362c017649d3156',
    '0x2ee23274910c172db9de340b1740e63f34b7d86db79827024316f173bf1284d9',
    '0x32c912f8f82952f631c39be6c69bd72a1da978d8d0704a7d32b8310431375bfa',
    '0x3fd20d1d22910c0ee8ae926a1e90afca679cbcc65962135eff43e16fbae12745',
    '0x56164d81bf21d9ec5c2a3f6d93dec8cf39e5ed1567e155bbd66f9d2360b15c95',
    '0x5dd7b4c527806eba0d0ae9e381ea9143ed1e91554e8e060f6d1dcd76119bfdcc',
    '0x88bf77edcbdfc9483904316ac6fdb6e162cf7bfa85a73bc1960ccdab22be351b',
    '0x8e0ea7b408b21005b73238a7e718c8f0320f569ea0c001a1a672bef88288cd91',
    '0x94d106cd9a7e5f2d30ea82a404b1dcfb31c4f6bb85fba228769cf543c5ecf2f5',
    '0x958eb7095ad851133bb2d3282a370108832094082e7554e48c9218cf376cd0be',
    '0xc495fe9e8e74880ddc6d8a42a87bb5b011243e9ba28e23183f68f44439b287b1',
    '0xe331382ecdcad2befe8580a779e28cb4d98bc88da9fac74ae1e95c78417acfde',
    '0xf2826c2b04aef9ddab2c3a7088f33dbc7a0485d57b37b5220f9d86da9eb95b2a',
    '0xf4a5ecfa278f50beb4155bc7bbd3ada5e57d5ceb9825852531981fa66bc94844',
    '0x80422d69eb9272c7b786f602bbce7caad3559a2bd714b5eafb254cfbdd26361c', // Dust amounts
    '0x2db088f092121c107a1bfe97984be190e5ab72fce044c9749c3611ce2365e4da',
    '0x99dd2c21aa009e98e000a3bd515a8ddcbb52748642fde10f9137f9de3cfae957',
    'stable-and-weighted-gas-price-zero',
    'stable-and-weighted-token-btp-test',
    'stable-and-weighted-gas-price-zero',
    'stable-pools-only-wbtc-to-sbtc-exactIn',
    'stable-pools-only-wbtc-to-sbtc-exactOut',
    'stable-and-weighted-same-pools', // This has one stable and one weighted pool with same tokens and balances. Stable should be better. i.e. V2 better than V1.
];

// Load data from json into useable format
export function loadTradeFile(file: string): TradeInfo {
    let tradeInfo: TradeInfo = {
        title: file,
        swapType: SwapTypes.SwapExactIn,
        tokenIn: '',
        tokenOut: '',
        maxPools: 0,
        swapAmountWei: bnum(0),
        swapAmountNormalised: bnum(0),
        gasPriceWei: bnum(0),
        tokenInDecimals: 0,
        tokenOutDecimals: 0,
        pools: []
    };

    const fileString = fs.readFileSync(`${testDir}${file}.json`, 'utf8');
    const fileJson = JSON.parse(fileString);

    if (!fileJson.tradeInfo) {
        console.warn('No trade info in file.');
        return tradeInfo;
    }

    if (fileJson.tradeInfo.SwapType === 'swapExactIn'){
        tradeInfo.swapType = SwapTypes.SwapExactIn;
        tradeInfo.tokenInDecimals = fileJson.tradeInfo.SwapAmountDecimals;
        tradeInfo.tokenOutDecimals = fileJson.tradeInfo.ReturnAmountDecimals;
    } else {
        tradeInfo.swapType = SwapTypes.SwapExactOut;
        tradeInfo.tokenInDecimals = fileJson.tradeInfo.ReturnAmountDecimals;
        tradeInfo.tokenOutDecimals = fileJson.tradeInfo.SwapAmountDecimals;
    }

    tradeInfo.tokenIn = fileJson.tradeInfo.TokenIn;
    tradeInfo.tokenOut = fileJson.tradeInfo.TokenOut;
    tradeInfo.maxPools = fileJson.tradeInfo.NoPools;
    tradeInfo.swapAmountWei = bnum(fileJson.tradeInfo.SwapAmount.split('.')[0]);
    tradeInfo.swapAmountNormalised = tradeInfo.swapAmountWei.div(
        bnum(10 ** fileJson.tradeInfo.SwapAmountDecimals)
    );
    tradeInfo.gasPriceWei = bnum(fileJson.tradeInfo.GasPrice);
    tradeInfo.pools = fileJson.pools;

    return tradeInfo;
}
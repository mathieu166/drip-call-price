import { fileURLToPath } from "url";
import { dirname } from "path";
import Web3 from "web3";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import  fs from 'fs'
let rawdata = fs.readFileSync(__dirname + '/abi/pancakeswap.json');
let abi = JSON.parse(rawdata);
export default {
  calculateDripBnbRatio: function (bnbCount, dripCount) {
    return dripCount / bnbCount
  },
  calcBNBPrice: async function (web3, block) {
    const pancakeSwapContract = '0x10ED43C718714eb63d5aA57B78B54704E256024E'.toLowerCase()
    const BNBTokenAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // BNB
    const USDTokenAddress = '0x55d398326f99059fF775485246999027B3197955' // USDT
    const bnbToSell = web3.utils.toWei('1', 'ether')
    let amountOut
    try {
      const router = new web3.eth.Contract(
        abi,
        pancakeSwapContract
      )
      if (!block) {
        amountOut = await router.methods
          .getAmountsOut(bnbToSell, [BNBTokenAddress, USDTokenAddress])
          .call()
      } else {
        amountOut = await router.methods
          .getAmountsOut(bnbToSell, [BNBTokenAddress, USDTokenAddress])
          .call({}, block)
      }
      amountOut = parseFloat(web3.utils.fromWei(amountOut[1]))
    } catch (error) { console.log(error) }
    if (!amountOut) return 0
    return amountOut
  }
}

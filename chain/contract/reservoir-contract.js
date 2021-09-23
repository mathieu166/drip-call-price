import addresses from '../smartcontracts-addresses.js'
import  fs from 'fs'

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let rawdata = fs.readFileSync(__dirname + '/../abi/reservoir.json');
let abi = JSON.parse(rawdata);

class ReservoirContract {
  constructor(web3) {
    this.contract = new web3.eth.Contract(abi, addresses.RESERVOIR_ADDRESS)
  }

  getContract() {
    return this.contract
  }

  getAbi(){
    return abi
  }
  getEventsInBlockRange = async (startBlock, toBlock) => {
    return await this.contract.getPastEvents("allEvents",{
      fromBlock: startBlock,
      toBlock: toBlock
    })
  }
}

export default ReservoirContract

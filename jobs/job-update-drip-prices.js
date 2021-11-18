import Web3 from 'web3'
import { getBscNodeArchiveProviderUrl } from '../chain/config.js'
import FountainContract from '../chain/contract/fountain-contract.js'
import dripUtils from '../chain/drip-utils.js'
import * as dripService from '../services/dripService.js'
import { promisify } from 'util'
const sleep = promisify(setTimeout)

const minute = 20

class Job {
    constructor() { }

    async run() {
        var web3 = new Web3(new Web3.providers.HttpProvider(getBscNodeArchiveProviderUrl()))
        const contract = new FountainContract(web3)
        const samplesPerLookup  = (5 * minute) // sampling every 5 minutes
        const max_samples = 10

        while (true) {
            try {
                let currentBlock = await web3.eth.getBlockNumber()
                let dripStore = await dripService.getDripStoreOrCreate()
                console.log('Current block', currentBlock);
                const fromBlock = dripStore.lastDripPriceBlock + samplesPerLookup
                const toBlock = Math.min(fromBlock + (max_samples * samplesPerLookup), currentBlock)

                if (fromBlock > currentBlock) {
                    await sleep(60000)
                    continue
                }

                console.log('Searching in blocks ' + fromBlock + ' to ' + toBlock)

                const oneBNB = 1 * 10 ** 18
                let dripPrices = []
                let index = 0
                for (let block = fromBlock; block < toBlock; block = block + samplesPerLookup) {
                    const dripPerBNB = await contract.getTokenToBnbOutputPriceForBlock(oneBNB.toString(), block)
                    const bnbFiatPrice = await dripUtils.calcBNBPrice(web3, block)
                    const dripBnbRatio = oneBNB / dripPerBNB
                    const blockInfo = await web3.eth.getBlock(block)
                    const date = new Date(blockInfo.timestamp * 1000)

                    dripPrices.push({
                        _id: block,
                        dripBnbRatio: dripBnbRatio,
                        bnbFiatPrice: bnbFiatPrice,
                        dripFiatPrice: dripBnbRatio * bnbFiatPrice,
                        timestamp: blockInfo.timestamp,
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        day: date.getDate(),
                        hour: date.getHours(),
                        minute: date.getMinutes(),
                        second: date.getSeconds()
                    })
                }

                console.log('Saving into database...')
                if (dripPrices.length > 0) {
                    await dripService.createDripPrices(dripPrices)
                }
                await dripService.updateDripStore({ lastDripPriceBlock: toBlock })
                console.log('Saving done')
            } catch (e) {
                console.error(e)
            }
        }
    }

}

export default Job
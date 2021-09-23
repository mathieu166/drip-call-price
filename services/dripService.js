import * as dbService from './dbService.js'

const transactionOptions = {
  readPreference: 'primary',
  readConcern: { level: 'local' },
  writeConcern: { w: 'majority' }
};

/** GETTER */
export async function getDripStoreOrCreate() {
  var client
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    var dripStore = await dbo.collection(dbService.DRIP_STORE).findOne({ "_id": "store" })

    const firstDripBlock = 6850000

    if (!dripStore) {
      var newStore = { "_id": "store", "lastDripBlock": firstDripBlock, "lastDripPriceBlock": firstDripBlock, "lastDripReservoirBlock": firstDripBlock, "lastDripAirdropBlock": firstDripBlock }
      await dbo.collection(dbService.DRIP_STORE).insertOne(newStore)
      dripStore = newStore
    }

    if (!dripStore.lastDripPriceBlock) {
      console.log('did not find lastDripPriceBlock')
      dripStore.lastDripPriceBlock = firstDripBlock
      await dbo.collection(dbService.DRIP_STORE).updateOne({ "_id": "store" }, { $set: { lastDripPriceBlock: dripStore.lastDripPriceBlock } })
    }

    if (!dripStore.lastDripReservoirBlock) {
      console.log('did not find lastDripReservoirBlock')
      dripStore.lastDripReservoirBlock = firstDripBlock
      await dbo.collection(dbService.DRIP_STORE).updateOne({ "_id": "store" }, { $set: { lastDripReservoirBlock: dripStore.lastDripReservoirBlock } })
    }

    if (!dripStore.lastDripReservoirBlock) {
      console.log('did not find lastDripReservoirBlock')
      dripStore.lastDripReservoirBlock = firstDripBlock
      await dbo.collection(dbService.DRIP_STORE).updateOne({ "_id": "store" }, { $set: { lastDripReservoirBlock: dripStore.lastDripReservoirBlock } })
    }

    if (!dripStore.lastDripAirdropBlock) {
      console.log('did not find lastDripReservoirBlock')
      dripStore.lastDripAirdropBlock = firstDripBlock
      await dbo.collection(dbService.DRIP_STORE).updateOne({ "_id": "store" }, { $set: { lastDripAirdropBlock: dripStore.lastDripAirdropBlock } })
    }

    return dripStore
  } catch (e) {
    console.error('getDripStoreOrCreate error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }

}

export async function getDripReservoirDailyAprs(limit) {
  var client
  try {
    client = await dbService.client()
    await client.connect()
    var dbo = client.db(process.env.DB_NAME)

    limit = limit || 30

    return await dbo.collection(dbService.DRIP_RESERVOIR_DAILY_APR)
      .find().sort({year: -1, month: -1, day: -1}).limit(limit).toArray()
  } catch (e) {
    console.error('getDripReservoirDailyAprs error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }

}

export async function getActiveReservoirPlayer(before) {
  var client
  try {
    client = await dbService.client()
    await client.connect()
    var dbo = client.db(process.env.DB_NAME)
    return await dbo.collection(dbService.DRIP_ACCOUNT_RESERVOIR)
      .aggregate([
        { $match: { event: 'onLeaderBoard', tokens: { $ne: '0' }, timestamp: { $lt: (before).toString() } } },
        { $sort: { timestamp: 1 } },
        { $group: { _id: "$customerAddress" } }
      ]).toArray()

  } catch (e) {
    console.error('getActiveReservoirPlayer error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }

}


export async function getDripAccountStat(address) {
  var client
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    return await dbo.collection(dbService.DRIP_ACCOUNT_STAT).findOne({ "_id": address })
  } catch (e) {
    console.error('getDripAccountStat error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }

}

export async function getDripAccountStats(query, limit) {
  var client
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    return await dbo.collection(dbService.DRIP_ACCOUNT_STAT).find(query).limit(limit).toArray()
  } catch (e) {
    console.error('getDripAccountStats error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }

}

export async function getDripDepositsCount(ranges) {
  var client
  try {
    client = await dbService.client()
    await client.connect()
    var dbo = client.db(process.env.DB_NAME)

    var counts = []
    var sum = 0
    for (let i = 0; i < ranges.length; i++) {
      if (i != ranges.length - 1) {
        counts[i] = await dbo.collection(dbService.DRIP_ACCOUNT_STAT).count({ deposits: { $gte: ranges[i], $lt: ranges[i + 1] } })
      } else {
        counts[i] = await dbo.collection(dbService.DRIP_ACCOUNT_STAT).count({ deposits: { $gte: ranges[i] } })
      }
      sum += counts[i]
    }

    return { ranges: ranges, results: counts, sum: sum }
  } catch (e) {
    console.error('getDripDepositsCount error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }

}

/** CREATE */

export async function createDripAccountStats(dripAccountStats) {
  var client
  var session
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    session = client.startSession()
    const transactionResults = await session.withTransaction(async () => {
      await dbo.collection(dbService.DRIP_ACCOUNT_STAT).insertMany(dripAccountStats, { session })
    }, transactionOptions);


  } catch (e) {
    console.error('createDripAccountStats error: ' + e.message)
    throw e
  } finally {
    if (session) {
      await session.endSession()
    }
    await client.close()
  }
}

export async function createReservoirDailyApr(dailyApr) {
  var client
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    
    await dbo.collection(dbService.DRIP_RESERVOIR_DAILY_APR).insertOne(dailyApr)
    
  } catch (e) {
    console.error('createReservoirDailyApr error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }
}

export async function createDripAccountReservoir(events) {
  var client
  var session

  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    session = client.startSession()
    const transactionResults = await session.withTransaction(async () => {
      await dbo.collection(dbService.DRIP_ACCOUNT_RESERVOIR).insertMany(events, { session })
    }, transactionOptions);


  } catch (e) {
    console.error('createDripAccountReservoir error: ' + e.message)
    throw e
  } finally {
    if (session) {
      await session.endSession()
    }
    await client.close()
  }
}

export async function createDripAirdrops(events) {
  var client
  var session

  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    session = client.startSession()
    const transactionResults = await session.withTransaction(async () => {
      await dbo.collection(dbService.DRIP_AIRDROP).insertMany(events, { session })
    }, transactionOptions);


  } catch (e) {
    console.error('createDripAirdrops error: ' + e.message)
    throw e
  } finally {
    if (session) {
      await session.endSession()
    }
    await client.close()
  }
}

export async function createDripPrices(dripPrices) {
  var client
  var session
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    session = client.startSession()

    const transactionResults = await session.withTransaction(async () => {
      await dbo.collection(dbService.DRIP_PRICE).insertMany(dripPrices, { session })
    }, transactionOptions);

  } catch (e) {
    console.error('createDripPrices error: ' + e.message)
    throw e
  } finally {
    if (session) {
      await session.endSession()
    }
    await client.close()
  }
}


/** UPDATE */
export async function updateDripAccountStat(address, updates) {
  var client
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    await dbo.collection(dbService.DRIP_ACCOUNT_STAT).updateOne({ _id: address }, { $set: updates })
  } catch (e) {
    console.error('updateDripAccountStat error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }
}


export async function updateDripStore(updates) {
  var client
  try {
    client = await dbService.client()
    await client.connect()

    var dbo = client.db(process.env.DB_NAME)
    await dbo.collection(dbService.DRIP_STORE).updateOne({ "_id": "store" }, { $set: updates })
  } catch (e) {
    console.error('updateDripStore error: ' + e.message)
    throw e
  } finally {
    await client.close()
  }

}

import { Spam } from '../../spam'

import {
  getCurrentPrice as gCP,
  getTargetPrice as gTP,
  getCirculatingSupply as gCS,
  getNextRebaseTimestamp as gNRT,
  getTotalSupply as gTS,
  getScalingFactor,
} from '../../spamUtils'

const getCurrentPrice = async (spam: typeof Spam): Promise<number> => {
  // FORBROCK: get current SPAM price
  return gCP(spam)
}

const getTargetPrice = async (spam: typeof Spam): Promise<number> => {
  // FORBROCK: get target SPAM price
  return gTP(spam)
}

const getCirculatingSupply = async (spam: typeof Spam): Promise<string> => {
  // FORBROCK: get circulating supply
  return gCS(spam)
}

const getNextRebaseTimestamp = async (spam: typeof Spam): Promise<number> => {
  // FORBROCK: get next rebase timestamp
  const nextRebase = await gNRT(spam) as number
  return nextRebase * 1000
}

const getTotalSupply = async (spam: typeof Spam): Promise<string> => {
  // FORBROCK: get total supply
  return gTS(spam)
}

export const getStats = async (spam: typeof Spam) => {
  const curPrice = await getCurrentPrice(spam)
  const circSupply = '' // await getCirculatingSupply(spam)
  const nextRebase = await getNextRebaseTimestamp(spam)
  const scalingFactor = Number((await getScalingFactor(spam)).toFixed(2))
  const targetPrice = await getTargetPrice(spam)
  const totalSupply = await getTotalSupply(spam)
  return {
    circSupply,
    curPrice,
    nextRebase,
    scalingFactor,
    targetPrice,
    totalSupply
  }
}

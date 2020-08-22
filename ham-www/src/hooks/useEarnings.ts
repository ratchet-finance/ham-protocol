import { useCallback, useEffect, useState } from 'react'

import BigNumber from 'bignumber.js'
import { useWallet } from 'use-wallet'
import { Contract } from "web3-eth-contract"

import { getEarned } from '../spamUtils'
import useSpam from './useSpam'

const useEarnings = (pool: Contract) => {
  const [balance, setBalance] = useState(new BigNumber(0))
  const { account }: { account: string } = useWallet()
  const spam = useSpam()

  const fetchBalance = useCallback(async () => {
    const balance = await getEarned(spam, pool, account)
    setBalance(new BigNumber(balance))
  }, [account, pool, spam])

  useEffect(() => {
    if (account && pool && spam) {
      fetchBalance()
    }
  }, [account, pool, setBalance, spam])

  return balance
}

export default useEarnings

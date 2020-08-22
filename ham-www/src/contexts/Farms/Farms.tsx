import React, { useCallback, useEffect, useState } from 'react'

import { Contract } from 'web3-eth-contract'

import { spam as spamAddress } from '../../constants/tokenAddresses'
import useSpam from '../../hooks/useSpam'
import { getPoolContracts } from '../../spamUtils'

import Context from './context'
import { Farm } from './types'

const NAME_FOR_POOL: { [key: string]: string } = {
  yfi_pool: 'Waifu Rough Cuts',
  eth_pool: 'Bacon Wrapped ETH',
  ycrv_pool: 'The HAMburgery',
  link_pool: 'Sausage Links',
  lend_pool: 'Lend Larder',
  snx_pool: 'Spartan Smokery',
  dai_pool: 'Dai Durocs'
}

const ICON_FOR_POOL: { [key: string]: string } = {
  yfi_pool: '🐽',
  eth_pool: '🥓',
  link_pool: '🌭',
  lend_pool: '🥩',
  snx_pool: '🍖',
  ycrv_pool: '🍔',
  dai_pool: '🐖'
}

const SORT_FOR_POOL: { [key: string]: number } = {
  yfi_pool: 0,
  eth_pool: 1,
  snx_pool: 2, //changed to snx to fit the rest of the code (cf: distribution and deployment tests)
  ycrv_pool: 3,
  link_pool: 4,
  lend_pool: 5,
  dai_pool: 6,//swapped mkr for dai
}

const Farms: React.FC = ({ children }) => {

  const [farms, setFarms] = useState<Farm[]>([])
  const spam = useSpam()

  const fetchPools = useCallback(async () => {
    const pools: { [key: string]: Contract} = await getPoolContracts(spam)

    const farmsArr: Farm[] = []
    const poolKeys = Object.keys(pools)

    for (let i = 0; i < poolKeys.length; i++) {
      const poolKey = poolKeys[i]
      const pool = pools[poolKey]
      let tokenKey = poolKey.replace('_pool', '')
      if (tokenKey === 'eth') {
        tokenKey = 'weth'
      } else if (tokenKey === 'ampl') {
        tokenKey = 'ampl_eth_uni_lp' //I have kept this just in case.
      } else if (tokenKey === 'ycrv') {
        tokenKey = 'ycrv_spam_uni_lp'
      }

      const method = pool.methods[tokenKey]
      try {
        let tokenAddress = ''
        if (method) {
          tokenAddress = await method().call()
        } else if (tokenKey === 'ycrv_am_uni_lp') {
          tokenAddress = '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8'
        }
        farmsArr.push({
          contract: pool,
          name: NAME_FOR_POOL[poolKey],
          depositToken: tokenKey,
          depositTokenAddress: tokenAddress,
          earnToken: 'spam',
          earnTokenAddress: spamAddress,
          icon: ICON_FOR_POOL[poolKey],
          id: tokenKey,
          sort: SORT_FOR_POOL[poolKey]
        })
      } catch (e) {
        console.log(e)
      }
    }
    farmsArr.sort((a, b) => a.sort < b.sort ? 1 : -1)
    setFarms(farmsArr)
  }, [spam, setFarms])

  useEffect(() => {
    if (spam) {
      fetchPools()
    }
  }, [spam, fetchPools])

  return (
    <Context.Provider value={{ farms }}>
      {children}
    </Context.Provider>
  )
}

export default Farms

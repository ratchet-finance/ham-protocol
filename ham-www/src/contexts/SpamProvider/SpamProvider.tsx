import React, { createContext, useEffect, useState } from 'react'

import { useWallet } from 'use-wallet'

import { Spam } from '../../spam'

export interface SpamContext {
  spam?: typeof Spam
}

export const Context = createContext<SpamContext>({
  spam: undefined,
})

declare global {
  interface Window {
    spamsauce: any
  }
}

const SpamProvider: React.FC = ({ children }) => {
  const { ethereum } = useWallet()
  const [spam, setSpam] = useState<any>()

  useEffect(() => {
    if (ethereum) {
      const spamLib = new Spam(
        ethereum,
        "1",
        false, {
          defaultAccount: "",
          defaultConfirmations: 1,
          autoGasMultiplier: 1.5,
          testing: false,
          defaultGas: "6000000",
          defaultGasPrice: "1000000000000",
          accounts: [],
          ethereumNodeTimeout: 10000
        }
      )
      setSpam(spamLib)
      window.spamsauce = spamLib
    }
  }, [ethereum])

  return (
    <Context.Provider value={{ spam }}>
      {children}
    </Context.Provider>
  )
}

export default SpamProvider

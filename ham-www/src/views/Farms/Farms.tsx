import React from 'react'
import {
  Route,
  Switch,
  useRouteMatch,
} from 'react-router-dom'
import { useWallet } from 'use-wallet'

import butcher from '../../assets/img/butcher.png'

import Button from '../../components/Button'

import Page from '../../components/Page'
import PageHeader from '../../components/PageHeader'

import Farm from '../Farm'

import FarmCards from './components/FarmCards'


interface FarmsProps {
  toggleTheme: () => void
  theme: string
}

const Farms: React.FC<FarmsProps> = ({ theme, toggleTheme }) => {
  const { path } = useRouteMatch()
  const { account, connect } = useWallet()
  return (
    <Switch>
      <Page toggleTheme={toggleTheme} theme={theme}>
      {!!account ? (
        <>
          <Route exact path={path}>
            <PageHeader
              icon={<img src={butcher} height="96" />}
              subtitle="Earn SPAM tokens by providing liquidity."
              title="Select a farm."
            />
            <FarmCards />
          </Route>
          <Route path={`${path}/:farmId`}>
            <Farm />
          </Route>
        </>
      ) : (
        <div style={{
          alignItems: 'center',
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
        }}>
          <Button
            onClick={() => connect('injected')}
            text="Unlock Wallet"
          />
        </div>
      )}
      </Page>
    </Switch>
  )
}

export default Farms
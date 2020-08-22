import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import Page from '../../components/Page'
import PageHeader from '../../components/PageHeader'
import Spacer from '../../components/Spacer'

import useSpam from '../../hooks/useSpam'

import Rebase from './components/Rebase'
import Stats from './components/Stats'

import { OverviewData } from './types'
import { getStats } from './utils'

interface HomeProps {
  toggleTheme: () => void
  theme: string
}

const Home: React.FC<HomeProps> = ({ theme, toggleTheme }) => {
  const spam = useSpam()
  const [{
    curPrice,
    nextRebase,
    scalingFactor,
    targetPrice,
  }, setStats] = useState<OverviewData>({})

  const fetchStats = useCallback(async () => {
    const statsData = await getStats(spam)
    setStats(statsData)
  }, [spam, setStats])

  useEffect(() => {
    if (spam) {
      fetchStats()
    }
  }, [fetchStats, spam])

  return (
    <Page toggleTheme={toggleTheme} theme={theme}>
      <PageHeader icon="🥓" subtitle="Never fear, the bacon is here! Enjoy the harvest!" title="Friendly reminder" />
      <div style={{
        margin: '-24px auto 48px'
      }}>
              <StyledLink href="https://discord.gg/tgxPEQx">How to contribute to the Bacon Blockchain</StyledLink>
      </div>
      <Spacer />
      <div>
        <StyledOverview>
          <Rebase nextRebase={nextRebase} />
          <StyledSpacer />
          <Stats
            curPrice={curPrice}
            scalingFactor={scalingFactor}
            targetPrice={targetPrice}
          />
        </StyledOverview>
      </div>
    </Page>
  )
}

const StyledOverview = styled.div`
  align-items: center;
  display: flex;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`

const StyledSpacer = styled.div`
  height: ${props => props.theme.spacing[4]}px;
  width: ${props => props.theme.spacing[4]}px;
`

const StyledLink = styled.a`
  font-weight: 700l
  text-decoration: none;
  color: ${props => props.theme.color[500]};
`

export default Home
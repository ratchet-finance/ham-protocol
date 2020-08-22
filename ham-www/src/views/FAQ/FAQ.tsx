import React from 'react'
import styled from 'styled-components'

import Card from '../../components/Card'
import CardContent from '../../components/CardContent'
import Container from '../../components/Container'

import Page from '../../components/Page'
import PageHeader from '../../components/PageHeader'

interface FAQProps {
  toggleTheme: () => void
  theme: string
}

const FAQ: React.FC<FAQProps> = ({ theme, toggleTheme }) => {
  return (
    <Page toggleTheme={toggleTheme} theme={theme}>
      <PageHeader icon="❓" title="About Spam" />
      <Container>
        <Card>
          <CardContent>
          </CardContent>
        </Card>
      </Container>
    </Page>
  )
}

const StyledHeading = styled.h2`
  margin-bottom: 0;
  margin-top: ${props => props.theme.spacing[5]}px;;
`
const StyledList = styled.ul`
  margin: 0;
  padding: 0 ${props => props.theme.spacing[6]}px;;
`
const StyledListItem = styled.li`
  margin-top: ${props => props.theme.spacing[3]}px;
`

const StyledText = styled.p`
  font-style: italic;
  line-height: 2;
  text-indent: ${props => props.theme.spacing[4]}px;
`

export default FAQ
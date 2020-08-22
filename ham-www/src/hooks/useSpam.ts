import { useContext } from 'react'
import { Context } from '../contexts/SpamProvider'

const useSpam = () => {
  const { spam } = useContext(Context)
  return spam
}

export default useSpam

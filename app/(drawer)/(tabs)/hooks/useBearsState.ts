import { useState } from "react"

export const useBearsState = () => {
  const [bears, setBears] = useState(0)

  const increasePopulation = () => setBears(prev => prev + 1)
  
  const removeAllBears = () => setBears(0)
  
  const updateBears = (newBears: number) => setBears(newBears)
  
  const handleRandomUpdate = () => {
    const randomNumber = Math.floor(Math.random() * 100)
    updateBears(randomNumber)
  }

  return {
    bears,
    increasePopulation,
    removeAllBears,
    handleRandomUpdate
  }
}

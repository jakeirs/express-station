import { useStore } from "../../../../store/store"

export const useZustandExample = () => {
  const { updateBears } = useStore()

  const handleRandomUpdate = () => {
    const randomNumber = Math.floor(Math.random() * 100)
    updateBears(randomNumber)
  }

  return {
    handleRandomUpdate
  }
}


export const useZustandExample = () => {

  const handleRandomUpdate = () => {
    const randomNumber = Math.floor(Math.random() * 100)
  }

  return {
    handleRandomUpdate
  }
}

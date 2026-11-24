export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))

    if (!payload.exp) return true

    const currentTime = Math.floor(Date.now() / 1000)

    return currentTime >= payload.exp
  } catch {
    return true
  }
}

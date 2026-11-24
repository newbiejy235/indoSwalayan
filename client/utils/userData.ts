export type userData = {
  email: string
  role: string
  token: string
}

export class UserData {
  save = (email: string, role: string, token: string): void => {
    if (typeof window === "undefined") return
    localStorage.setItem("email", email)
    localStorage.setItem("role", role)
    localStorage.setItem("token", token)
  }

  get = () => {
    if (typeof window === "undefined") return null
    const email = localStorage.getItem("email")
    const role = localStorage.getItem("role")
    const token = localStorage.getItem("token")

    if (!email || !role || !token) {
      return null
    }

    return { email, role, token }
  }

  logout = (): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem("email")
    localStorage.removeItem("role")
    localStorage.removeItem("token")
  }
}

const userData = new UserData()

export default userData

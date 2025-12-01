export type UserRole = "student" | "teacher"

export interface User {
  username: string
  role: UserRole
}

const USERS = {
  student: { username: "student", password: "student", role: "student" as UserRole },
  teacher: { username: "teacher", password: "teacher", role: "teacher" as UserRole },
}

export function authenticate(username: string, password: string): User | null {
  const user = USERS[username as keyof typeof USERS]
  if (user && user.password === password) {
    return { username: user.username, role: user.role }
  }
  return null
}

export function saveSession(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}

export function getSession(): User | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem("user")
    if (data) {
      return JSON.parse(data)
    }
  }
  return null
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

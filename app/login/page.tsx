"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogIn, Loader2, User, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticate, saveSession } from "@/lib/auth"
import { BsuirLogo } from "@/components/bsuir-logo"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = authenticate(username, password)
    if (user) {
      saveSession(user)
      if (user.role === "student") {
        router.push("/check")
      } else {
        router.push("/admin")
      }
    } else {
      setError("Неверный логин или пароль")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <BsuirLogo />
          </div>
          <div>
            <CardTitle className="text-2xl">Вход в систему</CardTitle>
            <CardDescription className="mt-2">Система проверки уникальности работ</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Логин
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Войти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-2 border border-blue-200 dark:border-blue-900">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300">Тестовые учетные записи:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-mono text-blue-600 dark:text-blue-400">student / student</p>
                <p className="text-muted-foreground">Проверка работ</p>
              </div>
              <div>
                <p className="font-mono text-blue-600 dark:text-blue-400">teacher / teacher</p>
                <p className="text-muted-foreground">Админ-панель</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              <a
                href="https://bsuir.by"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                bsuir.by
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

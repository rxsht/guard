"use client"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = getSession()
    if (user) {
      if (user.role === "student") {
        router.push("/check")
      } else {
        router.push("/admin")
      }
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

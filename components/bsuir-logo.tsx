import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function BsuirLogo({ className = "", href }: { className?: string; href?: string }) {
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <GraduationCap className="h-8 w-8 text-blue-600" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-xl font-bold text-blue-600">BSUIR</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Антиплагиат</span>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity cursor-pointer">
        {content}
      </Link>
    )
  }

  return content
}

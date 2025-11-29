'use client'

import { Logo } from "@/constant/svg"
import { Phone, MessageCircle, Settings, User, History } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const SideBar = ({ className }) => {
  const pathname = usePathname()
  
  const menuItems = [
    { id: 'dialer', icon: Phone, label: 'Dialer', href: '/dialer' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', href: '/messages' },
    { id: 'history', icon: History, label: 'History', href: '/history' },
    { id: 'profile', icon: User, label: 'Profile', href: '/profile' },
    { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
  ]

  return (
    <div className={`${className} bg-slate-900 border-r border-white/10 p-4 flex flex-col`}>
      <div className="mb-8 flex justify-center">
        <Link href="/">
          <Logo className='w-8 h-8 text-white' />
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <Link 
          href="/account"
          className="flex flex-col items-center space-y-1 p-3 text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-medium text-center">Account</span>
        </Link>
      </div>
    </div>
  )
}
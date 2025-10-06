'use client'

import { Logo } from "@/constant/svg"

export const SideBar = ({ className}) => {
  return (
    <div className={`${className} bg-fuchsia-500`}>
      <div>
          <Logo className=' w-10 h-10' />
      </div>
    </div>
  )
}

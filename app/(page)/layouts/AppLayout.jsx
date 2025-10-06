import { SideBar } from './SideBar'

const AppLayout = ({ children }) => {
  return (
    <div className='w-screen h-screen grid grid-cols-[80px_1fr]'>
      <SideBar className='col-span-1' />
      <div className='col-span-1'>{children}</div>
    </div>
  )
}

export default AppLayout

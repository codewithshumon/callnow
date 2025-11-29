import { SideBar } from './SideBar'

const AppLayout = ({ children }) => {
  return (
    <div className='w-screen h-screen grid grid-cols-[100px_1fr] overflow-hidden'>
      <SideBar className='' />
      <div className='overflow-hidden'>{children}</div>
    </div>
  )
}

export default AppLayout
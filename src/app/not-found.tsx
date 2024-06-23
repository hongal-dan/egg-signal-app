import React from 'react'
import Image from 'next/image'

type Props = {}

const NotFound = (props: Props) => {
  return (
    <div className='flex flex-col justify-center items-center'>
      <Image src="/img/404.png" alt="404-not-found" width={500} height={500}/>
      <h1 className='text-[3rem]'>해당 페이지를 찾을 수 없습니다.</h1>
    </div>
  )
}

export default NotFound
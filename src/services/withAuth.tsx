"use client"; 

import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const withAuth = <Props extends object>(
  WrappedComponent: ComponentType<Props>, 
  isPublic: boolean = false // 모두에게 공개된 페이지인지 여부
) => {
  return (props: Props) => {  
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem('token');

      if (token) { // 사용자가 인증된 경우
        if (
          isPublic &&  
          (pathname === '/login' || pathname === '/signup' || pathname === '/')
        ) {
          router.push('/main'); 
        } else {
          setIsLoading(false);
        }
      } else { // 사용자가 인증되지 않은 경우
        if (!isPublic) { 
          router.push('/login'); // 인증되지 않은 상태에서 접근하려면 '/login'으로 리다이렉트
        }
        else {
          setIsLoading(false);
        }
      }
    }, [router, pathname]);

    if (isLoading) {
      return (
        <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center gap-24">
          <div className="flex flex-col items-center gap-4 text-3xl">
            <p>로딩 중입니다.</p>
            <p>잠시만 기다려주세요</p>
          </div>
          <span className="pan"></span>
        </div>
      );
    }

    return <WrappedComponent {...props} />; 
  };
};

export default withAuth;

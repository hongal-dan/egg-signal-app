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

    useEffect(() => {
      const token = localStorage.getItem('token');

      if (token) { // 사용자가 인증된 경우
        if (
          isPublic &&  
          (pathname === '/login' || pathname === '/signup' || pathname === '/')
        ) {
          router.push('/main'); 
        } else {
        }
      } else { // 사용자가 인증되지 않은 경우
        if (!isPublic) { 
          router.push('/login'); // 인증되지 않은 상태에서 접근하려면 '/login'으로 리다이렉트
        }
        else {
        }
      }
    }, [router, pathname]);



    return <WrappedComponent {...props} />; 
  };
};

export default withAuth;

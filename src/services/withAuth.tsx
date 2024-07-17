"use client"; 

import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '@/containers/main/Loading';

const withAuth = <Props extends object>(
  WrappedComponent: ComponentType<Props>, 
  isPublic: boolean = false // 모두에게 공개된 페이지인지 여부
) => {
  const ComponentWithAuth = ((props: Props) => {  
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
      return <Loading />;
    }

    return <WrappedComponent {...props} />; 
  });

  return ComponentWithAuth;
};

export default withAuth;

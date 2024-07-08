"use client";

import withAuth from "@/services/withAuth";

const AuthLayout = ({ children }: { children: React.ReactNode })  => {
  return (
      <>{children}</>
  );
}

export default withAuth(AuthLayout, true);

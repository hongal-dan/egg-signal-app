"use client";

import withAuth from "@/services/withAuth";

const ProtectedLayout = ({ children }: { children: React.ReactNode })  => {
  return (
      <>{children}</>
  );
}

export default withAuth(ProtectedLayout);

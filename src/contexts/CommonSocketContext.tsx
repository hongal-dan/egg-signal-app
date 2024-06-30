"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  commonSocket: Socket | null;
}

const CommonSocketContext = createContext<SocketContextType>({
  commonSocket: null,
});

export const useCommonSocket = () => {
  return useContext(CommonSocketContext);
};

export const CommonSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [commonSocket, setCommonSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const commonSocket = io(process.env.NEXT_PUBLIC_API_SERVER + "/common", {
      transports: ["websocket"],
      withCredentials: true,
    });

    commonSocket.on("connect", () => {
      commonSocket.emit("serverCertificate");
      console.log("connected");
    });

    commonSocket.on("disconnect", () => {
      console.log("disconnected");
    });

    commonSocket.on("error", error => {
      console.error("Error from server:", error);
    });

    setCommonSocket(commonSocket);

    return () => {
      commonSocket.disconnect();
    };
  }, []);

  return (
    <CommonSocketContext.Provider value={{ commonSocket }}>
      {children}
    </CommonSocketContext.Provider>
  );
};

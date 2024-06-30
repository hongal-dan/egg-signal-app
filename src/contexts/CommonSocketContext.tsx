"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  commonSocket: Socket | null;
  isConnected: boolean;
}

const CommonSocketContext = createContext<SocketContextType>({
  commonSocket: null,
  isConnected: false,
});

export const useCommonSocket = () => {
  return useContext(CommonSocketContext);
};

export const CommonSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [commonSocket, setCommonSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const commonSocket = io(process.env.NEXT_PUBLIC_API_SERVER + "/common", {
      transports: ["websocket"],
      withCredentials: true,
    });

    commonSocket.on("connect", () => {
      setIsConnected(true);
      commonSocket.emit("serverCertificate", () => {});

      console.log("connected");
    });

    commonSocket.on("disconnect", () => {
      setIsConnected(false);

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
    <CommonSocketContext.Provider value={{ commonSocket, isConnected }}>
      {children}
    </CommonSocketContext.Provider>
  );
};

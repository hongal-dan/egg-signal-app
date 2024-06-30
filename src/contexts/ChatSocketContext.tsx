"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  chatSocket: Socket | null;

  isConnected: boolean;
}

const ChatSocketContext = createContext<SocketContextType>({
  chatSocket: null,

  isConnected: false,
});

export const useChatSocket = () => {
  return useContext(ChatSocketContext);
};

export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("chat socket 연결 용 cookie:", document.cookie);

    const chatSocket = io(process.env.NEXT_PUBLIC_API_SERVER + "/common", {
      transports: ["websocket"],
      withCredentials: true,
      // extraHeaders: {
      //   Cookie: `${document.cookie}`,
      // },
    });

    chatSocket.on("connect", () => {
      setIsConnected(true);

      console.log("connected");
    });

    chatSocket.on("disconnect", () => {
      setIsConnected(false);

      console.log("disconnected");
    });

    chatSocket.on("error", error => {
      console.error("Error from server:", error);
    });

    setChatSocket(chatSocket);

    return () => {
      chatSocket.disconnect();
    };
  }, []);

  return (
    <ChatSocketContext.Provider value={{ chatSocket, isConnected }}>
      {children}
    </ChatSocketContext.Provider>
  );
};

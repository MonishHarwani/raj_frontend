import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typing, setTyping] = useState(new Map());
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      const newSocket = io(
        process.env.REACT_APP_API_URL || "http://localhost:5000",
        {
          auth: {
            token: token,
          },
        }
      );
      console.log(" Sockjet Conn ");
      console.log(newSocket);
      newSocket.on("connect", () => {
        console.log("Socket connected");
        setSocket(newSocket);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setSocket(null);
      });

      newSocket.on("userOnline", (userId) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      });

      newSocket.on("userOffline", (userId) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on("userTyping", ({ userId, chatId }) => {
        setTyping((prev) => new Map(prev.set(`${chatId}_${userId}`, true)));
        setTimeout(() => {
          setTyping((prev) => {
            const newMap = new Map(prev);
            newMap.delete(`${chatId}_${userId}`);
            return newMap;
          });
        }, 3000);
      });

      newSocket.on("userStoppedTyping", ({ userId, chatId }) => {
        setTyping((prev) => {
          const newMap = new Map(prev);
          newMap.delete(`${chatId}_${userId}`);
          return newMap;
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, user]);

  const joinChat = (chatId) => {
    if (socket) {
      socket.emit("joinChat", chatId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit("sendMessage", messageData);
    }
  };

  const startTyping = (chatId) => {
    if (socket) {
      socket.emit("typing", { chatId });
    }
  };

  const stopTyping = (chatId) => {
    if (socket) {
      socket.emit("stopTyping", { chatId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const isUserTyping = (userId, chatId) => {
    return typing.has(`${chatId}_${userId}`);
  };

  const value = {
    socket,
    onlineUsers,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping,
    isUserOnline,
    isUserTyping,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

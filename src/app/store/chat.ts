"use client";

import { atom } from "recoil";

// 현재 열려있는 채팅방 정보
export const chatRoomState = atom<string | null>({
  key: "chatRoomState",
  default: null,
  dangerouslyAllowMutability: true,
});

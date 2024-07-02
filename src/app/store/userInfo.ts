"use client";

import { atom } from "recoil";

interface Friend {
  friend: string;
  chatRoomId: string;
  newMessage: boolean;
}

interface userInfo {
  id: string;
  nickname: string;
  gender: "MALE" | "FEMALE";
  newNotification: boolean;
  notifications: string[];
  friends: Friend[];
}

export const userState = atom<userInfo>({
  key: "userState",
  default: {
    id: "",
    nickname: "",
    gender: "MALE",
    newNotification: false,
    notifications: [],
    friends: [],
  },
});

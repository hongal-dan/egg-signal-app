"use client";

import { atom } from "recoil";
import { Socket } from "socket.io-client";

export const commonSocketState = atom<Socket | null>({
  key: "commonSocketState",
  default: null,
  dangerouslyAllowMutability: true,
});

export const onlineListState = atom<string[]>({
  key: "onlineListState",
  default: [],
});

interface Notification {
  _id: string;
  from: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export const notiListState = atom<Notification[]>({
  key: "notiListState",
  default: [],
});

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

export const notiListState = atom<string[]>({
  key: "notiListState",
  default: [],
});

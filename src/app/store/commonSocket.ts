"use client";

import { atom } from "recoil";
import { Socket } from "socket.io-client";

export const commonSocketState = atom<Socket | null>({
  key: "commonSocketState",
  default: null,
  dangerouslyAllowMutability: true,
});

"use client";

import { atom } from "recoil";

interface SessionInfo { // FIXME 배포용으로 participantName도 받고있음 나중에 interface 하나로 통일 
  sessionId: string,
  token: string,
  participantName: string,
}

interface winnerSessionInfo { // FIXME 나중에 이거 이름 SessionInfo로 바꾸고 아래 interface 통일
  sessionId: string,
  token: string,
}

export const defaultSessionState = atom<SessionInfo>({
  key: "defaultSessionState",
  default: {
    sessionId: "",
    token: "",
    participantName: "",
  },
});

export const winnerSessionState = atom<winnerSessionInfo>({
  key: "winnerSessionState",
  default: {
    sessionId: "",
    token: "",
  },
});

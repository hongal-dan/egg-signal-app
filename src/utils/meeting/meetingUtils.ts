import {
  getNetworkInfo,
  getSystemPerformance,
  getVideoConstraints,
  networkConstraints,
} from "./openviduUtils";
import { keywords } from "../../../public/data/keywords.js";
import { Publisher, StreamManager } from "openvidu-browser";
import { Socket } from "socket.io-client";

type chooseResult = {
  sender: string;
  receiver: string;
};

type presentRefs = {
  keywordRef: React.MutableRefObject<HTMLParagraphElement | null>;
  pubRef: React.MutableRefObject<HTMLDivElement | null>;
  subRef: React.MutableRefObject<HTMLDivElement[]>;
  videoContainerRef: React.MutableRefObject<HTMLDivElement | null>;
};

type chooseRefs = {
  keywordRef: React.MutableRefObject<HTMLParagraphElement | null>;
  subRef: React.MutableRefObject<HTMLDivElement[]>;
  setIsChosen(isChosen: boolean): void;
};

type chooseParams = {
    socket: Socket | null;
    nickname: string;
    subRef: React.MutableRefObject<HTMLDivElement[]>;
    keywordRef: React.MutableRefObject<HTMLParagraphElement | null>;
    setIsChosen(isChosen: boolean): void;
    choiceState: string;
    chooseTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
};

export type oneToOneParams = {
  setIsChosen(isChosen: boolean): void;
  videoContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

// 화살표 출발 도착 좌표 계산
export const findPosition = (
  fromElement: HTMLDivElement,
  toElement: HTMLDivElement,
): Array<number> => {
  const rect1 = fromElement.getBoundingClientRect();
  const rect2 = toElement.getBoundingClientRect();
  let acc = 0;
  if (fromElement.classList.contains("MALE")) {
    acc = 10;
  } else {
    acc = -10;
  }

  if (
    fromElement.classList.contains("a") ||
    fromElement.classList.contains("b") ||
    fromElement.classList.contains("c")
  ) {
    const startX1 = rect1.right;
    const startY1 = rect1.top + rect1.height / 2;
    const endX2 = rect2.left;
    const endY2 = rect2.top + rect2.height / 2;
    return [startX1, startY1 + acc, endX2, endY2 - acc];
  } else {
    const startX1 = rect1.left;
    const startY1 = rect1.top + rect1.height / 2;
    const endX2 = rect2.right;
    const endY2 = rect2.top + rect2.height / 2;
    return [startX1, startY1 + acc, endX2, endY2 - acc];
  }
};

// 성별에 따라 화살표 색 변경
export const setArrowColor = (
  fromElement: HTMLDivElement,
  arrow: Array<HTMLDivElement>,
) => {
  const [Head, Body] = arrow;
  if (fromElement.classList.contains("MALE")) {
    Head.style.borderBottom = "20px solid #33C4D7";
    Body.style.backgroundColor = "#33C4D7";
    return;
  }
  Head.style.borderBottom = "20px solid #fa3689";
  Body.style.backgroundColor = "#fa3689";
};

const showArrow = (datas: Array<chooseResult>) => {
  datas.forEach(({ sender, receiver }) => {
    const fromUser = document.getElementById(sender) as HTMLDivElement;
    const toUser = document.getElementById(receiver) as HTMLDivElement;
    const arrowContainer = fromUser?.querySelector(
      ".arrow-container",
    ) as HTMLDivElement;
    const arrowBody = arrowContainer?.querySelector(
      ".arrow-body",
    ) as HTMLDivElement;
    const arrowHead = arrowBody?.querySelector(".arrow-head") as HTMLDivElement;

    const rect1 = fromUser.getBoundingClientRect();
    const [startX1, startY1, endX2, endY2] = findPosition(fromUser, toUser);

    const deltaX = endX2 - startX1;
    const deltaY = endY2 - startY1;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    setArrowColor(fromUser, [arrowHead, arrowBody]);
    arrowContainer.style.paddingTop = "1rem";
    // arrowBody.style.width = distance - 20 + "px";
    arrowContainer.style.top = startY1 - rect1.top + "px";
    arrowContainer.style.left = startX1 - rect1.left + "px";

    arrowBody.style.setProperty("--arrow-width", `${distance - 20}px`);

    arrowContainer.style.transform = `rotate(${
      (Math.atan2(deltaY, deltaX) * 180) / Math.PI
    }deg)`;

    if (
      fromUser.classList.contains("a") ||
      fromUser.classList.contains("b") ||
      fromUser.classList.contains("c")
    ) {
      arrowContainer.classList.remove("hidden");
      arrowBody.style.animation = "none";
      arrowBody.offsetHeight;
      arrowBody.style.animation = "growArrow 2s ease-out forwards";
      return;
    }
    setTimeout(() => {
      arrowContainer.classList.remove("hidden");
      arrowBody.style.animation = "none";
      arrowBody.offsetHeight;
      arrowBody.style.animation = "growArrow 2s ease-out forwards";
    }, 3000);
  });
};

const hideArrow = () => {
  const arrowContainers = document.querySelectorAll(".arrow-container");
  arrowContainers.forEach(arrowContainer => {
    arrowContainer.classList.add("hidden");
  });
};

export const changeLoveStickMode = (
  datas: Array<chooseResult>,
  subContainer: HTMLDivElement[],
  pubContainer: HTMLDivElement,
  videoContainer: HTMLDivElement,
) => {
  const videoElements = document.querySelectorAll("video");
  const canvasElements = document.querySelectorAll("canvas");
  videoElements.forEach(video => {
    video.style.width = "100%";
    video.style.height = "100%";
  });
  canvasElements.forEach(canvas => {
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  });

  const videoArray = Array.from(subContainer);
  videoArray.unshift(pubContainer);
  videoArray.forEach((video, idx) => {
    video?.classList.add(String.fromCharCode(97 + idx));
  });

  videoContainer?.classList.add("love-stick");
  showArrow(datas);
  return;
};

export const undoLoveStickMode = (
  subContainer: HTMLDivElement[],
  pubContainer: HTMLDivElement,
  videoContainer: HTMLDivElement,
) => {
  console.log("사랑의 작대기 모드 해제");
  const videoArray = Array.from(subContainer);
  videoArray.unshift(pubContainer);
  videoArray.forEach((video, idx) => {
    video?.classList.remove(String.fromCharCode(97 + idx));
  });
  videoContainer?.classList.remove("love-stick");
  hideArrow();
};

export const captureVideoFrame = (lover: string) => {
  const loverVideoContainer = document.getElementById(lover) as HTMLDivElement;
  const loverVideoElement = loverVideoContainer.querySelector(
    "video",
  ) as HTMLVideoElement;
  const canvas = document.createElement("canvas");
  if (loverVideoElement) {
    canvas.width = loverVideoElement.videoWidth;
    canvas.height = loverVideoElement.videoHeight;
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(loverVideoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/webp");
      return dataUrl;
    }
  }
};

// 미팅 세팅 시 ar 합성된 캔버스 캡쳐
export const captureCanvas = (captureRef: HTMLDivElement) => {
  console.log("meetingUtils에서 캡쳐 시작");
  const canvas = captureRef.querySelector("canvas") as HTMLCanvasElement;
  let constraints: networkConstraints;
  let frameRate: number;

  if (!canvas) {
    console.error("캔버스 업슴!!!");
    return;
  }

  const networkInfo = getNetworkInfo();
  const systemInfo = getSystemPerformance();
  if (networkInfo) {
    constraints = getVideoConstraints(networkInfo, systemInfo);
    canvas.width = constraints.width;
    canvas.height = constraints.height;
    frameRate = constraints.frameRate.ideal;
  }
  // 네트워크 정보가 없을 경우 기본값으로 설정
  else {
    canvas.width = 640;
    canvas.height = 480;
    frameRate = 15;
  }

  const stream = canvas?.captureStream(frameRate);
  if (!stream) {
    console.error("Stream not found");
  }
  const videoTracks = stream.getVideoTracks();
  if (videoTracks.length === 0) {
    console.error("No video tracks found in the stream");
    return;
  }

  canvas!.style.display = "none";
  canvas!.style.backgroundColor = "transparent";
  if (videoTracks.length === 0) {
    console.error("No video tracks found in the stream");
    return;
  }
  return videoTracks[0]; // 비디오 트랙을 반환
};

// 캡쳐용 비디오, 캔버스 display none
export const captureCamInit = (captureRef: HTMLDivElement) => {
  console.log("meetingUtils에서 captureCamInit 시작");
  const videoElement = captureRef.querySelector("video") as HTMLVideoElement;
  const canvasElement = captureRef.querySelector("canvas") as HTMLCanvasElement;
  if (videoElement) {
    videoElement.style.display = "none";
  }
  if (canvasElement) {
    canvasElement.style.display = "none";
  }
};

//FIXME 시연용 룰렛 함수
export const randomKeywordEvent = (
  keywordIdx: number,
  pickUser: string,
  pubContainer: HTMLDivElement,
  subContainer: HTMLDivElement[],
  refs: presentRefs,
) => {
  const streamElements = document.getElementsByClassName("stream-container");
  const streamArray = Array.from(streamElements);
  const tickSound = document.getElementById("tickSound") as HTMLAudioElement;

  const rouletteElements = streamArray
    .slice(0, streamArray.length / 2)
    .concat(
      streamArray.slice(streamArray.length / 2).reverse(),
    ) as HTMLDivElement[];

  const totalIterations = 36; // 원하는 총 반복 횟수
  const minDuration = 30; // 초기 강조 시간 간격
  const maxDuration = 200; // 마지막 강조 시간 간격

  let currentIndex = 0;
  let iteration = 0;
  const isAnimating = true;

  for (let i = 0; i < rouletteElements.length; i++) {
    if (rouletteElements[i].id === pickUser) {
      currentIndex += i % rouletteElements.length;
    }
  }

  const highlightUser = () => {
    if (!isAnimating || iteration >= totalIterations) {
      clearInterval(intervalId);
      rouletteElements[currentIndex].classList.add("highlighted");
      tickSound.currentTime = 0;
      tickSound.play();
      const randomKeyword = keywords[keywordIdx];
      if (pubContainer?.id === pickUser) {
        changePresentationMode(pubContainer, 12, randomKeyword, refs);
      } else {
        const presenterElement = subContainer?.filter(
          sub => sub?.id === pickUser,
        )[0];
        if (presenterElement) {
          changePresentationMode(presenterElement, 12, randomKeyword, refs);
        }
      }
      setTimeout(() => {
        for (let i = 0; i < rouletteElements.length; i++) {
          rouletteElements[i].classList.remove("highlighted");
        }
      }, 3000);
      return;
    }

    rouletteElements[currentIndex].classList.remove("highlighted");
    rouletteElements[currentIndex].classList.add("bright-5");
    currentIndex = (currentIndex + 1) % rouletteElements.length;
    rouletteElements[currentIndex].classList.add("highlighted");
    rouletteElements[currentIndex].classList.remove("bright-5");

    tickSound.currentTime = 0;
    tickSound.play();

    iteration++;

    // 비선형적으로 증가하는 시간 간격 계산 (제곱 함수 사용)
    const progress = iteration / totalIterations;
    const duration =
      minDuration * Math.pow(maxDuration / minDuration, progress * 1.5);
    clearInterval(intervalId);
    intervalId = setInterval(highlightUser, duration);
  };

  let intervalId = setInterval(highlightUser, minDuration);
};



// time 초 동안 발표 모드 (presenter: 발표자, time: 발표 시간(초), mention: 발표 주제)
export const changePresentationMode = (
  presenter: HTMLDivElement,
  time: number,
  mention: string = "",
  refs: presentRefs,
) => {
  const { keywordRef, pubRef, subRef, videoContainerRef } = refs;
  if (keywordRef.current) {
    keywordRef.current.innerText = mention;
  }
  const videoSet = new Set<HTMLDivElement | null>();
  videoSet.add(presenter); // 발표자 추가
  videoSet.add(pubRef.current); // 다음으로 퍼블리셔 추가
  subRef.current.forEach(sub => {
    videoSet.add(sub); // 나머지 사람들 다 추가
  });
  const videoArray = Array.from(videoSet); // 중복 제거된 순서대로 발표자 > 나 > 나머지 순서대로 정렬
  videoContainerRef.current?.classList.add("presentation-mode");
  // 비디오 그리드 a: main , bcdef
  videoArray.forEach((video, idx) => {
    video?.classList.add(String.fromCharCode(97 + idx));
  });
  
  // time 초 후 원래대로
  setTimeout(() => {
    videoArray.forEach((video, idx) => {
      video?.classList.remove(String.fromCharCode(97 + idx));
    });
    videoContainerRef.current?.classList.remove("presentation-mode");
    if (keywordRef.current) {
      keywordRef.current.innerText = "";
    }
  }, time * 1000);
};

// 선택된 표시 제거
export const removeChooseSign = () => {
  const chosenElements = document.getElementsByClassName("chosen-stream");
  const opacityElements = document.getElementsByClassName("opacity");
  Array.from(chosenElements).forEach(chosenElement => {
    chosenElement.classList.remove("chosen-stream");
  });
  Array.from(opacityElements).forEach(opacityElement => {
    opacityElement.classList.remove("opacity");
  });
};

export const setChooseMode = (params: chooseParams) => {
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    const { socket, nickname, subRef, keywordRef, setIsChosen, choiceState, chooseTimerRef } = params;
    
    if (keywordRef.current) {
      keywordRef.current.innerText = "대화해보고 싶은 사람을 선택해주세요";
    }
    // 이성만 선택 버튼 활성화
    const oppositeRef = subRef.current.slice(2);
    
    oppositeRef.forEach(subContainer => {
      const chooseBtn = subContainer!.getElementsByClassName("choose-btn")[0];
      chooseBtn.classList.remove("hidden");
    });
    setIsChosen(false);
    chooseTimerRef.current = setTimeout(() => {
      const emitChoose = (eventName: string) => {
        socket?.emit(eventName, {
          sender: nickname,
          receiver: subRef.current[subRef.current.length - 1]?.id,
        });
      };
      if (choiceState === "first") {
        emitChoose("choose");
      } else {
        emitChoose("lastChoose");
      }
    }, 5000);
  };
  
  export const undoChooseMode = (refs: chooseRefs) => {
    const { keywordRef, subRef, setIsChosen } = refs;
    setIsChosen(false);
    // 선택 모드 일 때는 마우스 하버시에 선택 가능한 상태로 변경
    // 클릭 시에 선택된 상태로 변경
    if (keywordRef.current) {
      keywordRef.current.innerText = "";
      console.log("선택모드 p태그 삭제");
    }
  
    const oppositeRef = subRef.current.slice(2);
  
    oppositeRef.forEach(subContainer => {
      const chooseBtn = subContainer!.getElementsByClassName("choose-btn")[0];
      chooseBtn.classList.add("hidden");
    });
  };
  

  export const setOneToOneMode = (loverElement: HTMLDivElement, videoContainerRef: React.MutableRefObject<HTMLDivElement | null>) => {
    console.log("1:1 모드로 시작");
    const videoElements = document.querySelectorAll("video");
    const canvasElements = document.querySelectorAll("canvas");
    const streamElements = document.getElementsByClassName(
      "stream-container",
  ) as HTMLCollectionOf<HTMLDivElement>;
  videoElements.forEach(video => {
    video.style.width = "100%";
    video.style.height = "100%";
  });
  canvasElements.forEach(canvas => {
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  });
  // if (!isOneToOneMode) {
  console.log("1:1 모드로 변경");
  videoContainerRef.current?.classList.add("one-one-four");
  streamElements[0].classList.add("a");
  if (!loverElement) {
    console.log("상대방이 없습니다.");
  }
  loverElement?.classList.add("b");
  let acc = 2;
  for (let i = 1; i < streamElements.length; i++) {
    if (streamElements[i].classList.contains("b")) {
      continue;
    }
    const className = String.fromCharCode(97 + acc);
    streamElements[i].classList.add(className);
    acc += 1;
  }
};

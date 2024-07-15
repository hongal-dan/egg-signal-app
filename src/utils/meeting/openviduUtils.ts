import {
  OpenVidu,
  Session,
  Publisher,
  Subscriber,
  StreamManager,
  PublisherSpeakingEvent,
} from "openvidu-browser";
import { captureCanvas } from "./meetingUtils";
import { SetStateAction } from "react";
import Swal from "sweetalert2";

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

interface JoinSessionProps {
  token: string;
  userInfo: userInfo;
  captureRef: HTMLDivElement;
  sessionId: string;
  setSession: React.Dispatch<SetStateAction<Session | undefined>>;
  setPublisher: React.Dispatch<SetStateAction<Publisher | undefined>>;
  setSubscribers: React.Dispatch<SetStateAction<StreamManager[]>>;
  setSpeakingPublisherIds: React.Dispatch<SetStateAction<string[]>>;
}

interface NetworkInfo {
  effectiveType: string; // 네트워크 유형 (e.g., '4g', '3g', 'wifi')
  rtt: number; // 라운드 트립 시간 (밀리초 단위)
}

export interface networkConstraints {
  width: number;
  height: number;
  frameRate: { ideal: number; max: number };
}

export const getSystemPerformance = () => {
  const cpuCores = navigator.hardwareConcurrency || 4; // 기본값 4코어
  const deviceMemory = (navigator as any).deviceMemory || 4; // 기본값 4GB
  const memoryUsage = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
  const totalMemory = (performance as any).memory ? (performance as any).memory.jsHeapSizeLimit : 1;

  return { cpuCores, deviceMemory, memoryUsage, totalMemory };
};

export const getNetworkInfo = (): NetworkInfo | null => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if(!connection) {
    return null;
  }
  return {
    effectiveType: connection.effectiveType,
    rtt: connection.rtt,
  };
};

export const getVideoConstraints = (networkInfo: NetworkInfo, systemInfo: { cpuCores: number; deviceMemory: number; memoryUsage:number, totalMemory:number }) => {
  let constraints: networkConstraints = {
    width: 0,
    height: 0,
    frameRate: { ideal: 0, max: 0 }
  };
  if (networkInfo.effectiveType === "4g" && networkInfo.rtt < 100) {
    constraints = {
      width: 640,
      height: 480,
      frameRate: { ideal: 30, max: 30 },
    };
  } else if (
    networkInfo.effectiveType === "3g" ||
    (networkInfo.effectiveType === "4g" && networkInfo.rtt >= 100)
  ) {
    constraints = {
      width: 480,
      height: 360,
      frameRate: { ideal: 15, max: 25 },
    };
  } else {
    constraints = {
      width: 320,
      height: 240,
      frameRate: { ideal: 10, max: 10 },
    }; // 저해상도
  }

  const memoryUsagePercentage = (systemInfo.memoryUsage / systemInfo.totalMemory) * 100;
  // console.log(systemInfo, "====================");
  // console.log(memoryUsagePercentage, "====================")
  // 시스템 성능에 따른 해상도 및 프레임 레이트 조절
  if (systemInfo.cpuCores < 4 || systemInfo.deviceMemory < 4 || memoryUsagePercentage > 60) {
    constraints.width = Math.min(constraints.width, 320);
    constraints.height = Math.min(constraints.height, 240);
    constraints.frameRate = { ideal: 10, max: 10 };
  }

  return constraints;
};

export const updatePublisherStream = (publisher: StreamManager, newConstraints: networkConstraints) => {
  const videoTrack = publisher.stream.getMediaStream().getVideoTracks()[0]
  
  if(!publisher || !publisher.stream || !publisher.stream.getMediaStream()) {
    console.error("Publisher or stream is not available.");
    return;
  }

  // 이미 설정된 해상도와 같은 경우, 업데이트하지 않음
  if(videoTrack.getSettings().width === newConstraints.width) {
    return;
  }

  const constraints = {
    width: newConstraints.width,
    height: newConstraints.height,
    frameRate: { ideal: newConstraints.frameRate.ideal, max: newConstraints.frameRate.max },
    resizeMode: "crop-and-scale",
  };

  // const capabilities = videoTrack.getCapabilities();
  // console.log("Capabilities:", capabilities);
  // console.log("================", constraints);
  videoTrack.applyConstraints(constraints).then(() => {
    console.log("Updated video constraints:", videoTrack.getSettings());
  }).catch((error: any) => {
    console.error("Error updating video constraints:", error);
  });
};

export const joinSession = async ({
  token,
  userInfo,
  captureRef,
  sessionId,
  setSession,
  setPublisher,
  setSubscribers,
  setSpeakingPublisherIds,
}: JoinSessionProps) => {
  const OV = new OpenVidu();
  OV.setAdvancedConfiguration({
    publisherSpeakingEventsOptions: {
      interval: 100, // Frequency of the polling of audio streams in ms (default 100)
      threshold: -50, // Threshold volume in dB (default -50)
    },
  });

  const newSession = OV.initSession();
  setSession(newSession);
  // Connect to the session
  newSession
    .connect(token, {
      clientData: userInfo?.nickname as string, // FIXME 배포시엔 저를 써주세요.
      // clientData: participantName, // FIXME 배포 시 랜덤닉네임 말고 유저 아이디로
      gender: userInfo?.gender as string,
    })
    .then(async () => {
      const arStream = captureCanvas(captureRef);
      const publisher = await OV.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: arStream,
        publishAudio: true,
        publishVideo: true,
        resolution: "640x480",
        frameRate: 30,
        insertMode: "APPEND",
        mirror: false,
      });

      console.log("Publisher created:", publisher, sessionId);
      publisher.updatePublisherSpeakingEventsOptions({
        interval: 100, // 발화자 이벤트 감지 주기 (밀리초)
        threshold: -50, // 발화자 이벤트 발생 임계값 (데시벨)
      });
      newSession.publish(publisher);
      setPublisher(publisher);
    })
    .catch(error => {
      console.log(
        "There was an error connecting to the session:",
        error.code,
        error.message,
      );
    });

  newSession.on("streamCreated", event => {
    // 새로운 스트림이 생성될 때, 해당 스트림을 구독
    const subscriber = newSession.subscribe(event.stream, undefined);
    // 구독한 스트림을 구독자 목록에 추가
    console.log("지금 들어온 사람", subscriber.stream.connection.data);
    setSubscribers(prevSubscribers => [...prevSubscribers, subscriber]);
  });

  newSession.on("streamDestroyed", event => {
    setSubscribers(prevSubscribers =>
      prevSubscribers.filter(sub => sub !== event.stream.streamManager),
    );
  });

  newSession.on("exception", exception => {
    console.warn(exception);
  });

  // 세션에서 발화자 이벤트 리스너 추가
  newSession.on("publisherStartSpeaking", (event: PublisherSpeakingEvent) => {
    const streamId = event.connection.stream?.streamId;
    if (streamId !== undefined) {
      setSpeakingPublisherIds(prevIds => [...prevIds, streamId]);
    } else {
      console.log("streamId undefined");
    }
  });

  newSession.on("publisherStopSpeaking", (event: PublisherSpeakingEvent) => {
    const streamId = event.connection.stream?.streamId;
    if (streamId !== undefined) {
      setSpeakingPublisherIds(prevIds => prevIds.filter(id => id !== streamId));
    }
  });
};

// 오디오 차단 관련
const getKeyById = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    return element.getAttribute("data-key");
  } else {
    console.error("Element with id", id, "not found.");
    return null;
  }
};

// 내가 매칭 된 경우, 매칭 안 된 참여자들 소리 안 듣기
export const toggleLoserAudio = (
  subscribers: StreamManager[],
  partnerName: string,
  flag: boolean,
) => {
  const partnerStreamId = getKeyById(partnerName);

  subscribers.forEach(sub => {
    if (sub instanceof Subscriber && sub.stream.streamId !== partnerStreamId) {
      sub?.subscribeToAudio(flag);
    }
  });
};

// 내가 매칭 안 된 경우, 매칭 된 참여자들 소리 안 듣기
export const toggleLoverAudio = (
  subscribers: StreamManager[],
  loser: string[],
  flag: boolean,
) => {
  const loserStreamIds = loser
    .map(loserName => getKeyById(loserName))
    .filter(id => id !== null);

  if (loserStreamIds.length > 0) {
    subscribers.forEach(sub => {
      if (
        sub instanceof Subscriber &&
        !loserStreamIds.includes(sub.stream.streamId)
      ) {
        sub?.subscribeToAudio(flag);
      }
    });
  }
};

export const getUserID = (person: StreamManager): string => {
  const idMatch = person?.stream.connection.data.match(
    /"clientData":"([a-zA-Z0-9-\uAC00-\uD7A3]+)"/,
  );
  const id = idMatch ? idMatch[1] : "";
  return id;
};

export const getUserGender = (person: StreamManager): string => {
  const genderMatch = person?.stream.connection.data.match(
    /"gender":"(MALE|FEMALE)"/,
  );
  const gender = genderMatch ? genderMatch[1] : "";

  return gender;
};

// 내 성별 기준으로 서브 정렬
export const sortSubscribers = (
  myGender: string,
  subscribers: StreamManager[],
  setSortedSubscribers: React.Dispatch<SetStateAction<StreamManager[]>>,
) => {
  let oppositeGender = "";
  if (myGender === "MALE") {
    oppositeGender = "FEMALE";
  } else {
    oppositeGender = "MALE";
  }

  subscribers.forEach(subscriber => {
    if (getUserGender(subscriber) === myGender)
      setSortedSubscribers(prevSortedSubScribers => [
        ...prevSortedSubScribers,
        subscriber,
      ]);
  });
  subscribers.forEach(subscriber => {
    if (getUserGender(subscriber) === oppositeGender)
      setSortedSubscribers(prevSortedSubScribers => [
        ...prevSortedSubScribers,
        subscriber,
      ]);
  });
};

export const openCam = (
  publisher: Publisher,
  setIsOpenCam: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  if (publisher) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      const webcamTrack = stream.getVideoTracks()[0];
      publisher
        .replaceTrack(webcamTrack)
        .then(() => {
          setIsOpenCam(true);
          console.log("Track replaced with webcam track");
        })
        .catch(error => {
          console.error("Error replacing track:", error);
        });
    });
  }
};

export const leaveHandler = (leaveSession: () => void) => {
  Swal.fire({
    title: "정말 나가시겠습니까?",
    text: "지금 나가면 현재 미팅 방이 종료됩니다!",
    imageUrl: "/img/500.png",
    imageWidth: 200,
    imageHeight: 200,
    imageAlt: "crying eggs",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "나갈게요",
    cancelButtonText: "취소",
  }).then(result => {
    if (result.isConfirmed) {
      leaveSession();
    }
  });
};

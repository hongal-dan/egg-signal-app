//"use client";

import React, { useRef, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { useRecoilValue } from "recoil";
// import { userState } from "@/app/store/userInfo";
import { meetingSocketState } from "@/app/store/socket";
import { testState } from "@/app/store/userInfo"; //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
import { drawingKeywords } from "../../../public/data/drawingKeywords";
import DrawingStage from "@/containers/meeting/drawingContest/DrawingStage";
import VotingStage from "@/containers/meeting/drawingContest/VotingStage";
import WinnerChoiceStage from "@/containers/meeting/drawingContest/WinnerChoiceStage";
import FinalResultsStage from "@/containers/meeting/drawingContest/FinalStage";

type CanvasModalProps = {
  onClose: () => void;
  keywordsIndex: number;
};

/** keywordRef.current 이용해서 유저에게 tutorial전달 */
const CanvasModal: React.FC<CanvasModalProps> = ({
  onClose,
  keywordsIndex,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const hasSubmittedRef = useRef<boolean>(hasSubmitted);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const selectedUserRef = useRef<string | null>(selectedUser);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [brushSize, setBrushSize] = useState(8);
  const [drawings, setDrawings] = useState<Record<string, string>>({});
  const [voteResults, setVoteResults] = useState<string | null>(null);
  const voteResultsRef = useRef<string | null>(voteResults);
  const [timeLeft, setTimeLeft] = useState(15);
  const [finalResults, setFinalResults] = useState<{
    winners: string[];
    losers: string[];
  } | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Record<string, string>>(
    {},
  );
  const [currentStage, setCurrentStage] = useState("drawing");
  const drawingKeywordRef = useRef<HTMLParagraphElement>(null);
  const socket = useRecoilValue(meetingSocketState)!;
  // const userInfo = useRecoilValue(userState);
  const testName = useRecoilValue(testState); //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    hasSubmittedRef.current = hasSubmitted;
  }, [hasSubmitted]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    voteResultsRef.current = voteResults;
  }, [voteResults]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = 270;
    canvas.height = 240;
    canvas.style.width = "432px";
    canvas.style.height = "384px";

    const context = canvas.getContext("2d")!;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.fillStyle = "#F7F7F7";
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;

    startDrawingContest();

    socket.on("drawingSubmit", (drawings: Record<string, string>) => {
      setHasSubmitted(false);
      clearInterval(intervalRef.current!);
      const updatedDrawings: Record<string, string> = {};
      Object.entries(drawings).forEach(([userName, drawingBuffer]) => {
        const blob = new Blob([drawingBuffer], { type: "image/webp" });
        const url = URL.createObjectURL(blob);
        updatedDrawings[userName] = url;
      });

      setDrawings(updatedDrawings);
      setCurrentStage("voting");
      const users = Object.keys(drawings);
      setTimeLeft(15);
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t > 1) return t - 1;
          else {
            if (!hasSubmittedRef.current) {
              handleVoteSubmit(users[0]);
              setHasSubmitted(true);
            }
            clearInterval(intervalRef.current!);
            return 0;
          }
        });
      }, 1000);
    });

    socket.on(
      "voteResults",
      (results: {
        winner: string;
        losers: string[];
        photos: Record<string, string>;
      }) => {
        setHasSubmitted(false);
        clearInterval(intervalRef.current!);
        const { winner, losers, photos } = results;
        const updatedPhotos: Record<string, string> = {};
        Object.entries(photos).forEach(([userName, photo]) => {
          updatedPhotos[userName] = photo;
        });
        setVoteResults(winner);
        setCapturedPhoto(updatedPhotos);
        setCurrentStage("winnerChoice");

        setTimeLeft(15);
        intervalRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t > 1) return t - 1;
            else {
              if (!hasSubmittedRef.current) {
                handleWinnerPrizeSubmit("no", losers);
                setHasSubmitted(true);
              }
              clearInterval(intervalRef.current!);
              return 0;
            }
          });
        }, 1000);
      },
    );

    socket.on("finalResults", results => {
      setFinalResults(results);
      setCurrentStage("final");
      const { winners, losers } = results;

      setTimeout(() => {
        onClose();
      }, 7000);

      socket.emit("drawingOneToOne", {
        userName: testName,
        winners,
        losers,
      });
    });

    return () => {
      socket.off("startDrawing");
      socket.off("drawingSubmit");
      socket.off("voteResults");
      socket.off("finalResults");
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
    }
  }, [color]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = brushSize;
    }
  }, [brushSize]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current!.beginPath();
    contextRef.current!.moveTo(offsetX * (270 / 432), offsetY * (240 / 384));
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current!.lineTo(offsetX * (270 / 432), offsetY * (240 / 384));
    contextRef.current!.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const context = contextRef.current!;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f0f0f0";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawingContest = () => {
    const drawingIndex = Math.floor(keywordsIndex % drawingKeywords.length);

    if (drawingKeywordRef.current)
      drawingKeywordRef.current.innerText = drawingKeywords[drawingIndex];

    setTimeLeft(15);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t > 1) return t - 1;
        else {
          if (!hasSubmittedRef.current) {
            handleForwardDrawing();
            setHasSubmitted(true);
          }
          clearInterval(intervalRef.current!);
          return 0;
        }
      });
    }, 1000);
  };

  const captureVideoFrame = () => {
    const publisherContainer = document.getElementById(testName);
    const video = publisherContainer?.querySelector("video");
    const canvas = document.createElement("canvas");

    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/webp");
        return dataUrl;
      }
    }
    return "";
  };

  const handleForwardDrawing = async () => {
    const canvas = canvasRef.current!;
    const blob = await new Promise<Blob | null>(resolve =>
      canvas?.toBlob(resolve, "image/webp"),
    );
    const capturedPhoto = captureVideoFrame();
    setHasSubmitted(true);
    if (blob) {
      const resizedBlob = await resizeAndCompressImage(blob, canvas.width);
      const arrayBuffer = await resizedBlob.arrayBuffer();
      socket.emit("forwardDrawing", {
        // userName: userInfo?.nickname,
        userName: testName, // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
        drawing: arrayBuffer,
        photo: capturedPhoto,
      });
    }
  };

  const resizeAndCompressImage = async (blob: Blob, width: number) => {
    const file = new File([blob], "drawing", {
      type: "image/webp",
    });

    return await imageCompression(file, {
      maxSizeMB: 0.1,
      maxWidthOrHeight: width * 0.5,
      useWebWorker: true,
      fileType: "image/webp",
    });
  };

  const handleVoteSubmit = (votedUser: string) => {
    setHasSubmitted(true);
    setSelectedUser(votedUser);
    socket.emit("submitVote", {
      // userName: userInfo?.nickname,
      userName: testName, // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
      votedUser: votedUser,
    });
  };

  const handleWinnerPrizeSubmit = (
    selectedUser: string | null,
    losers: string[],
  ) => {
    setHasSubmitted(true);
    setSelectedUser(selectedUser);
    let winners!: string[];

    if (selectedUser !== "no")
      winners = [voteResultsRef.current!, selectedUser!];
    else winners = [voteResultsRef.current!];
    losers = losers.filter(loser => !winners.includes(loser));
    socket.emit("winnerPrize", { userName: testName, winners, losers });
  };

  return (
    <div className="fixed z-1000 left-0 top-0 w-full h-full overflow-hidden bg-[rgba(0,0,0,0.05)]">
      <div className="bg-white p-5 border border-gray-300 w-full max-w-[39rem] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg rounded-2xl min-w-[576px]">
        {currentStage === "drawing" && (
          <DrawingStage
            clearCanvas={clearCanvas}
            timeLeft={timeLeft}
            drawingKeywordRef={drawingKeywordRef}
            canvasRef={canvasRef}
            startDrawing={startDrawing}
            finishDrawing={finishDrawing}
            draw={draw}
            setColor={setColor}
            setBrushSize={setBrushSize}
            color={color}
          />
        )}

        {currentStage === "voting" && (
          <VotingStage
            drawings={drawings}
            selectedUser={selectedUser}
            handleVoteSubmit={handleVoteSubmit}
            timeLeft={timeLeft}
          />
        )}

        {currentStage === "winnerChoice" && voteResults && (
          <WinnerChoiceStage
            testName={testName}
            voteResults={voteResults}
            drawings={drawings}
            capturedPhoto={capturedPhoto}
            selectedUser={selectedUser}
            handleWinnerPrizeSubmit={handleWinnerPrizeSubmit}
            timeLeft={timeLeft}
          />
        )}

        {currentStage === "final" && finalResults && (
          <FinalResultsStage
            finalResults={finalResults}
            capturedPhoto={capturedPhoto}
          />
        )}
      </div>
    </div>
  );
};

export default CanvasModal;

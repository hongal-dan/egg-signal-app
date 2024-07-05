"use client";

import React, { useRef, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { useRecoilValue } from "recoil";
import { userState } from "@/app/store/userInfo";
import { meetingSocketState } from "@/app/store/socket";
import "@/styles/canvas.css";

import { testState } from "@/app/store/userInfo"; //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
import { drawingKeywords } from "../../../public/data/drawingKeywords";
type CanvasModalProps = {
  onClose: () => void;
};

const CanvasModal: React.FC<CanvasModalProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [brushSize, setBrushSize] = useState(8);
  const [drawings, setDrawings] = useState<Record<string, string>>({});
  const [voteResults, setVoteResults] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [finalResults, setFinalResults] = useState<{
    winners: string[];
    losers: string[];
  } | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Record<string, string>>(
    {},
  );
  const [hasVoted, setHasVoted] = useState(false);
  const [currentStage, setCurrentStage] = useState("drawing");
  const drawingKeywordRef = useRef<HTMLParagraphElement>(null);
  const socket = useRecoilValue(meetingSocketState)!;
  const userInfo = useRecoilValue(userState);

  const testName = useRecoilValue(testState); //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = 270;
    canvas.height = 240;
    canvas.style.width = "360px";
    canvas.style.height = "320px";

    const context = canvas.getContext("2d")!;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.fillStyle = "#f0f0f0";
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;

    const startDrawing = () => {
      const drawingIndex = Math.floor(Math.random() * drawingKeywords.length);
      /**추후 서버에서 받을 예정 */
      if (drawingKeywordRef.current)
        drawingKeywordRef.current.innerText = drawingKeywords[drawingIndex];


    startDrawing();

    socket.on("drawingSubmit", (drawings: Record<string, string>) => {
      const updatedDrawings: Record<string, string> = {};
      Object.entries(drawings).forEach(([userName, drawingBuffer]) => {
        const blob = new Blob([drawingBuffer], { type: "image/webp" });
        const url = URL.createObjectURL(blob);
        updatedDrawings[userName] = url;
      });
      setDrawings(updatedDrawings);
      setCurrentStage("voting");
    });

    socket.on(
      "voteResults",
      (results: { winner: string; photos: Record<string, string> }) => {
        const { winner, photos } = results;
        const updatedPhotos: Record<string, string> = {};
        Object.entries(photos).forEach(([userName, photo]) => {
          updatedPhotos[userName] = photo;
        });
        setVoteResults(winner);
        setCapturedPhoto(updatedPhotos);
        setCurrentStage("winnerChoice");
      },
    );

    socket.on("finalResults", results => {
      setFinalResults(results);
      setCurrentStage("final");
    });

    return () => {};
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
    contextRef.current!.moveTo(offsetX * (270 / 360), offsetY * (240 / 320));
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current!.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current!.lineTo(offsetX * (270 / 360), offsetY * (240 / 320));
    contextRef.current!.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const context = contextRef.current!;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f0f0f0";
    context.fillRect(0, 0, canvas.width, canvas.height);
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
      canvas.toBlob(resolve, "image/webp"),
    );
    console.log(testName); //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
    const btnElement = document.getElementById("그림 제출버튼")!;
    btnElement.innerText = "다시 제출";

    const capturedPhoto = captureVideoFrame();
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

  const handleVoteSubmit = () => {
    if (hasVoted) {
      alert("투표는 한번만이에요");
      return;
    }

    if (selectedUser) {
      socket.emit("submitVote", {
        // userName: userInfo?.nickname,
        userName: testName, // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
        votedUser: selectedUser,
      });
      setSelectedUser(null);
      setHasVoted(true);
    } else {
      alert("투표할 그림을 골라주세요.");
    }
  };

  const handleWinnerPrizeSubmit = () => {
    if (selectedUser) {
      const winners = [voteResults!, selectedUser];
      const losers = Object.keys(drawings).filter(
        user => !winners.includes(user),
      );
      socket.emit("winnerPrize", {
        winners,
        losers,
      });
      setFinalResults({ winners, losers });
      setCurrentStage("final");
    } else {
      alert("왜 아무도안골라");
    }
  };

  const renderDrawings = () => {
    return Object.entries(drawings).map(([user, drawing], index) => (
      <div
        key={index}
        className={`${
          selectedUser === user ? "border-4 border-yellow-50" : "border"
        }`}
        onClick={() => setSelectedUser(user)}
      >
        <img src={drawing} className="w-full h-full object-cover" />
      </div>
    ));
  };

  const renderWinnerChoiceOptions = () => {
    const otherUsers = Object.keys(capturedPhoto).filter(
      user => user !== voteResults,
    );
    return otherUsers.map((user, index) => (
      <div
        key={index}
        className={`${
          selectedUser === user ? "border-4 border-yellow-50" : "border"
        }`}
        onClick={() => setSelectedUser(user)}
      >
        <img src={capturedPhoto[user]} className="w-full h-full object-cover" />
      </div>
    ));
  };

  return (
    <div className="fixed z-1000 left-0 top-0 w-full h-full overflow-hidden bg-[rgba(0,0,0,0.05)]">
      <div className="bg-white p-5 border border-gray-300 w-4/5 max-w-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg">
        {currentStage === "drawing" && (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-xl">
              <p className="drawingKeyword" ref={drawingKeywordRef}></p>
            </div>
            <div className="mb-4 text-l">
              <span>남은 시간: {timeLeft}초</span>
            </div>

            <div className="flex items-start justify-between w-full">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                className="border border-black mr-5 mt-2 bg-[#ffefcef1]"
              />
              <div className="flex flex-col flex-grow">
                <div className="flex flex-wrap mb-4" style={{ width: "80px" }}>
                  {["red", "orange", "green", "blue", "black"].map(col => (
                    <button
                      key={col}
                      onClick={() => setColor(col)}
                      className="m-1 w-7 h-7"
                      style={{ backgroundColor: col }}
                    ></button>
                  ))}
                  <button
                    key="white"
                    onClick={() => setColor("white")}
                    className="m-1 w-7 h-7 bg-white"
                    style={
                      {
                        // FIXME backgroundImage: 'url("/eraser-icon.png")' /**추후 이미지 수정 */,
                      }
                    }
                  ></button>
                </div>
                <div>브러쉬 굵기</div>
                <div className="flex flex-wrap mb-4" style={{ width: "100px" }}>
                  {[5, 8, 12].map(size => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className="m-1 w-15 h-7"
                      style={
                        {
                          // FIXME backgroundImage: `url(/brush-${size}px.png)` /**추후 이미지 수정 */,
                        }
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap">
                  <button onClick={clearCanvas}>전부 지우기</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStage === "voting" && (
          <>
            <h2 className="text-xl font-bold mb-4">그림을 골라보세요</h2>
            <div className="grid grid-cols-3 grid-rows-2 gap-2 mb-5">
              {renderDrawings()}
            </div>
          </>
        )}

        {currentStage === "winnerChoice" && voteResults && (
          <>
            <h2 className="text-xl font-bold mb-4">투표 결과</h2>
            <div className="mb-4">1등은 {voteResults}입니다~</div>
            {/* {userInfo?.nickname === voteResults && ( */}
            {testName === voteResults && ( // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  같이 있고 싶은 사람을 골라보세요
                </h3>
                <div className="grid grid-cols-3 grid-rows-2 gap-2 mb-5">
                  {renderWinnerChoiceOptions()}
                </div>
              </div>
            )}
          </>
        )}

        {currentStage === "final" && finalResults && (
          <>
            <h2 className="text-xl font-bold mb-4">최종 결과</h2>
            <div>좋은시간보내세요 {finalResults.winners.join(", ")}</div>
            <div>나머지: {finalResults.losers.join(", ")}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default CanvasModal;

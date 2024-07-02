"use client";

import React, { useRef, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { useRecoilValue } from "recoil";
import { userState } from "@/app/store/userInfo";
import { meetingSocketState } from "@/app/store/socket";
import "@/styles/canvas.css";

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
  const [hasVoted, setHasVoted] = useState(false);
  const [currentStage, setCurrentStage] = useState("drawing");

  const socket = useRecoilValue(meetingSocketState)!;
  const userInfo = useRecoilValue(userState);

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

    socket.on("startDrawing", () => {
      setCurrentStage("drawing");
    });

    socket.on("drawingSubmit", (drawings: Record<string, ArrayBuffer>) => {
      const updatedDrawings: Record<string, string> = {};
      Object.entries(drawings).forEach(([userName, drawingBuffer]) => {
        const blob = new Blob([drawingBuffer], { type: "image/webp" });
        const url = URL.createObjectURL(blob);
        updatedDrawings[userName] = url;
      });
      setDrawings(updatedDrawings);
      setCurrentStage("voting");
    });

    socket.on("voteResults", results => {
      const { winner } = results;
      setVoteResults(winner);
      setCurrentStage("winnerChoice");
    });

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

  const handleForwardDrawing = async () => {
    const canvas = canvasRef.current!;
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/webp"),
    );
    if (blob) {
      const resizedBlob = await resizeAndCompressImage(blob, canvas.width);
      const arrayBuffer = await resizedBlob.arrayBuffer();
      socket.emit("forwardDrawing", {
        userName: userInfo?.nickname,
        drawing: arrayBuffer,
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
        userName: userInfo?.nickname,
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
        className={`canvas-grid-item ${selectedUser === user ? "selected" : ""}`}
        onClick={() => setSelectedUser(user)}
      >
        <img src={drawing} />
      </div>
    ));
  };

  const renderWinnerChoiceOptions = () => {
    const otherUsers = Object.keys(drawings).filter(
      user => user !== voteResults,
    );
    return otherUsers.map((user, index) => (
      <div
        key={index}
        className={`canvas-grid-item ${selectedUser === user ? "selected" : ""}`}
        onClick={() => setSelectedUser(user)}
      >
        <img src={drawings[user]} />
      </div>
    ));
  };

  return (
    <div className="canvas-modal">
      <div className="canvas-modal-content">
        <span className="canvas-close" onClick={onClose}>
          &times;
        </span>
        {currentStage === "drawing" && (
          <div className="flex flex-col justify-center items-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
            />
            <div>
              {["red", "orange", "green", "blue", "black", "white"].map(col => (
                <button
                  key={col}
                  onClick={() => setColor(col)}
                  style={{ backgroundColor: col, margin: "0 5px" }}
                ></button>
              ))}
            </div>
            <div>
              <label>굵기</label>
              {[5, 8, 12].map(size => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  style={{ margin: "0 5px" }}
                >
                  {size}px
                </button>
              ))}
            </div>
            <div>
              <button onClick={clearCanvas}>전부 지우기</button>
            </div>
            <button onClick={handleForwardDrawing}>그림 제출</button>
          </div>
        )}

        {currentStage === "voting" && (
          <>
            <h2>그림을 골라보세요</h2>
            <div className="canvas-grid-container">{renderDrawings()}</div>
            <button onClick={handleVoteSubmit}>투표 출발</button>
          </>
        )}

        {currentStage === "winnerChoice" && voteResults && (
          <>
            <h2>투표 결과</h2>
            <div>1등은 {voteResults}입니다~</div>
            {userInfo?.nickname === voteResults && (
              <div>
                <h3>같이 있고 싶은 사람을 골라보세요</h3>
                <div className="canvas-grid-container">
                  {renderWinnerChoiceOptions()}
                </div>
                <button onClick={handleWinnerPrizeSubmit}>이사람이요</button>
              </div>
            )}
          </>
        )}

        {currentStage === "final" && finalResults && (
          <>
            <h2>최종 결과</h2>
            <div>좋은시간보내세요 {finalResults.winners.join(", ")}</div>
            <div>나머지: {finalResults.losers.join(", ")}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default CanvasModal;

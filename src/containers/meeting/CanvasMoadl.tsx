"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { userState } from "@/app/store/userInfo";
import { meetingSocketState } from "@/app/store/socket";
// import styles from "@/styles/canvas.css";

type CanvasModalProps = {
  onClose: () => void;
};

const CanvasModal: React.FC<CanvasModalProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [brushSize, setBrushSize] = useState(8);
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
      console.log("###사생대회 시작###");
      setCurrentStage("drawing");
    });

    return () => {
      socket.disconnect();
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

  const handleJoinSession = () => {
    socket.emit("joinSession", { userName: userInfo?.nickname });
  };

  const handleForwardDrawing = async () => {
    const canvas = canvasRef.current!;
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/webp"),
    );
    console.log(blob);
    if (blob) {
      const arrayBuffer = await blob.arrayBuffer();
      socket.emit("forwardDrawing", {
        userName: userInfo?.nickname,
        drawing: arrayBuffer,
      });
    }
  };
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        {currentStage === "drawing" && (
          <>
            <h1>사생대회 ㅎㅎ</h1>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
              style={{ border: "1px solid black", backgroundColor: "#f0f0f0" }}
            />
            <div>
              <label>색을 골라보세요 </label>
              {["red", "orange", "green", "blue", "black", "white"].map(col => (
                <button
                  key={col}
                  onClick={() => setColor(col)}
                  style={{ backgroundColor: col, margin: "0 5px" }}
                >
                  {col}
                </button>
              ))}
            </div>
            <div>
              <label>굵기: </label>
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
          </>
        )}
      </div>
    </div>
  );
};

export default CanvasModal;

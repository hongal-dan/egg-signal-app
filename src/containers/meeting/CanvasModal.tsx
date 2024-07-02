"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { meetingSocketState } from "@/app/store/socket";
import "@/styles/canvas.css";

type CanvasModalProps = {
  onClose: () => void;
};

const CanvasModal: React.FC<CanvasModalProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [color] = useState("black");
  const [brushSize] = useState(8);
  const [, setCurrentStage] = useState("drawing");

  const socket = useRecoilValue(meetingSocketState)!;

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

  return <div></div>;
};

export default CanvasModal;

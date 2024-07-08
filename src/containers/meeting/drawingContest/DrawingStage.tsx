import React from "react";
import { BsEraserFill } from "react-icons/bs";
import { RiBrushFill } from "react-icons/ri";

interface DrawingStageProps {
  clearCanvas: () => void;
  timeLeft: number;
  drawingKeywordRef: React.RefObject<HTMLParagraphElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startDrawing: (e: React.MouseEvent) => void;
  finishDrawing: () => void;
  draw: (e: React.MouseEvent) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  color: string;
}

const DrawingStage: React.FC<DrawingStageProps> = ({
  clearCanvas,
  timeLeft,
  drawingKeywordRef,
  canvasRef,
  startDrawing,
  finishDrawing,
  draw,
  setColor,
  setBrushSize,
  color,
}) => {
  return (
    <div className="flex flex-col ">
      <div className=" flex flex-col items-center">
        <p className="drawingKeyword text-2xl" ref={drawingKeywordRef}></p>
        <div className="text-l w-full flex justify-between items-center">
          <div className="flex mt-1 justify-start">
            <button
              onClick={clearCanvas}
              className="border-solid border-orange-400 rounded-xl border-opacity-10 bg-orange-200 bg-opacity-20 border-[2px] p-1 text-sm"
            >
              다시 그리기
            </button>
          </div>{" "}
          <p className="flex justify-end">남은 시간: {timeLeft}초</p>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div className="flex items-start justify-between w-full flex-grow">
          <div>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
              onMouseLeave={finishDrawing}
              className="border border-grey-700 rounded-2xl  mt-2 bg-[#ffefcef1]"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex h-33 "> </div>
            <div className="flex flex-col justify-end h-[384px]">
              <div className="flex flex-wrap mb-4 w-20">
                {[
                  "red",
                  "orange",
                  "#facc15",
                  "green",
                  "blue",
                  "lightpink",
                  "black",
                ].map(col => (
                  <button
                    key={col}
                    onClick={() => setColor(col)}
                    className="m-1 w-7 h-7 rounded-2xl"
                  >
                    <RiBrushFill
                      className="text-col text-3xl"
                      style={{ color: col }}
                    />
                  </button>
                ))}
                <button
                  key="white"
                  onClick={() => setColor("#F7F7F7")}
                  className="m-1 ml-2 w-7 h-7 bg-white rounded-full"
                >
                  <BsEraserFill
                    className="text-black text-2xl"
                    style={{ color: "#7F7F7F" }}
                  />
                </button>
              </div>
              <div className="flex flex-col mt-4 mb-4">
                {[5, 8, 12].map(size => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`bg-inherit text-black text-[${size}px]`}
                    style={{
                      fontSize: `${size * 4}px`,
                      color: `${color}`,
                    }}
                  >
                    ●
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingStage;

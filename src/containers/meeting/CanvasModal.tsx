//"use client";

import React, { useRef, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { useRecoilValue } from "recoil";
// import { userState } from "@/app/store/userInfo";
import { meetingSocketState } from "@/app/store/socket";
import { testState } from "@/app/store/userInfo"; //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
import { drawingKeywords } from "../../../public/data/drawingKeywords";
import { BsEraserFill } from "react-icons/bs";
import { RiBrushFill } from "react-icons/ri";
import { IoMdHeart } from "react-icons/io";
import { PiCrownSimpleDuotone } from "react-icons/pi";

type CanvasModalProps = {
  onClose: () => void;
  keywordsIndex: number;
};

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
              console.log(users);
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
    console.log(testName); //FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
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

  const renderDrawings = () => {
    return Object.entries(drawings).map(([user, drawing], index) => (
      <div
        key={index}
        className={"relative  p-1 border-gray-300 shadow-lg border rounded-lg"}
        onClick={() => handleVoteSubmit(user)}
      >
        {selectedUser === user && (
          <div className="absolute top-0 left-0 p-2">
            <IoMdHeart className="text-red-600 text-xl border rounded-xl bg-white" />
          </div>
        )}
        <img src={drawing} className="  rounded-xl" />
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
          selectedUser === user
            ? "border-6 border-yellow-400 rounded-2xl"
            : "border rounded-2xl"
        }`}
        onClick={() => handleWinnerPrizeSubmit(user, otherUsers)}
      >
        <img
          src={capturedPhoto[user]}
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
    ));
  };

  return (
    <div className="fixed z-1000 left-0 top-0 w-full h-full overflow-hidden bg-[rgba(0,0,0,0.05)]">
      <div className="bg-white p-5 border border-gray-300 w-full max-w-[39rem] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg rounded-2xl min-w-[576px]">
        {currentStage === "drawing" && (
          <div className="flex flex-col ">
            <div className=" flex flex-col items-center">
              <p
                className="drawingKeyword text-2xl"
                ref={drawingKeywordRef}
              ></p>
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
                  {" "}
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
                        {" "}
                        <BsEraserFill
                          className="text-black text-2xl"
                          style={{ color: "#7F7F7F" }}
                        />
                      </button>
                    </div>
                    <div className="flex flex-col mt-4 mb-4">
                      {[5, 8, 12].map((size, idx) => (
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
        )}

        {currentStage === "voting" && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">
              어떤 그림이 마음에 드나요?
            </h2>
            <div className="flex flex-col items-end">
              <div className="mb-4 text-l">
                <span>남은 시간: {timeLeft}초</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mb-5 w-full rounded-lg">
                {renderDrawings()}
              </div>
            </div>
          </div>
        )}

        {currentStage === "winnerChoice" && voteResults && (
          <>
            {testName !== voteResults && (
              <div>
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-2xl font-bold ">
                    1등 대{voteResults}
                  </div>
                  {/* {userInfo?.nickname === voteResults && ( */}
                  <div>
                    <img
                      src={drawings[voteResults]}
                      className="w-[365px] h-[324px] object-cover rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {testName === voteResults && ( // FIXME 테스트용 랜덤 닉네임 저장, 배포 전에 삭제해야함
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-2">
                  누구와 대화하고 싶나요?
                </h3>
                <div className="flex flex-col items-end">
                  <span>남은 시간: {timeLeft}초</span>
                  <div className="grid grid-cols-3 grid-rows-2 gap-2 mb-5 w-full">
                    {renderWinnerChoiceOptions()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentStage === "final" && finalResults && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">최종 결과</h2>
            <div className="flex flex-col items-center">
              <div className="flex gap-4 mb-4">
                {finalResults.winners.map((winner, index) => (
                  <div
                    key={index}
                    className="w-full relative border rounded-2xl p-1 bg-white shadow-md"
                  >
                    <img
                      src={capturedPhoto[winner]}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-1 rounded-b-2xl">
                      {winner}
                    </div>{" "}
                    {index === 0 && (
                      <div className="absolute top-0 left-0 p-2">
                        <PiCrownSimpleDuotone className="text-yellow-500 text-2xl" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              {finalResults.losers.length === 5
                ? "1등은 아무도 선택하지 않았습니다"
                : "좋은 시간 되세요"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasModal;

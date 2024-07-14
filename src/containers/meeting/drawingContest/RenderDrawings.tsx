import React from "react";
import { IoMdHeart } from "react-icons/io";

interface RenderDrawingsProps {
  drawings: Record<string, string>;
  selectedUser: string | null;
  handleVoteSubmit: (votedUser: string) => void;
}

const RenderDrawings: React.FC<RenderDrawingsProps> = ({
  drawings,
  selectedUser,
  handleVoteSubmit,
}) => {
  return (
    <>
      {Object.entries(drawings).map(([user, drawing], index) => (
        <div
          key={index}
          className="relative p-1 border-gray-300 shadow-lg border rounded-lg"
          onClick={() => handleVoteSubmit(user)}
        >
          {selectedUser === user && (
            <div className="absolute top-0 left-0 p-2">
              <IoMdHeart className="text-red-600 text-2xl" />
            </div>
          )}
          <img
            src={drawing}
            className="rounded-xl"
            alt={`Drawing by ${user}`}
          />
        </div>
      ))}
    </>
  );
};

export default RenderDrawings;

import React from "react";

interface RenderWinnerChoiceOptionsProps {
  capturedPhoto: Record<string, string>;
  voteResults: string | null;
  selectedUser: string | null;
  handleWinnerPrizeSubmit: (user: string, otherUsers: string[]) => void;
  winnerName: string;
}

const RenderWinnerChoiceOptions: React.FC<RenderWinnerChoiceOptionsProps> = ({
  capturedPhoto,
  voteResults,
  selectedUser,
  handleWinnerPrizeSubmit,
  winnerName,
}) => {
  const otherUsers = Object.keys(capturedPhoto).filter(
    user => user !== voteResults,
  );

  const getUserGender = (user: string): string | null => {
    const userStream = document.getElementById(user);
    return userStream ? userStream.dataset.gender! : null;
  };

  const winnerGender = getUserGender(winnerName);

  const filteredUsers = otherUsers.filter(user => {
    const gender = getUserGender(user);
    return gender !== winnerGender;
  });

  return (
    <>
      {filteredUsers.map((user, index) => (
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
            alt={`User ${user}`}
          />
        </div>
      ))}
    </>
  );
};

export default RenderWinnerChoiceOptions;

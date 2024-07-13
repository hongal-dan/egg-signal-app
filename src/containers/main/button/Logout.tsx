import React from "react";

interface LogoutProps {
  commonSocket: any;
}

const Logout: React.FC<LogoutProps> = ({ commonSocket }) => {
  const offCommonSocketEvent = () => {
    commonSocket?.off("newMessageNotification");
    commonSocket?.off("friendOnline");
    commonSocket?.off("friendOffline");
    commonSocket?.off("resGetNotifications");
    commonSocket?.off("newFriendRequest");
    commonSocket?.off("resAcceptFriend");
    commonSocket?.off("friendRequestAccepted");
    commonSocket?.off("friendStat");
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("onlineFriends");
      offCommonSocketEvent();
      commonSocket?.disconnect();
      window.location.reload();
    } catch (error) {
      console.error("Log out Error: ", error);
    }
  };

  return (
    <button
      className="fixed top-4 right-4 z-10 border-b border-gray-500 text-gray-500"
      onClick={handleLogout}
    >
      Log out
    </button>
  );
};

export default Logout;

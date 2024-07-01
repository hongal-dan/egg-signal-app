import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import MainContent from "@/containers/main/MainContent";
import { getUserInfo } from "@/services/users";

const Main = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token");
  const decodeJwt = (token: string) => {
    const parts = token.split(".");
    const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));

    return payload;
  };

  const handleGetUserInfo = async (token: RequestCookie) => {
    try {
      const response = await getUserInfo(token).then();
      console.log(response.data);
      const currentUser = {
        id: response.data.id,
        nickname: response.data.nickname,
        gender: response.data.gender,
        newNotification: response.data.newNotification,
        notifications: response.data.notifications,
        friends: response.data.friends,
      };
      return currentUser;
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  if (token === undefined) {
    console.log("토큰 없음!");
    redirect("/login");
  }
  const currentUser = await handleGetUserInfo(token);
  console.log(currentUser);

  const userInfo = decodeJwt(token.value);
  console.log(userInfo);

  return (
    <div>
      {token && currentUser ? (
        <MainContent userInfo={currentUser} />
      ) : (
        <div>Redirecting...</div>
      )}
    </div>
  );
};

export default Main;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MainContent from "@/containers/main/MainContent";

const Main = () => {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token");
  const decodeJwt = (token: string) => {
    const parts = token.split(".");
    const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));

    return payload;
  };

  if (token === undefined) {
    console.log("토큰 없음!");
    redirect("/login");
  }
  const userInfo = decodeJwt(token.value);
  console.log(userInfo);

  return (
    <div>
      {token ? (
        <MainContent nickname={userInfo.nickname} />
      ) : (
        <div>Redirecting...</div>
      )}
    </div>
  );
};

export default Main;

import axios from "axios";

interface CreateUser {
  id: string;
  nickname: string;
  password: string;
  gender: string;
}

interface LoginUser {
  id: string;
  password: string;
}

const authUrl = process.env.NEXT_PUBLIC_API_SERVER + "/auth";

const createUser = async (request: CreateUser) => {
  try {
    const response = await axios.post(`${authUrl}/signUp`, request);
    return response;
  } catch (error) {
    return error;
  }
};

const loginUser = async (request: LoginUser) => {
  try {
    const response = await axios.post(`${authUrl}/signIn`, request, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    return error;
  }
};

export { createUser, loginUser };

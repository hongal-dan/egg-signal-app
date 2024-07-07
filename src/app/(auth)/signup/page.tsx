"use client";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUser } from "@/services/auth";

interface FormValues {
  id: string;
  userName: string;
  gender: string;
  password: string;
  confirmPassword: string;
}

const validationSchema = Yup.object().shape({
  id: Yup.string()
    .min(4, "아이디는 최소 4자여야 합니다")
    .max(10, "아이디는 10자를 넘을 수 없습니다.")
    .required("아이디는 필수 항목입니다"),
  userName: Yup.string()
    .min(2, "닉네임은 최소 2자여야 합니다")
    .max(10, "닉네임은 10자를 넘을 수 없습니다.")
    .required("닉네임은 필수 항목입니다")
    .notOneOf(
      ["MALE", "FEMALE", "male", "female"],
      "사용할 수 없는 닉네임입니다.",
    ),
  password: Yup.string()
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,10}$/,
      "4~10자의 영문, 숫자를 조합해서 입력하세요",
    )
    .min(4, "비밀번호는 최소 4자 이상이어야 합니다.")
    .max(10, "비밀번호는 10자를 넘을 수 없습니다.")
    .required("비밀번호는 필수 항목입니다."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "비밀번호가 일치하지 않습니다")
    .required("비밀번호 확인은 필수 항목입니다."),
});

export default function Signup() {
  const router = useRouter();

  const initialValues: FormValues = {
    id: "",
    userName: "",
    gender: "MALE",
    password: "",
    confirmPassword: "",
  };

  const errorStyle = "text-red-500 text-sm font-medium mt-1 ml-2";

  const handleSignUp = async (values: FormValues) => {
    const request = {
      id: values.id,
      nickname: values.userName,
      password: values.password,
      gender: values.gender,
    };
    try {
      const response = (await createUser(request)) as Response;
      console.log(response);
      if (response.status) {
        router.push("/login");
      } else if (response.status === 500) {
        alert("중복된 아이디 입니다.");
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  return (
    <div className="flex items-center justify-center px-6 py-8 mx-auto md:h-screen">
      <div className="w-1/2 p-5 px-[120px] bg-amber-50 rounded-2xl shadow">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <p className="text-4xl text-center font-bold">Sign up</p>
        </div>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            handleSignUp(values);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4 md:space-y-6">
              <div>
                <label>사용할 ID</label>
                <Field
                  name="id"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage
                  className={`error ${errorStyle}`}
                  component="p"
                  name="id"
                />
              </div>
              <div>
                <label>Username</label>
                <Field
                  name="userName"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage
                  className={`error ${errorStyle}`}
                  component="p"
                  name="userName"
                />
              </div>
              <div>
                <label>Gender</label>
                <Field name="gender" as="select" className="ml-5">
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </Field>
              </div>
              <div>
                <label>Password</label>
                <Field
                  name="password"
                  type="password"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage
                  className={`error ${errorStyle}`}
                  component="p"
                  name="password"
                />
              </div>
              <div>
                <label>Password Confirm</label>
                <Field
                  name="confirmPassword"
                  type="password"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage
                  className={`error ${errorStyle}`}
                  component="p"
                  name="confirmPassword"
                />
              </div>

              <div className="w-full flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-64 text-white bg-amber-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  Sign up
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

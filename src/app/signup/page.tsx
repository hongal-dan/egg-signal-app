"use client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

interface FormValues {
  id: string;
  userName: string;
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
    .required("닉네임은 필수 항목입니다"),
  password: Yup.string()
    .min(4, "비밀번호는 최소 4자 이상이어야 합니다.")
    .max(10, "비밀번호는 10자를 넘을 수 없습니다.")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/,
      "4~10자의 영문, 숫자를 조합해서 입력하세요"
    )
    .required("비밀번호는 필수 항목입니다."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "비밀번호가 일치하지 않습니다")
    .required("비밀번호 확인은 필수 항목입니다."),
});

export default function Signup() {
  const initialValues: FormValues = {
    id: "",
    userName: "",
    password: "",
    confirmPassword: "",
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
            console.log(values);
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
                <ErrorMessage className="error" name="id" />
              </div>
              <div>
                <label>Username</label>
                <Field
                  name="userName"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage className="error" name="userName" />
              </div>
              <div>
                <label>Password</label>
                <Field
                  name="password"
                  type="password"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage className="error" name="password" />
              </div>
              <div>
                <label>Password Confirm</label>
                <Field
                  name="confirmPassword"
                  type="password"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage className="error" name="confirmPassword" />
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

"use client";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { loginUser } from "@/services/auth";

interface FormValues {
  id: string;
  password: string;
}

const validationSchema = Yup.object().shape({
  id: Yup.string()
    .min(4, "아이디는 최소 4자여야 합니다")
    .max(10, "아이디는 10자를 넘을 수 없습니다.")
    .required("아이디는 필수 항목입니다")
    .required("아이디를 입력하세요."),
  password: Yup.string()
    .min(4, "비밀번호는 최소 4자 이상이어야 합니다.")
    .max(10, "비밀번호는 10자를 넘을 수 없습니다.")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/,
      "4~10자의 영문, 숫자 조합만 입력하세요",
    )
    .required("비밀번호를 입력하세요."),
});

export default function Login() {
  const router = useRouter();

  const initialValues: FormValues = {
    id: "",
    password: "",
  };

  const handleLogIn = async (values: FormValues) => {
    try {
      await loginUser(values);
      router.replace("/main");
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  return (
    <div className="flex items-center justify-center px-6 py-8 mx-auto md:h-screen">
      <div className="w-1/2 p-5 px-[120px] bg-amber-50 rounded-2xl shadow">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <p className="text-4xl text-center font-bold">Welcom to Egg Chat!</p>
        </div>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            handleLogIn(values);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4 md:space-y-6">
              <div>
                <label>ID</label>
                <Field
                  name="id"
                  className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                />
                <ErrorMessage className="error" name="id" />
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

              <div className="w-full flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-64 text-white bg-amber-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  Log in
                </button>
              </div>
            </Form>
          )}
        </Formik>
        <div className="w-full flex justify-end">
          <button
            className="text-primary-600 hover:underline"
            onClick={() => router.push("/signup")}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { loginUserHeader } from "@/services/auth";
import Swal from "sweetalert2";

interface FormValues {
  id: string;
  password: string;
}

const validationSchema = Yup.object().shape({
  id: Yup.string().required("아이디를 입력하세요."),
  password: Yup.string().required("비밀번호를 입력하세요."),
});

const Login = () => {
  const router = useRouter();

  const initialValues: FormValues = {
    id: "",
    password: "",
  };

  const errorStyle = "text-red-500 text-sm font-medium mt-1 ml-2";

  const handleLogIn = async (values: FormValues) => {
    try {
      const response = (await loginUserHeader(values)) as Response;
      if (response.status == 200) {
        router.replace("/main");
      } else if ((response as any).response.data.statusCode === 401) {
        Swal.fire({
          icon: "warning",
          title: "아이디 또는 비밀번호가 틀립니다",
        });
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  return (
    <div className="flex items-center justify-center px-6 py-8 mx-auto h-full w-full max-w-[1200px]">
      <div className="w-1/2 p-5 px-20 bg-amber-50 rounded-2xl custom-shadow min-w-[500px]">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <p className="text-4xl text-center">에그 챗</p>
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
                <label>아이디</label>
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
                <label>비밀번호</label>
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

              <div className="w-full flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-64  bg-amber-400 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-lg px-5 py-2.5 text-center custom-shadow mt-4"
                >
                  로그인
                </button>
              </div>
            </Form>
          )}
        </Formik>
        <div className="w-full flex justify-end mt-4">
          <button
            className="text-primary-600 underline"
            onClick={() => router.push("/signup")}
          >
            회원 가입
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

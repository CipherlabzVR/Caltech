import ForgotPasswordForm from "@/components/Authentication/ForgotPasswordForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ForgotPassword() {
  return (
    <>
      <ToastContainer />
      <ForgotPasswordForm />
    </>
  );
}

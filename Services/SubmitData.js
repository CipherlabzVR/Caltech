import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export const CreateCustomer = async (values) => {
  try {
    const response = await fetch(`${BASE_URL}/Customer/CreateCustomer`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: getHeaders(),
    });

    const data = await response.json();
    if (response.ok) {
      toast.success(data.message);
      return data.result.result;
    } else {
      toast.error(data.message);
      return data.result.result;
    }
  } catch (error) {
    toast.error(error.message || "Customer Creation failed. Please try again.");
  }
};

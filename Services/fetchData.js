import BASE_URL from "Base/api";


const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export const fetchCustomersList = async () => {
  const response = await fetch(`${BASE_URL}/Customer/GetAllCustomer`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch customers");
  }

  return await response.json();
};

export const fetchTitleList = async () => {
  const response = await fetch(`${BASE_URL}/Customer/GetAllPersonTitle`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch customers");
  }

  return await response.json();
};

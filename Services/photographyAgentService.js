import BASE_URL from "Base/api";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export const getAgentTypes = async () => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/GetAgentTypes`, {
    method: "GET",
    headers: getHeaders(),
  });
  return await response.json();
};

export const saveAgentType = async (payload) => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/SaveAgentType`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return await response.json();
};

export const deleteAgentType = async (id) => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/DeleteAgentType/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return await response.json();
};

export const getAllAgents = async () => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/GetAllAgents`, {
    method: "GET",
    headers: getHeaders(),
  });
  return await response.json();
};

export const getWhatsAppAccounts = async () => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/GetWhatsAppAccounts`, {
    method: "GET",
    headers: getHeaders(),
  });
  return await response.json();
};

export const saveAgent = async (payload) => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/SaveAgent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return await response.json();
};

export const deleteAgent = async (id) => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/DeleteAgent/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return await response.json();
};

export const getMappableUsers = async () => {
  const response = await fetch(`${BASE_URL}/PhotographyAgent/GetMappableUsers`, {
    method: "GET",
    headers: getHeaders(),
  });
  return await response.json();
};

export const isApiSuccess = (data) =>
  data?.statusCode === 200 || data?.statusCode === "SUCCESS";

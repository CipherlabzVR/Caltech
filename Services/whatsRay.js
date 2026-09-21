import BASE_URL from "Base/api";

// Every WhatsRay call is proxied by the ERP API so the client-id / client-secret pair
// stays on the server. Nothing in this module ever handles those credentials directly.
const request = async (path, { method = "GET", body, isForm = false } = {}) => {
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}/WhatsRay/${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  if (!data) {
    throw new Error(`WhatsApp service returned an unexpected response (HTTP ${response.status}).`);
  }

  return data;
};

export const getAccounts = () => request("GetAllAccounts");

export const getSendingAccounts = () => request("GetSendingAccounts");

export const getUserMappings = () => request("GetUserMappings");

export const getMappableUsers = () => request("GetMappableUsers");

export const saveUserMapping = (payload) =>
  request("SaveUserMapping", { method: "POST", body: payload });

export const DELETE_USER_MAPPING_CONTROLLER = "WhatsRay/DeleteUserMapping";

export const createAccount = (payload) =>
  request("CreateAccount", { method: "POST", body: payload });

export const updateAccount = (payload) =>
  request("UpdateAccount", { method: "POST", body: payload });

export const setDefaultAccount = (id) =>
  request(`SetDefaultAccount?id=${id}`, { method: "POST" });

export const testConnection = (id) =>
  request(`TestConnection?id=${id}`, { method: "POST" });

export const getRemoteNumbers = (id) => request(`GetRemoteNumbers?id=${id}`);

export const syncRemoteNumber = (id) =>
  request(`SyncRemoteNumber?id=${id}`, { method: "POST" });

export const getTemplates = (id, status = "approved") =>
  request(`GetTemplates?id=${id}&status=${encodeURIComponent(status)}`);

export const sendTemplateMessage = (payload) =>
  request("SendTemplateMessage", { method: "POST", body: payload });

export const sendMessage = (formData) =>
  request("SendMessage", { method: "POST", body: formData, isForm: true });

export const DELETE_ACCOUNT_CONTROLLER = "WhatsRay/DeleteAccount";

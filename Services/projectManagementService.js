import BASE_URL from "Base/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }

  if (payload?.statusCode !== 200) {
    throw new Error(payload?.message || "Action failed");
  }

  return payload.result;
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (value instanceof Date) {
      searchParams.append(key, value.toISOString());
      return;
    }
    searchParams.append(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const getDashboardSummary = async () => {
  const response = await fetch(`${BASE_URL}/ProjectManagementModule/dashboard`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const getProjects = async (filters = {}) => {
  const query = buildQueryString(filters);
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects${query}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getProjectDetails = async (projectId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const createProject = async (payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateProject = async (projectId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const deleteProject = async (projectId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/delete`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const updateProjectStatus = async (projectId, status) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/status`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }
  );
  return handleResponse(response);
};

export const assignProjectMembers = async (projectId, assignments) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/members`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ projectId, assignments }),
    }
  );
  return handleResponse(response);
};

export const createBoardColumn = async (projectId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/columns`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateBoardColumn = async (columnId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/columns/${columnId}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const reorderBoardColumns = async (projectId, columns) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/columns/reorder`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ projectId, columns }),
    }
  );
  return handleResponse(response);
};

export const deleteBoardColumn = async (columnId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/columns/${columnId}/delete`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getTeamMembers = async () => {
  const response = await fetch(`${BASE_URL}/ProjectManagementModule/team`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(response);
};

export const createTeamMember = async (payload) => {
  const response = await fetch(`${BASE_URL}/ProjectManagementModule/team`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateTeamMember = async (memberId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/team/${memberId}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const deleteTeamMember = async (memberId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/team/${memberId}/delete`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getTaskBoard = async (projectId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/tasks`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getTaskHistory = async ({ projectId, memberId, unassigned } = {}) => {
  const query = buildQueryString({
    projectId,
    memberId,
    unassigned: unassigned ? true : "",
  });
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/tasks/history${query}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const createTask = async (payload) => {
  const response = await fetch(`${BASE_URL}/ProjectManagementModule/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateTask = async (taskId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/tasks/${taskId}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const moveTask = async (taskId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/tasks/${taskId}/move`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const deleteTask = async (taskId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/tasks/${taskId}/delete`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const addChecklistItem = async (taskId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/tasks/${taskId}/checklist`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateChecklistItem = async (checklistItemId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/checklist/${checklistItemId}/update`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const deleteChecklistItem = async (checklistItemId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/checklist/${checklistItemId}/delete`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getTimeline = async (projectId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/timeline`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const createTimelineEntry = async (payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/timeline`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateTimelineEntry = async (entryId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/timeline/${entryId}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const deleteTimelineEntry = async (entryId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/timeline/${entryId}/delete`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getFinancialSummary = async (projectId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/financials/summary`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getAllFinancialSummary = async () => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/financials/summary`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getFinancialRecords = async (projectId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/projects/${projectId}/financials`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getAllFinancialRecords = async () => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/financials`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const createFinancialRecord = async (payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/financials`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateFinancialRecord = async (recordId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/financials/${recordId}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const deleteFinancialRecord = async (recordId) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/financials/${recordId}/delete`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  return handleResponse(response);
};

export const getReportData = async (payload) => {
  const response = await fetch(
    `${BASE_URL}/ProjectManagementModule/reports`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};


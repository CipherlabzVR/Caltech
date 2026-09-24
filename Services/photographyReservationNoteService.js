import BASE_URL from "Base/api";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const photographyReservationNoteService = {
  getCurrentUserAgentType: async () => {
    const response = await fetch(`${BASE_URL}/PhotographyReservationNote/GetCurrentUserAgentType`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  getNotes: async (reservationId) => {
    const response = await fetch(`${BASE_URL}/PhotographyReservationNote/GetNotes/${reservationId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  createNote: async (data) => {
    const response = await fetch(`${BASE_URL}/PhotographyReservationNote/CreateNote`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteNote: async (noteId) => {
    const response = await fetch(`${BASE_URL}/PhotographyReservationNote/DeleteNote/${noteId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return response.json();
  },

  handoverReservation: async (data) => {
    const response = await fetch(`${BASE_URL}/PhotographyReservationNote/Handover`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getHandoverHistory: async (reservationId) => {
    const response = await fetch(`${BASE_URL}/PhotographyReservationNote/GetHandoverHistory/${reservationId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return response.json();
  },

  updateFirstMeeting: async (data) => {
    const response = await fetch(`${BASE_URL}/PhotographyReservationNote/UpdateFirstMeeting`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

export default photographyReservationNoteService;

import { useCallback, useEffect, useState } from "react";
import BASE_URL from "Base/api";

const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem("token");

const request = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/AiAssistant/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "The assistant is not available right now.");
  }

  return payload;
};

/**
 * Owns conversation state for the assistant. The backend resolves the caller's
 * identity from the JWT, so nothing about the user is sent from here.
 */
const useAiAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = useCallback(async () => {
    try {
      const payload = await request("GetSessions");
      setSessions(payload?.result || []);
    } catch {
      setSessions([]);
    }
  }, []);

  const openSession = useCallback(async (id) => {
    setError(null);
    try {
      const payload = await request(`GetMessages?sessionId=${id}`);
      setSessionId(id);
      setMessages(
        (payload?.result || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          data: m.data,
          feedback: m.feedback,
        }))
      );
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const startNewSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setError(null);
  }, []);

  const deleteSession = useCallback(
    async (id) => {
      try {
        await request(`DeleteSession?sessionId=${id}`, { method: "DELETE" });
        if (id === sessionId) startNewSession();
        await loadSessions();
      } catch (e) {
        setError(e.message);
      }
    },
    [sessionId, startNewSession, loadSessions]
  );

  const sendMessage = useCallback(
    async (text, currentRoute) => {
      const question = (text || "").trim();
      if (!question || isSending) return;

      setError(null);
      setIsSending(true);
      setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: question }]);

      try {
        const payload = await request("Ask", {
          method: "POST",
          body: JSON.stringify({ sessionId, message: question, currentRoute }),
        });

        const result = payload?.result;
        if (result?.sessionId && result.sessionId !== sessionId) {
          setSessionId(result.sessionId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: result?.answer || "No answer was returned.",
            data: result?.data || null,
            citations: result?.citations || [],
          },
        ]);

        loadSessions();
      } catch (e) {
        setError(e.message);
        setMessages((prev) => [
          ...prev,
          { id: `error-${Date.now()}`, role: "assistant", content: e.message, isError: true },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, isSending, loadSessions]
  );

  const submitFeedback = useCallback(async (messageId, feedback) => {
    if (typeof messageId !== "number") return;
    try {
      await request("SubmitFeedback", {
        method: "POST",
        body: JSON.stringify({ messageId, feedback }),
      });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback } : m)));
    } catch {
      // Feedback is best-effort and never blocks the conversation.
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    messages,
    sessions,
    sessionId,
    isSending,
    error,
    sendMessage,
    openSession,
    startNewSession,
    deleteSession,
    submitFeedback,
    loadSessions,
  };
};

export default useAiAssistant;

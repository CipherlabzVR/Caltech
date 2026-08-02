import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Divider,
  IconButton,
  InputBase,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Tooltip,
  Typography,
  Zoom,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import HistoryIcon from "@mui/icons-material/History";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MessageBubble from "./MessageBubble";
import SuggestedPrompts from "./SuggestedPrompts";
import AssistantIcon from "./AssistantIcon";
import useAiAssistant from "./useAiAssistant";
import { getWelcomeMessage } from "./greeting";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const ChatWidget = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [historyAnchor, setHistoryAnchor] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const scrollRef = useRef(null);

  const { data: isAiAssistantEnabled } = IsAppSettingEnabled("IsAiAssistantEnabled");

  const {
    messages,
    sessions,
    isSending,
    sendMessage,
    openSession,
    startNewSession,
    deleteSession,
    submitFeedback,
  } = useAiAssistant();

  const hasToken = useMemo(
    () => (typeof window === "undefined" ? false : Boolean(localStorage.getItem("token"))),
    // Re-evaluated on route change so the widget disappears after logout.
    [router.pathname]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setWelcomeMessage(getWelcomeMessage());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAiAssistantEnabled === false) {
      setIsOpen(false);
    }
  }, [isAiAssistantEnabled]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "k" && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        if (isAiAssistantEnabled !== true) return;
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAiAssistantEnabled]);

  if (!hasToken || isAiAssistantEnabled !== true) return null;

  const submit = (text) => {
    const value = text ?? draft;
    if (!value.trim() || isSending) return;
    setDraft("");
    sendMessage(value, router.pathname);
  };

  return (
    <>
      <Zoom in={!isOpen}>
        <Box className="ai-assistant-launcher" onClick={() => setIsOpen(true)} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsOpen(true); }}
          title="Ctrl+Shift+K">
          <Box className="ai-assistant-float-icon">
            <AssistantIcon size={56} />
          </Box>
          <Box className="ai-assistant-speech">
            Ask me anything
            <span className="ai-assistant-speech-tail" />
          </Box>
        </Box>
      </Zoom>

      {isOpen && (
        <Box className="ai-assistant-panel">
          <Box className="ai-assistant-header">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box className="ai-assistant-header-icon">
                <AssistantIcon size={24} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>Ask me anything</Typography>
                <Typography sx={{ fontSize: 10.5, opacity: 0.75 }}>Read-only. Answers from your live data.</Typography>
              </Box>
            </Box>

            <Box>
              <Tooltip title="New conversation">
                <IconButton size="small" onClick={startNewSession} sx={{ color: "inherit" }}>
                  <AddCommentOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="History">
                <IconButton size="small" onClick={(e) => setHistoryAnchor(e.currentTarget)} sx={{ color: "inherit" }}>
                  <HistoryIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: "inherit" }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          <Menu anchorEl={historyAnchor} open={Boolean(historyAnchor)} onClose={() => setHistoryAnchor(null)}>
            <Typography sx={{ px: 2, py: 1, fontSize: 12, fontWeight: 700, opacity: 0.6 }}>
              Recent conversations
            </Typography>
            <List dense sx={{ maxHeight: 280, overflowY: "auto", minWidth: 260 }}>
              {sessions.length === 0 && (
                <Typography sx={{ px: 2, py: 1, fontSize: 12, opacity: 0.6 }}>Nothing yet.</Typography>
              )}
              {sessions.map((session) => (
                <ListItemButton
                  key={session.id}
                  onClick={() => {
                    openSession(session.id);
                    setHistoryAnchor(null);
                  }}
                >
                  <ListItemText
                    primary={session.title}
                    primaryTypographyProps={{ fontSize: 12.5, noWrap: true }}
                  />
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteSession(session.id);
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          </Menu>

          <Box className="ai-assistant-body" ref={scrollRef}>
            {messages.length === 0 ? (
              <>
                <MessageBubble
                  message={{
                    id: "greeting",
                    role: "assistant",
                    content: welcomeMessage || getWelcomeMessage(),
                  }}
                />
                <Box sx={{ textAlign: "center", pt: 1.5, px: 2, pb: 1 }}>
                  <Typography sx={{ fontSize: 12, opacity: 0.65 }}>
                    Ask about stock, sales, outstanding balances, invoices, or how to use a screen.
                  </Typography>
                </Box>
              </>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} onFeedback={submitFeedback} />
              ))
            )}
          </Box>

          {isSending && <LinearProgress sx={{ height: 2 }} />}

          {messages.length === 0 && <SuggestedPrompts currentRoute={router.pathname} onSelect={submit} />}

          <Divider />

          <Box className="ai-assistant-composer">
            <InputBase
              multiline
              maxRows={4}
              fullWidth
              placeholder="Ask a question..."
              value={draft}
              disabled={isSending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              sx={{ fontSize: 13.5 }}
            />
            <IconButton color="primary" disabled={isSending || !draft.trim()} onClick={() => submit()}>
              <SendIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
};

export default ChatWidget;

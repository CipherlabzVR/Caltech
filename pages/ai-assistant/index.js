import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Box,
  Card,
  Divider,
  IconButton,
  InputBase,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MessageBubble from "@/components/_App/AiAssistant/MessageBubble";
import SuggestedPrompts from "@/components/_App/AiAssistant/SuggestedPrompts";
import AssistantIcon from "@/components/_App/AiAssistant/AssistantIcon";
import useAiAssistant from "@/components/_App/AiAssistant/useAiAssistant";
import { getWelcomeMessage } from "@/components/_App/AiAssistant/greeting";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const AiAssistantPage = () => {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const scrollRef = useRef(null);

  const { data: isAiAssistantEnabled } = IsAppSettingEnabled("IsAiAssistantEnabled");

  const {
    messages,
    sessions,
    sessionId,
    isSending,
    sendMessage,
    openSession,
    startNewSession,
    deleteSession,
    submitFeedback,
  } = useAiAssistant();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    setWelcomeMessage(getWelcomeMessage());
  }, []);

  if (isAiAssistantEnabled === false) {
    return (
      <>
        <Head>
          <title>Ask me anything</title>
        </Head>
        <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
          <AssistantIcon size={72} sx={{ mx: "auto", opacity: 0.5 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 2 }}>
            AI Assistant is disabled
          </Typography>
          <Typography sx={{ fontSize: 13.5, opacity: 0.7, mt: 1 }}>
            An administrator can enable it under Administrator → Settings → IsAiAssistantEnabled.
          </Typography>
        </Box>
      </>
    );
  }

  const submit = (text) => {
    const value = text ?? draft;
    if (!value.trim() || isSending) return;
    setDraft("");
    sendMessage(value, router.pathname);
  };

  return (
    <>
      <Head>
        <title>Ask me anything</title>
      </Head>

      <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 190px)", minHeight: 480 }}>
        <Card sx={{ width: 260, display: { xs: "none", md: "flex" }, flexDirection: "column", p: 1.5 }}>
          <Button fullWidth variant="outlined" startIcon={<AddCommentOutlinedIcon />} onClick={startNewSession}>
            New conversation
          </Button>

          <Typography sx={{ fontSize: 12, fontWeight: 700, opacity: 0.6, mt: 2, mb: 0.5, px: 1 }}>
            Recent
          </Typography>

          <List dense sx={{ overflowY: "auto", flex: 1 }}>
            {sessions.length === 0 && (
              <Typography sx={{ px: 1, fontSize: 12, opacity: 0.6 }}>Nothing yet.</Typography>
            )}
            {sessions.map((session) => (
              <ListItemButton
                key={session.id}
                selected={session.id === sessionId}
                onClick={() => openSession(session.id)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary={session.title} primaryTypographyProps={{ fontSize: 12.5, noWrap: true }} />
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
        </Card>

        <Card sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5 }}>
            <AssistantIcon size={32} />
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Ask me anything</Typography>
              <Typography sx={{ fontSize: 11.5, opacity: 0.7 }}>
                Read-only. Answers come from your live data and the user guide, within your permissions.
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: 2, background: "#f7f8fc" }}>
            {messages.length === 0 ? (
              <>
                <MessageBubble
                  message={{
                    id: "greeting",
                    role: "assistant",
                    content: welcomeMessage || getWelcomeMessage(),
                  }}
                />
                <Box sx={{ textAlign: "center", pt: 2, px: 2 }}>
                  <Typography sx={{ fontSize: 13, opacity: 0.65 }}>
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

          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, p: 1.5 }}>
            <InputBase
              multiline
              maxRows={6}
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
              sx={{ fontSize: 14 }}
            />
            <IconButton color="primary" disabled={isSending || !draft.trim()} onClick={() => submit()}>
              <SendIcon />
            </IconButton>
          </Box>
        </Card>
      </Box>
    </>
  );
};

export default AiAssistantPage;

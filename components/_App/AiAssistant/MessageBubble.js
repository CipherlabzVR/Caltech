import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DataTableBlock from "./DataTableBlock";
import AssistantIcon from "./AssistantIcon";

/** Minimal markdown rendering: headings, bold, inline code and bullets. */
const renderContent = (content) =>
  String(content || "")
    .split("\n")
    .map((line, index) => {
      const key = `line-${index}`;

      if (!line.trim()) return <Box key={key} sx={{ height: 6 }} />;

      const formatted = line
        .replace(/^#{2,3}\s*/, "")
        .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        .map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={partIndex} className="ai-assistant-code">
                {part.slice(1, -1)}
              </code>
            );
          }
          return <React.Fragment key={partIndex}>{part}</React.Fragment>;
        });

      const isHeading = /^#{2,3}\s/.test(line);
      const isBullet = /^\s*[-*]\s/.test(line);

      return (
        <Typography
          key={key}
          component="div"
          sx={{
            fontSize: isHeading ? 14 : 13.5,
            fontWeight: isHeading ? 700 : 400,
            lineHeight: 1.6,
            pl: isBullet ? 1.5 : 0,
          }}
        >
          {formatted}
        </Typography>
      );
    });

const MessageBubble = ({ message, onFeedback }) => {
  const isUser = message.role === "user";

  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", mb: 1.5 }}>
      {!isUser && (
        <Box className="ai-assistant-avatar">
          <AssistantIcon size={20} />
        </Box>
      )}

      <Box className={`ai-assistant-bubble ${isUser ? "is-user" : "is-assistant"} ${message.isError ? "is-error" : ""}`}>
        {renderContent(message.content)}

        {message.data && <DataTableBlock data={message.data} />}

        {!isUser && !message.isError && typeof message.id === "number" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mt: 0.5, opacity: 0.6 }}>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => navigator.clipboard?.writeText(message.content)}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Helpful">
              <IconButton
                size="small"
                color={message.feedback === 1 ? "primary" : "default"}
                onClick={() => onFeedback?.(message.id, 1)}
              >
                <ThumbUpOffAltIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Not helpful">
              <IconButton
                size="small"
                color={message.feedback === -1 ? "error" : "default"}
                onClick={() => onFeedback?.(message.id, -1)}
              >
                <ThumbDownOffAltIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>

            {message.citations?.length > 0 && (
              <Typography sx={{ fontSize: 10.5, ml: 0.5 }}>
                source: {message.citations.map((c) => c.name).join(", ")}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageBubble;

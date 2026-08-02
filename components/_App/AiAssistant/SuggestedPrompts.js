import React from "react";
import { Box, Chip, Typography } from "@mui/material";

const ROUTE_PROMPTS = [
  { match: /inventory|stock/i, prompts: ["Which items are below reorder level?", "What is the stock of my top item?"] },
  { match: /sales|invoice|pos/i, prompts: ["What were total sales last month?", "Who are my top 5 customers this year?"] },
  { match: /finance|payment|outstanding/i, prompts: ["Show me aged receivables", "How much do we owe suppliers?"] },
  { match: /help-desk/i, prompts: ["How many tickets are still open?", "How do I create a ticket?"] },
  { match: /service/i, prompts: ["How do I create a job card?", "What is the status of job card JC-001?"] },
];

const DEFAULT_PROMPTS = [
  "What were total sales this month?",
  "What is the total customer outstanding?",
  "Which items are below reorder level?",
  "How do I create a GRN?",
];

const SuggestedPrompts = ({ currentRoute, onSelect }) => {
  const matched = ROUTE_PROMPTS.find((entry) => entry.match.test(currentRoute || ""));
  const prompts = matched ? [...matched.prompts, "How do I use this screen?"] : DEFAULT_PROMPTS;

  return (
    <Box sx={{ px: 2, pb: 1 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1, opacity: 0.7 }}>Try asking</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {prompts.map((prompt) => (
          <Chip
            key={prompt}
            label={prompt}
            size="small"
            variant="outlined"
            onClick={() => onSelect(prompt)}
            sx={{ fontSize: 11.5, cursor: "pointer" }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SuggestedPrompts;

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Box, Typography, Stack, Chip } from "@mui/material";

const COLORS = {
  completed: "#10b981", // green
  started: "#3b82f6", // blue
  ongoing: "#f59e0b", // amber
  hold: "#ef4444", // red
};

const ProjectTaskPieChart = ({ taskCounts = {} }) => {
  const { completed = 0, started = 0, ongoing = 0, hold = 0 } = taskCounts;
  const total = completed + started + ongoing + hold;

  const data = [
    { name: "Completed", value: completed, color: COLORS.completed },
    { name: "Started", value: started, color: COLORS.started },
    { name: "Ongoing", value: ongoing, color: COLORS.ongoing },
    { name: "Hold", value: hold, color: COLORS.hold },
  ].filter((item) => item.value > 0); // Only show segments with tasks

  if (total === 0) {
    return (
      <Box
        sx={{
          width: "100%",
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: (theme) => `1px dashed ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No tasks
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ position: "relative", width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {total}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tasks
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
        {data.map((entry) => (
          <Chip
            key={entry.name}
            label={`${entry.name}: ${entry.value}`}
            size="small"
            sx={{
              bgcolor: entry.color,
              color: "white",
              fontSize: "0.65rem",
              height: 20,
              "& .MuiChip-label": {
                px: 0.75,
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default ProjectTaskPieChart;


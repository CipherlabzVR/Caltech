import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import NotificationsIcon from "@mui/icons-material/Notifications";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const SystemNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "info",
      title: "System Update",
      message: "Scheduled maintenance on Nov 10, 2025 at 2:00 AM",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "warning",
      title: "High Ticket Volume",
      message: "Ticket volume increased by 25% today",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "success",
      title: "Performance Milestone",
      message: "Average resolution time improved by 15% this week",
      time: "1 day ago",
    },
  ]);

  const getIcon = (type) => {
    switch (type) {
      case "warning":
        return <WarningIcon sx={{ color: "#F59E0B" }} />;
      case "success":
        return <CheckCircleIcon sx={{ color: "#10B981" }} />;
      default:
        return <InfoIcon sx={{ color: "#2563EB" }} />;
    }
  };

  const getChipColor = (type) => {
    switch (type) {
      case "warning":
        return "warning";
      case "success":
        return "success";
      default:
        return "info";
    }
  };

  return (
    <Card
      sx={{
        bgcolor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <NotificationsIcon sx={{ color: "#2563EB" }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              fontSize: "1.125rem",
              letterSpacing: "-0.01em",
            }}
          >
            System Notifications
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          {notifications.map((notification, index) => (
            <ListItem
              key={notification.id}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: index < notifications.length - 1 ? "1px solid #F3F4F6" : "none",
                "&:hover": {
                  bgcolor: "#F9FAFB",
                  borderRadius: 1,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{getIcon(notification.type)}</ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                      {notification.title}
                    </Typography>
                    <Chip
                      label={notification.type}
                      size="small"
                      color={getChipColor(notification.type)}
                      sx={{ height: 20, fontSize: "0.6875rem", textTransform: "capitalize" }}
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="caption" sx={{ color: "#6B7280", display: "block" }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.75rem" }}>
                      {notification.time}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
        {notifications.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
              No notifications
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemNotifications;


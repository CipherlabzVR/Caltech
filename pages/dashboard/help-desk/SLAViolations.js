import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import BASE_URL from "Base/api";
import Link from "next/link";

const SLAViolations = () => {
  const [violations, setViolations] = useState({
    dueSoon: [],
    violated: [],
  });

  const fetchSLAViolations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetAllTickets?SkipCount=0&MaxResultCount=10000&Search=null`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      if (result.result?.items) {
        const tickets = result.result.items;
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const dueSoon = [];
        const violated = [];

        tickets.forEach((ticket) => {
          if (ticket.dueDate && (ticket.status === 1 || ticket.status === 2)) {
            const dueDate = new Date(ticket.dueDate);
            const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

            if (hoursUntilDue < 0) {
              violated.push(ticket);
            } else if (hoursUntilDue <= 2) {
              dueSoon.push(ticket);
            }
          }
        });

        setViolations({
          dueSoon: dueSoon.slice(0, 5),
          violated: violated.slice(0, 5),
        });
      }
    } catch (error) {
      console.error("Error fetching SLA violations:", error);
    }
  };

  useEffect(() => {
    fetchSLAViolations();
    const interval = setInterval(fetchSLAViolations, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 4:
        return "error";
      case 3:
        return "warning";
      default:
        return "default";
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
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "#111827",
            fontSize: "1.125rem",
            letterSpacing: "-0.01em",
          }}
        >
          SLA Violations
        </Typography>

        {violations.violated.length > 0 && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{
              mb: 2,
              bgcolor: "#FEF2F2",
              border: "1px solid #FEE2E2",
              "& .MuiAlert-icon": {
                color: "#DC2626",
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600, color: "#991B1B" }}>
              {violations.violated.length} Ticket{violations.violated.length !== 1 ? "s" : ""} Violated SLA Today
            </AlertTitle>
            <List dense sx={{ mt: 1 }}>
              {violations.violated.map((ticket) => (
                <ListItem
                  key={ticket.id}
                  sx={{
                    px: 0,
                    py: 0.5,
                    "&:hover": { bgcolor: "rgba(220, 38, 38, 0.05)" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Link
                        href={`/help-desk/tickets?ticket=${ticket.id}`}
                        style={{ textDecoration: "none", color: "#DC2626", fontWeight: 500 }}
                      >
                        {ticket.ticketNumber} - {ticket.subject}
                      </Link>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Chip
                          label={`Priority: ${ticket.priority === 4 ? "Critical" : ticket.priority === 3 ? "High" : "Medium"}`}
                          size="small"
                          color={getPriorityColor(ticket.priority)}
                          sx={{ height: 20, fontSize: "0.6875rem" }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {violations.dueSoon.length > 0 && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              bgcolor: "#FFFBEB",
              border: "1px solid #FEF3C7",
              "& .MuiAlert-icon": {
                color: "#D97706",
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600, color: "#92400E" }}>
              {violations.dueSoon.length} Ticket{violations.dueSoon.length !== 1 ? "s" : ""} Due Within 2 Hours
            </AlertTitle>
            <List dense sx={{ mt: 1 }}>
              {violations.dueSoon.map((ticket) => (
                <ListItem
                  key={ticket.id}
                  sx={{
                    px: 0,
                    py: 0.5,
                    "&:hover": { bgcolor: "rgba(217, 119, 6, 0.05)" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Link
                        href={`/help-desk/tickets?ticket=${ticket.id}`}
                        style={{ textDecoration: "none", color: "#D97706", fontWeight: 500 }}
                      >
                        {ticket.ticketNumber} - {ticket.subject}
                      </Link>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Chip
                          label={`Priority: ${ticket.priority === 4 ? "Critical" : ticket.priority === 3 ? "High" : "Medium"}`}
                          size="small"
                          color={getPriorityColor(ticket.priority)}
                          sx={{ height: 20, fontSize: "0.6875rem" }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {violations.dueSoon.length === 0 && violations.violated.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
              No SLA violations at this time
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SLAViolations;


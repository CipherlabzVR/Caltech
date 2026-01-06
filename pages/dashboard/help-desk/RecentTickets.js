import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import { useTheme, useMediaQuery } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

const getPriorityColor = (priority) => {
  switch (priority) {
    case 1:
      return { bg: "#DBEAFE", text: "#1E40AF" };
    case 2:
      return { bg: "#FEF3C7", text: "#92400E" };
    case 3:
      return { bg: "#FEE2E2", text: "#991B1B" };
    case 4:
      return { bg: "#FECACA", text: "#7F1D1D" };
    default:
      return { bg: "#F3F4F6", text: "#374151" };
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 1:
      return { bg: "#DBEAFE", text: "#1E40AF" };
    case 2:
      return { bg: "#FEF3C7", text: "#92400E" };
    case 3:
      return { bg: "#D1FAE5", text: "#065F46" };
    case 4:
      return { bg: "#F3F4F6", text: "#374151" };
    case 5:
      return { bg: "#FEE2E2", text: "#991B1B" };
    default:
      return { bg: "#F3F4F6", text: "#374151" };
  }
};

const getStatusName = (status) => {
  switch (status) {
    case 1:
      return "Open";
    case 2:
      return "In Progress";
    case 3:
      return "Resolved";
    case 4:
      return "Closed";
    case 5:
      return "On Hold";
    default:
      return "Unknown";
  }
};

const getPriorityName = (priority) => {
  switch (priority) {
    case 1:
      return "Low";
    case 2:
      return "Medium";
    case 3:
      return "High";
    case 4:
      return "Critical";
    default:
      return "Unknown";
  }
};

const RecentTickets = () => {
  const [tickets, setTickets] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const fetchRecentTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetRecentTickets?count=10`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      if (result.result && result.result.items) {
        setTickets(result.result.items);
      }
    } catch (error) {
      console.error("Error fetching recent tickets:", error);
      setTickets([]);
    }
  };

  useEffect(() => {
    fetchRecentTickets();
  }, []);

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              fontSize: "1.125rem",
              letterSpacing: "-0.01em",
            }}
          >
            Recent Tickets
          </Typography>
        }
        action={
          <Link href="/help-desk/tickets" style={{ textDecoration: "none" }}>
            <IconButton
              size="small"
              sx={{
                color: "#2563EB",
                "&:hover": { bgcolor: "#EFF6FF" },
              }}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Link>
        }
        sx={{ pb: 2, px: 3, pt: 3 }}
      />
      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
        <TableContainer>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Ticket #
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Subject
                </TableCell>
                {!isMobile && (
                  <>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        color: "#374151",
                        borderBottom: "1px solid #E5E7EB",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        py: 1.5,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        color: "#374151",
                        borderBottom: "1px solid #E5E7EB",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        py: 1.5,
                      }}
                    >
                      Priority
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        color: "#374151",
                        borderBottom: "1px solid #E5E7EB",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        py: 1.5,
                      }}
                    >
                      Assigned To
                    </TableCell>
                  </>
                )}
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        color: "#374151",
                        borderBottom: "1px solid #E5E7EB",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        py: 1.5,
                      }}
                    >
                      Created
                    </TableCell>
                    {!isMobile && (
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          color: "#374151",
                          borderBottom: "1px solid #E5E7EB",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          py: 1.5,
                        }}
                      >
                        SLA Due
                      </TableCell>
                    )}
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isMobile ? 3 : 7}
                    align="center"
                    sx={{ py: 6, borderBottom: "none" }}
                  >
                    <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                      No recent tickets
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket, index) => (
                  <TableRow
                    key={ticket.id}
                    sx={{
                      "&:hover": {
                        bgcolor: "#F9FAFB",
                        cursor: "pointer",
                      },
                      borderBottom: index < tickets.length - 1 ? "1px solid #F3F4F6" : "none",
                    }}
                  >
                    <TableCell sx={{ fontSize: "0.875rem", color: "#111827", py: 2 }}>
                      <Link
                        href={`/help-desk/tickets?ticket=${ticket.id}`}
                        style={{ textDecoration: "none", color: "#2563EB", fontWeight: 500 }}
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.875rem", color: "#111827", py: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: { xs: 150, md: 200 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        {ticket.subject}
                      </Typography>
                      {isMobile && (
                        <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
                          <Chip
                            label={getStatusName(ticket.status)}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(ticket.status).bg,
                              color: getStatusColor(ticket.status).text,
                              fontWeight: 500,
                              height: 22,
                              fontSize: "0.6875rem",
                            }}
                          />
                          <Chip
                            label={getPriorityName(ticket.priority)}
                            size="small"
                            sx={{
                              bgcolor: getPriorityColor(ticket.priority).bg,
                              color: getPriorityColor(ticket.priority).text,
                              fontWeight: 500,
                              height: 22,
                              fontSize: "0.6875rem",
                            }}
                          />
                        </Box>
                      )}
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={getStatusName(ticket.status)}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(ticket.status).bg,
                              color: getStatusColor(ticket.status).text,
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              height: 24,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={getPriorityName(ticket.priority)}
                            size="small"
                            sx={{
                              bgcolor: getPriorityColor(ticket.priority).bg,
                              color: getPriorityColor(ticket.priority).text,
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              height: 24,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: "#DBEAFE",
                                color: "#1E40AF",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              {ticket.assignedToUser?.firstName?.[0] || "U"}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "#111827", fontWeight: 500 }}>
                              {ticket.assignedToUser
                                ? `${ticket.assignedToUser.firstName || ""} ${ticket.assignedToUser.lastName || ""}`.trim() ||
                                  ticket.assignedToUser.email ||
                                  "Unassigned"
                                : "Unassigned"}
                            </Typography>
                          </Box>
                        </TableCell>
                      </>
                    )}
                    <TableCell sx={{ fontSize: "0.875rem", color: "#6B7280", py: 2 }}>
                      {formatDate(ticket.createdOn)}
                    </TableCell>
                    {!isMobile && (
                      <TableCell sx={{ fontSize: "0.875rem", py: 2 }}>
                        {ticket.dueDate ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: new Date(ticket.dueDate) < new Date() ? "#DC2626" : "#6B7280",
                              fontWeight: new Date(ticket.dueDate) < new Date() ? 600 : 400,
                            }}
                          >
                            {formatDate(ticket.dueDate)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RecentTickets;

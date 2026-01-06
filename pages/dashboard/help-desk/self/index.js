import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import styles from "@/styles/PageTitle.module.css";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import dynamic from "next/dynamic";

// Dynamically import ViewTicketModal to avoid SSR issues
const ViewTicketModal = dynamic(() => import("../../../help-desk/tickets/view"), { ssr: false });
import {
  Assignment,
  CheckCircle,
  Pending,
  Warning,
  AccessTime,
  DoneAll,
  HourglassEmpty,
  Person,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import { formatDate } from "@/components/utils/formatHelper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import { useRouter } from "next/router";

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

export default function HelpDeskSelfDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    onHoldTickets: 0,
    averageResponseTime: 0,
    averageResolutionTime: 0,
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Check if user is HelpDeskSupport (UserType 14) - check outside useEffect
  const userType = typeof window !== "undefined" ? localStorage.getItem("type") : null;
  const isHelpDeskSupport = userType === "14" || userType === 14;

  // Set category for permission check - HelpDeskDashboard = 107
  const cId = typeof window !== "undefined" ? (sessionStorage.getItem("category") || "107") : "107";
  const { navigate } = IsPermissionEnabled(cId);

  useEffect(() => {
    sessionStorage.setItem("category", "107"); // HelpDeskDashboard category ID

    if (!isHelpDeskSupport) {
      // Redirect to main dashboard if not HelpDeskSupport
      router.push("/dashboard/main");
      return;
    }
  }, [router, isHelpDeskSupport]);

  // Bypass permission check for HelpDeskSupport users
  if (!isHelpDeskSupport) {
    return null; // Will redirect in useEffect
  }

  // For HelpDeskSupport users, always allow access regardless of permission check
  // The backend will handle the actual authorization

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const [statsResponse, ticketsResponse] = await Promise.all([
          fetch(`${BASE_URL}/HelpDesk/GetSelfDashboardStats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/HelpDesk/GetMyRecentTickets?count=10`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.result) {
            setStats(statsData.result);
          }
        }

        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          const tickets = ticketsData.result?.items || ticketsData.result || [];
          setRecentTickets(Array.isArray(tickets) ? tickets : []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: "Total Tickets",
      value: stats.totalTickets,
      icon: <Assignment sx={{ fontSize: 32, color: "#3B82F6" }} />,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
    },
    {
      title: "Open",
      value: stats.openTickets,
      icon: <HourglassEmpty sx={{ fontSize: 32, color: "#2196F3" }} />,
      color: "#2196F3",
      bgColor: "#E3F2FD",
    },
    {
      title: "In Progress",
      value: stats.inProgressTickets,
      icon: <Pending sx={{ fontSize: 32, color: "#FF9800" }} />,
      color: "#FF9800",
      bgColor: "#FFF3E0",
    },
    {
      title: "Resolved",
      value: stats.resolvedTickets,
      icon: <CheckCircle sx={{ fontSize: 32, color: "#4CAF50" }} />,
      color: "#4CAF50",
      bgColor: "#E8F5E9",
    },
    {
      title: "Closed",
      value: stats.closedTickets,
      icon: <DoneAll sx={{ fontSize: 32, color: "#9E9E9E" }} />,
      color: "#9E9E9E",
      bgColor: "#F5F5F5",
    },
    {
      title: "On Hold",
      value: stats.onHoldTickets,
      icon: <Warning sx={{ fontSize: 32, color: "#F44336" }} />,
      color: "#F44336",
      bgColor: "#FFEBEE",
    },
    {
      title: "Avg Response Time",
      value: `${stats.averageResponseTime}h`,
      icon: <AccessTime sx={{ fontSize: 32, color: "#9C27B0" }} />,
      color: "#9C27B0",
      bgColor: "#F3E5F5",
    },
    {
      title: "Avg Resolution Time",
      value: `${stats.averageResolutionTime}h`,
      icon: <AccessTime sx={{ fontSize: 32, color: "#673AB7" }} />,
      color: "#673AB7",
      bgColor: "#EDE7F6",
    },
  ];

  return (
    <Box sx={{ bgcolor: "#F9FAFB", minHeight: "100vh", pb: 4 }}>
      <div className={styles.pageTitle}>
        <h1>My Help Desk Dashboard</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>My Help Desk Dashboard</li>
        </ul>
      </div>

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 3 }}>
        {/* KPI Summary Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            My Ticket Statistics
          </Typography>
          {loading ? (
            <Typography color="text.secondary">Loading statistics...</Typography>
          ) : (
            <Grid container spacing={3}>
              {statCards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card
                    sx={{
                      bgcolor: "white",
                      borderRadius: 2,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#6B7280",
                              fontSize: "0.875rem",
                              mb: 1,
                            }}
                          >
                            {card.title}
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 700,
                              color: card.color,
                              fontSize: { xs: "1.5rem", md: "2rem" },
                            }}
                          >
                            {card.value}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            bgcolor: card.bgColor,
                            borderRadius: 2,
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {card.icon}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Recent Tickets */}
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            My Recent Tickets
          </Typography>
          <Card
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              {loading ? (
                <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
                  Loading tickets...
                </Typography>
              ) : recentTickets.length === 0 ? (
                <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
                  No tickets found
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Ticket Number</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Created On</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTickets.map((ticket) => {
                        const statusColor = getStatusColor(ticket.status);
                        const priorityColor = getPriorityColor(ticket.priority);
                        return (
                          <TableRow key={ticket.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {ticket.ticketNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 300,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ticket.subject}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {ticket.categoryName || ticket.category?.name || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusName(ticket.status)}
                                size="small"
                                sx={{
                                  bgcolor: statusColor.bg,
                                  color: statusColor.text,
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getPriorityName(ticket.priority)}
                                size="small"
                                sx={{
                                  bgcolor: priorityColor.bg,
                                  color: priorityColor.text,
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {ticket.createdOn ? formatDate(ticket.createdOn) : "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setViewModalOpen(true);
                                }}
                                sx={{
                                  color: "#3B82F6",
                                  cursor: "pointer",
                                  "&:hover": {
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                View
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* View Ticket Modal */}
      {selectedTicket && (
        <ViewTicketModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
          fetchItems={async () => {
            // Refresh tickets when modal closes
            const token = localStorage.getItem("token");
            try {
              const ticketsResponse = await fetch(`${BASE_URL}/HelpDesk/GetMyRecentTickets?count=10`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (ticketsResponse.ok) {
                const ticketsData = await ticketsResponse.json();
                const tickets = ticketsData.result?.items || ticketsData.result || [];
                setRecentTickets(Array.isArray(tickets) ? tickets : []);
              }
            } catch (error) {
              console.error("Error refreshing tickets:", error);
            }
          }}
        />
      )}
    </Box>
  );
}


import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import BASE_URL from "Base/api";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";

const UpcomingReservations = ({ startDate, endDate }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUpcomingReservations = async (start, end) => {
    if (!start || !end) {
      console.warn("UpcomingReservations: Missing startDate or endDate");
      return;
    }

    setLoading(true);
    try {
      let startDateFormatted = start;
      let endDateFormatted = end;
      
      if (typeof start === 'string' && start.includes('T')) {
        startDateFormatted = new Date(start).toISOString().split('T')[0];
      } else if (start && !start.match(/^\d{4}-\d{2}-\d{2}$/)) {
        startDateFormatted = new Date(start).toISOString().split('T')[0];
      }
      
      if (typeof end === 'string' && end.includes('T')) {
        endDateFormatted = new Date(end).toISOString().split('T')[0];
      } else if (end && !end.match(/^\d{4}-\d{2}-\d{2}$/)) {
        endDateFormatted = new Date(end).toISOString().split('T')[0];
      }
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${BASE_URL}/Dashboard/GetUpcomingReservationsByDateRange?startDate=${encodeURIComponent(startDateFormatted)}&endDate=${encodeURIComponent(endDateFormatted)}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("UpcomingReservations: API error", response.status, errorText);
        throw new Error(`Failed to fetch: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (result.result) {
        setReservations(result.result);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching upcoming reservations:", error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchUpcomingReservations(startDate, endDate);
    }
  }, [startDate, endDate]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              fontSize: "1.0625rem",
              letterSpacing: "-0.01em",
            }}
          >
            Upcoming Reservations
          </Typography>
          {reservations.length > 0 && (
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {reservations.length}
            </Box>
          )}
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : reservations.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Typography color="text.secondary">No upcoming reservations</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              pr: 1,
              // Limit visible area to show approximately 5 items (more compact)
              maxHeight: "calc(5 * 90px)", // Show 5 items in viewport
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "10px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "10px",
                "&:hover": {
                  background: "#a8a8a8",
                },
              },
            }}
          >
            <List sx={{ p: 0, gap: 0.75 }}>
              {reservations.map((reservation, index) => (
                <ListItem
                  key={reservation.id}
                  sx={{
                    p: 1.5,
                    mb: 0.75,
                    borderRadius: 1.5,
                    bgcolor: "white",
                    border: "1px solid #E5E7EB",
                    transition: "all 0.2s ease",
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "3px",
                      bgcolor: "#4F46E5",
                      borderRadius: "1.5px 0 0 1.5px",
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                    },
                    "&:hover": {
                      bgcolor: "#F9FAFB",
                      borderColor: "#C7D2FE",
                      transform: "translateX(2px)",
                      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.1)",
                      "&::before": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, width: "100%", flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: "#EEF2FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 16, color: "#4F46E5" }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#111827",
                          mb: 0.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reservation.customerName || "N/A"}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 12, color: "#9CA3AF" }} />
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              color: "#6B7280",
                              fontWeight: 500,
                            }}
                          >
                            {formatDate(reservation.reservationDate)}
                          </Typography>
                        </Box>
                        {reservation.mobileNo && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 12, color: "#9CA3AF" }} />
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                color: "#6B7280",
                              }}
                            >
                              {reservation.mobileNo}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingReservations;


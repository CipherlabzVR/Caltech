import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Card from "@mui/material/Card";
import { Box, Typography, IconButton, Chip, CircularProgress } from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import CreateMeetingModal from "./create";
import EditMeetingModal from "./edit";

export default function MeetingCalendar() {
  const calendarRef = useRef(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchMeetings = async (month, year) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/CRMMeeting/GetMeetingsByMonth?month=${month}&year=${year}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }

      const data = await response.json();
      const meetingsList = Array.isArray(data?.result) ? data.result : [];
      
      // Colors based on meeting type
      const physicalColor = "#3788d8"; // Blue for physical meetings
      const onlineColor = "#00B69B"; // Green for online meetings

      // Transform meetings to FullCalendar events format
      const events = meetingsList.map((meeting) => {
        const accountName = meeting.accountName || "Unknown Account";
        const subject = meeting.subject || "Meeting";
        const meetingType = meeting.meetingType || 1;
        
        // Determine color based on meeting type
        const eventColor = meetingType === 2 ? onlineColor : physicalColor;
        const meetingTypeLabel = meetingType === 2 ? "Online" : "Physical";
        
        // Combine meetingDate with startTime and endTime
        // meetingDate is in format "2025-12-19T18:30:00" (includes timezone offset)
        // startTime and endTime are in format "09:00:00"
        let startDateTime = null;
        let endDateTime = null;
        
        if (meeting.meetingDate && meeting.startTime) {
          // Extract just the date part from meetingDate
          const dateStr = meeting.meetingDate.split("T")[0]; // "2025-12-19"
          const [hours, minutes, seconds] = meeting.startTime.split(":").map(Number);
          // Create date string with time: "2025-12-19T09:00:00"
          const dateTimeStr = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:${String(seconds || 0).padStart(2, "0")}`;
          startDateTime = new Date(dateTimeStr);
        }
        
        if (meeting.meetingDate && meeting.endTime) {
          // Extract just the date part from meetingDate
          const dateStr = meeting.meetingDate.split("T")[0]; // "2025-12-19"
          const [hours, minutes, seconds] = meeting.endTime.split(":").map(Number);
          // Create date string with time: "2025-12-19T10:00:00"
          const dateTimeStr = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:${String(seconds || 0).padStart(2, "0")}`;
          endDateTime = new Date(dateTimeStr);
        }
        
        // Format time for display
        const startTimeDisplay = startDateTime
          ? startDateTime.toLocaleTimeString("en-US", { 
              hour: "numeric", 
              minute: "2-digit",
              hour12: true 
            })
          : "";
        
        return {
          id: String(meeting.id),
          title: `${startTimeDisplay ? startTimeDisplay + " - " : ""}${subject} (${meetingTypeLabel})`,
          start: startDateTime ? startDateTime.toISOString() : meeting.meetingDate,
          end: endDateTime ? endDateTime.toISOString() : null,
          backgroundColor: eventColor,
          borderColor: eventColor,
          textColor: "#ffffff",
          extendedProps: {
            accountId: meeting.accountId,
            accountName: accountName,
            description: meeting.description,
            location: meeting.location,
            subject: subject,
            meetingType: meetingType,
            meetingTypeLabel: meetingTypeLabel,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            meeting: meeting,
          },
        };
      });

      setMeetings(events);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDatesSet = (dateInfo) => {
    const viewDate = new Date(dateInfo.start);
    const month = viewDate.getMonth() + 1; // getMonth() returns 0-11, API expects 1-12
    const year = viewDate.getFullYear();
    setCurrentDate(viewDate);
    fetchMeetings(month, year);
  };

  // Update calendar size when layout changes (e.g., sidebar appears)
  useEffect(() => {
    const updateCalendarSize = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };

    // Initial delay to allow sidebar to render
    const initialTimeout = setTimeout(() => {
      updateCalendarSize();
    }, 500);

    // Listen for window resize events
    const handleResize = () => {
      updateCalendarSize();
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver to detect layout changes
    let resizeObserver;
    if (typeof window !== "undefined" && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateCalendarSize();
      });

      // Observe the calendar container
      const calendarElement = document.querySelector('.fc');
      if (calendarElement) {
        resizeObserver.observe(calendarElement);
      }
    }

    // Additional delayed update to catch sidebar animation
    const delayedTimeout = setTimeout(() => {
      updateCalendarSize();
    }, 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(delayedTimeout);
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setCreateModalOpen(true);
  };

  const handleEventClick = (info) => {
    info.jsEvent.preventDefault();
    setSelectedMeeting(info.event.extendedProps.meeting);
    setEditModalOpen(true);
  };

  const handleCreateSuccess = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const viewDate = new Date(view.activeStart);
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      fetchMeetings(month, year);
    }
    setCreateModalOpen(false);
    setSelectedDate(null);
  };

  const handleEditSuccess = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const viewDate = new Date(view.activeStart);
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      fetchMeetings(month, year);
    }
    setEditModalOpen(false);
    setSelectedMeeting(null);
  };

  const handleDeleteSuccess = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const viewDate = new Date(view.activeStart);
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      fetchMeetings(month, year);
    }
    setEditModalOpen(false);
    setSelectedMeeting(null);
  };

  return (
    <>
    <ToastContainer/>
      <div className={styles.pageTitle}>
        <h1>Meetings</h1>
        <ul>
          <li>
            <Link href="/crm">CRM</Link>
          </li>
          <li>Meetings</li>
        </ul>
      </div>

      <Card
        sx={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          borderRadius: "12px",
          p: "30px 25px",
          mb: "15px",
          background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #EEF0F7",
            paddingBottom: "15px",
            mb: "25px",
          }}
          className="for-dark-bottom-border"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CalendarTodayIcon sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography
              variant="h5"
              sx={{
                fontSize: 20,
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Meeting Calendar
            </Typography>
            {loading && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Box>

          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              textTransform: "capitalize",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              padding: "12px 24px",
              boxShadow: "0 4px 12px rgba(117, 127, 239, 0.3)",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(117, 127, 239, 0.4)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Schedule Meeting
          </Button>
        </Box>

        <Box
          sx={{
            "& .fc": {
              fontFamily: "inherit",
            },
            "& .fc-header-toolbar": {
              marginBottom: "20px",
              padding: "15px",
              background: "rgba(117, 127, 239, 0.05)",
              borderRadius: "8px",
            },
            "& .fc-button": {
              background: "#757FEF",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontWeight: 500,
              textTransform: "capitalize",
              "&:hover": {
                background: "#6369d4",
              },
              "&:focus": {
                boxShadow: "0 0 0 3px rgba(117, 127, 239, 0.2)",
              },
            },
            "& .fc-button-primary:not(:disabled):active": {
              background: "#6369d4",
            },
            "& .fc-toolbar-title": {
              fontSize: "20px",
              fontWeight: 600,
              color: "text.primary",
            },
            "& .fc-daygrid-day": {
              border: "1px solid #e0e0e0",
              transition: "all 0.2s ease",
              "&:hover": {
                background: "rgba(117, 127, 239, 0.03)",
              },
            },
            "& .fc-day-today": {
              background: "rgba(117, 127, 239, 0.08) !important",
              "& .fc-daygrid-day-number": {
                fontWeight: 700,
                color: "#757FEF",
              },
            },
            "& .fc-daygrid-day-number": {
              padding: "8px",
              fontSize: "14px",
              fontWeight: 500,
            },
            "& .fc-col-header-cell": {
              background: "rgba(117, 127, 239, 0.1)",
              border: "1px solid #e0e0e0",
              padding: "12px 8px",
              fontWeight: 600,
              fontSize: "13px",
              textTransform: "uppercase",
              color: "text.primary",
            },
            "& .fc-event": {
              borderRadius: "6px",
              padding: "4px 8px",
              margin: "2px 0 !important",
              cursor: "pointer",
              border: "none",
              fontWeight: 500,
              fontSize: "12px",
              transition: "all 0.2s ease",
              display: "block !important",
              width: "100%",
              position: "relative",
              "&:hover": {
                transform: "translateX(2px)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              },
            },
            "& .fc-daygrid-event": {
              margin: "2px 0 !important",
              marginTop: "4px !important",
              display: "block !important",
              clear: "both",
            },
            "& .fc-daygrid-event:first-of-type": {
              marginTop: "2px !important",
            },
            "& .fc-daygrid-day-events": {
              marginTop: "4px",
              position: "relative",
            },
            "& .fc-event-title": {
              fontWeight: 600,
              padding: "2px 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            "& .fc-daygrid-event-dot": {
              display: "none",
            },
            "& .fc-more-link": {
              color: "#757FEF",
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: "4px",
              background: "rgba(117, 127, 239, 0.1)",
              "&:hover": {
                background: "rgba(117, 127, 239, 0.2)",
                textDecoration: "none",
              },
            },
            "& .fc-daygrid-day-frame": {
              minHeight: "150px",
            },
            "& .fc-daygrid-day": {
              overflow: "visible",
            },
            "& .fc-daygrid-day-events": {
              marginTop: "4px",
            },
            "& .fc-scrollgrid": {
              border: "none",
            },
            "& .fc-scrollgrid-section > table": {
              border: "none",
            },
            "& .fc-daygrid-body": {
              height: "auto !important",
            },
            "& .fc-view-harness": {
              height: "auto !important",
            },
            "& .fc-view-harness-active": {
              height: "auto !important",
            },
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={meetings}
            dayMaxEvents={false}
            moreLinkClick="popover"
            weekends={true}
            selectable={true}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            headerToolbar={{
              left: "prev,next today",
              center: "",
              right: "title",
            }}
            height="auto"
            eventDisplay="block"
            eventOrder="start,-duration,allDay"
            allDaySlot={false}
            dayHeaderFormat={{ weekday: "short" }}
            firstDay={1}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
            windowResizeDelay={100}
            views={{
              dayGridMonth: {
                fixedWeekCount: false,
              },
            }}
          />
        </Box>

        <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "4px",
                backgroundColor: "#3788d8",
                border: "1px solid #3788d8",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Physical Meeting
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "4px",
                backgroundColor: "#00B69B",
                border: "1px solid #00B69B",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Online Meeting
            </Typography>
          </Box>
          {meetings.length > 0 && (
            <>
              <Box sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Total Meetings:
              </Typography>
              <Chip
                label={meetings.length}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </>
          )}
        </Box>
      </Card>

      <CreateMeetingModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedDate(null);
        }}
        onSuccess={handleCreateSuccess}
        initialDate={selectedDate}
      />

      <EditMeetingModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedMeeting(null);
        }}
        onSuccess={handleEditSuccess}
        onDelete={handleDeleteSuccess}
        meeting={selectedMeeting}
      />
    </>
  );
}


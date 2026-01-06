import * as React from "react";
import styles from "@/components/_App/TopNavbar/Notification.module.css";
import {
  IconButton,
  Button,
  Typography,
  Tooltip,
  Menu,
  Link,
  Badge,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import BASE_URL from "Base/api";
import { useState } from "react";
import { formatDateWithTime } from "@/components/utils/formatHelper";
import NotificationDialog from "./NotificationDialog";
import { useEffect } from "react";

const Notification = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [view, setView] = useState(false);
  const [count, setCount] = useState(null);
  const [newNote, setNewNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Notification/IsUnreadNotificationAvailable`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usere");
      }

      const data = await response.json();
      setNewNote(data.result.isUnreadAvailable);
      setCount(data.result.count);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };


  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Notification/GetAllNewNotification`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usere");
      }

      const data = await response.json();
      setNotifications(data.result);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleViewNote = async (note) => {
    setSelectedNote(note);
    setView(true);

    try {
      const response = await fetch(`${BASE_URL}/Notification/ReadNotification?id=${note.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usere");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  const handleMarkAsRead = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Notification/MarkAsReadNotifications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usere");
      }
      fetchUnreadNotifications();
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Tooltip title="Notification">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            backgroundColor: '#f5f5f5',
            width: '40px',
            height: '40px',
            p: 0
          }}
          aria-controls={open ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          className="ml-2 for-dark-notification"
        >
          {newNote ? (
            <Badge color="error" size="small" badgeContent={count}>
              <NotificationsActiveIcon color="action" />
            </Badge>
          ) : (
            <NotificationsActiveIcon color="action" />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            padding: "5px 20px 5px",
            borderRadius: "10px",
            boxShadow: "0px 10px 35px rgba(50, 110, 189, 0.2)",
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <div className={styles.header}>
          <Typography variant="h4">Notifications</Typography>
          <Button variant="text" onClick={() => handleMarkAsRead()}>Mark all as Read</Button>
        </div>
        <div className={styles.notification} style={{maxHeight: '50vh',overflowY: 'scroll'}}>
          {notifications.length === 0 ? <div className={styles.notificationList}>
            <Typography
              variant="h5"
              sx={{
                fontSize: "14px",
                color: "#260944",
                fontWeight: "500",
                mb: 1,
              }}
            >
              No New Notifications
            </Typography>
          </div> : (notifications.map((note, index) => (
            <div key={index} className={styles.notificationList} onClick={() => handleViewNote(note)}>
              <Typography
                variant="h5"
                sx={{
                  fontSize: "15px",
                  color: "#260944",
                  fontWeight: note.isRead ? "400" : "800",
                  mb: 1,
                }}
              >
                {note.title}
              </Typography>
              <div className={styles.notificationListContent}>
                <img src="/images/comments.png" alt="PDF Icon" width={27} />
                <Typography
                  variant="h6"
                  className="ml-1"
                  sx={{
                    fontSize: "14px",
                    color: "#5B5B98",
                    fontWeight: note.isRead ? "400" : "800",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    textOverflow: "ellipsis",
                  }}
                >
                  {note.description}
                </Typography>

              </div>
              <Typography sx={{ fontSize: "12px", color: "#A9A9C8", mt: 1 }}>
                {formatDateWithTime(note.createdOn)}
              </Typography>
            </div>
          )))}
          <Typography component="div" textAlign="center">
            <Link
              href="/notification/"
              underline="none"
              sx={{
                fontSize: "13px",
                color: "#757FEF",
                fontWeight: "500",
                mt: "10px",
                display: "inline-block",
              }}
            >
              View All{" "}
              <span className={styles.rightArrow}>
                <i className="ri-arrow-right-s-line"></i>
              </span>
            </Link>
          </Typography>
        </div>
      </Menu>

      <NotificationDialog
        open={view}
        onClose={() => setView(false)}
        note={selectedNote}
      />
    </>
  );
};

export default Notification;

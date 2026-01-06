import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useRouter } from "next/router";

const TicketListModal = ({ open, onClose, title, tickets = [] }) => {
  const router = useRouter();

  const getStatusColor = (status) => {
    switch (status) {
      case 1: // Open
        return "info";
      case 2: // InProgress
        return "warning";
      case 3: // Resolved
        return "success";
      case 4: // Closed
        return "default";
      case 5: // OnHold
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: // Low
        return "default";
      case 2: // Medium
        return "warning";
      case 3: // High
        return "error";
      case 4: // Critical
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityLabel = (priority) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTicketClick = (ticketId) => {
    router.push(`/help-desk/tickets?id=${ticketId}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ minWidth: "auto", p: 0.5 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {tickets.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No tickets found
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: "60vh" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    onClick={() => handleTicketClick(ticket.id)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {ticket.ticketNumber || `#${ticket.id}`}
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
                        title={ticket.subject}
                      >
                        {ticket.subject || "No subject"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {ticket.category?.name || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(ticket.status)}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(ticket.priority)}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {ticket.assignedToUser
                          ? `${ticket.assignedToUser.firstName || ""} ${ticket.assignedToUser.lastName || ""}`.trim() || 
                            ticket.assignedToUser.email || 
                            "N/A"
                          : "Unassigned"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(ticket.createdOn)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          ticket.dueDate &&
                          new Date(ticket.dueDate) < new Date() &&
                          ticket.status !== 3 &&
                          ticket.status !== 4
                            ? "error"
                            : "text.primary"
                        }
                      >
                        {formatDate(ticket.dueDate)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketListModal;


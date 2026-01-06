import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Chip,
  Box,
  Button,
  Modal,
  TextField,
  Divider,
  Paper,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from "@mui/material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import LabelIcon from "@mui/icons-material/Label";
import EventIcon from "@mui/icons-material/Event";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import TicketImageUpload from "@/components/help-desk/TicketImageUpload";
import ProjectMasterScreens from "@/components/help-desk/ProjectMasterScreens";
import TicketChecklist from "@/components/help-desk/TicketChecklist";
import useApi from "@/components/utils/useApi";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: "95%", xs: "95%" },
  maxWidth: "1400px",
  bgcolor: "#1E1E1E",
  boxShadow: 24,
  borderRadius: 2,
  maxHeight: "95vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const getStatusLabel = (status) => {
  switch (status) {
    case 1: return "Open";
    case 2: return "In Progress";
    case 3: return "Resolved";
    case 4: return "Closed";
    case 5: return "On Hold";
    default: return "Open";
  }
};

const commentValidationSchema = Yup.object().shape({
  comment: Yup.string().trim().required("Comment is required"),
});

export default function ViewTicketModal({ open, onClose, ticket, fetchItems }) {
  const [comments, setComments] = useState([]);
  const [images, setImages] = useState([]);
  // Checklist removed from frontend
  const [masterScreens, setMasterScreens] = useState([]);
  const [isHelpDeskCustomer, setIsHelpDeskCustomer] = useState(false);

  const { data: usersData } = useApi("/User/GetAllUser");
  const users = Array.isArray(usersData) ? usersData : [];

  // Get project and customer from ticket's navigation properties (from help desk module)
  const project = ticket?.projectEntity || null;
  const customer = ticket?.customer || null;
  const projectId = project?.id || ticket?.projectId || null;
  
  // Check if the ticket category is "assign" - only show project/customer for assign category
  const categoryName = ticket?.category?.name || ticket?.categoryName || "";
  const isAssignCategory = categoryName?.toLowerCase() === "assign";

  useEffect(() => {
    if (open && ticket?.id) {
      fetchComments();
      fetchImages();
      // Checklist removed from frontend
      // Fetch master screens if project exists
      if (projectId) {
        fetchMasterScreens(projectId);
      }
    }
  }, [open, ticket?.id, projectId]);


  const fetchMasterScreens = async (projId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Project/GetMasterScreens?projectId=${projId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMasterScreens(data.result || []);
      }
    } catch (error) {
      console.error("Error fetching master screens:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/HelpDesk/GetCommentsByTicketId?ticketId=${ticket.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data.result || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/HelpDesk/GetTicketImages?ticketId=${ticket.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setImages(data.result || []);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  // Checklist removed from frontend

  const handleAddComment = async (values, { resetForm, setSubmitting }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/CreateComment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          comment: values.comment,
          isInternal: isHelpDeskCustomer ? false : (values.isInternal || false),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "SUCCESS") {
        toast.success("Comment added successfully!");
        resetForm();
        fetchComments();
        fetchItems();
      } else {
        toast.error(data.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("An error occurred while adding the comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="view-ticket-modal"
      aria-describedby="view-ticket-details"
      sx={{
        "& .MuiBackdrop-root": {
          bgcolor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <Box sx={style}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={ticket.status || 1}
              sx={{
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#555",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#777",
                },
                "& .MuiSvgIcon-root": {
                  color: "white",
                },
              }}
            >
              <MenuItem value={1}>Open</MenuItem>
              <MenuItem value={2}>In Progress</MenuItem>
              <MenuItem value={3}>Resolved</MenuItem>
              <MenuItem value={4}>Closed</MenuItem>
              <MenuItem value={5}>On Hold</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left Panel */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 3,
              borderRight: "1px solid #333",
            }}
          >
            {/* Title with Icon */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "#2196F3",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                {ticket.subject?.[0]?.toUpperCase() || "T"}
              </Avatar>
              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: 600,
                  flex: 1,
                }}
              >
                {ticket.subject || ticket.ticketNumber}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
              <Button
                startIcon={<AddIcon />}
                sx={{
                  color: "white",
                  borderColor: "#555",
                  "&:hover": { borderColor: "#777", bgcolor: "#333" },
                }}
                variant="outlined"
                size="small"
              >
                Add
              </Button>
              <Button
                startIcon={<LabelIcon />}
                sx={{
                  color: "white",
                  borderColor: "#555",
                  "&:hover": { borderColor: "#777", bgcolor: "#333" },
                }}
                variant="outlined"
                size="small"
              >
                Labels
              </Button>
              <Button
                startIcon={<EventIcon />}
                sx={{
                  color: "white",
                  borderColor: "#555",
                  "&:hover": { borderColor: "#777", bgcolor: "#333" },
                }}
                variant="outlined"
                size="small"
              >
                Dates
              </Button>
              {/* Checklist action removed */}
              <Button
                startIcon={<AttachFileIcon />}
                sx={{
                  color: "white",
                  borderColor: "#555",
                  "&:hover": { borderColor: "#777", bgcolor: "#333" },
                }}
                variant="outlined"
                size="small"
              >
                Attachment
              </Button>
            </Box>

            {/* Members Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: "#999", mb: 1 }}>
                Members
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {ticket.assignedToUser && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "#2196F3",
                      fontSize: "0.875rem",
                    }}
                  >
                    {ticket.assignedToUser.firstName?.[0] ||
                      ticket.assignedToUser.email?.[0] ||
                      "U"}
                  </Avatar>
                )}
                <IconButton
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    border: "1px dashed #555",
                    color: "#999",
                    "&:hover": { borderColor: "#777", bgcolor: "#333" },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: "#999", mb: 1 }}>
                Description
              </Typography>
              <Box
                sx={{
                  bgcolor: "#2A2A2A",
                  borderRadius: 1,
                  p: 2,
                  border: "1px solid #555",
                  "& .ql-editor": {
                    color: "white",
                    minHeight: "150px",
                  },
                  "& .ql-editor.ql-blank::before": {
                    color: "#999",
                    fontStyle: "normal",
                  },
                  "& .ql-container": {
                    border: "none",
                    fontSize: "0.875rem",
                  },
                  "& .ql-toolbar": {
                    display: "none", // Hide toolbar in view mode
                  },
                }}
                dangerouslySetInnerHTML={{ __html: ticket.description || "" }}
              />
            </Box>

            {/* Master Screens (if project exists) */}
            {projectId && (
              <Box sx={{ mb: 3 }}>
                <ProjectMasterScreens
                  projectId={projectId}
                  masterScreens={masterScreens}
                  onMasterScreensChange={(newScreens) => {
                    setMasterScreens(newScreens);
                    fetchItems();
                  }}
                />
              </Box>
            )}

            {/* Checklist Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                Checklist
              </Typography>
              <TicketChecklist
                ticketId={ticket?.id}
                checklist={ticket?.checklist || []}
                onChecklistChange={() => {
                  // Refresh ticket list to update checklist percentage
                  if (fetchItems) {
                    fetchItems();
                  }
                }}
                readOnly={true}
              />
            </Box>

            {/* Images Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                Attachments
              </Typography>
              <TicketImageUpload
                ticketId={ticket.id}
                images={images}
                onImagesChange={(newImages) => {
                  setImages(newImages);
                  fetchItems();
                }}
              />
            </Box>
          </Box>

          {/* Right Panel - Comments and Activity */}
          <Box
            sx={{
              width: "400px",
              overflowY: "auto",
              p: 3,
              bgcolor: "#252525",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ color: "white" }}>
                Comments and activity
              </Typography>
              <Button size="small" sx={{ color: "#999", textTransform: "none" }}>
                Show details
              </Button>
            </Box>

            {/* Project and Customer Information - Only show for "Assign" category in Help Desk Module */}
            {isAssignCategory && (project || ticket?.projectId || customer || ticket?.customerId || ticket?.customerName) && (
              <Box sx={{ mb: 3, pb: 3, borderBottom: "1px solid #333" }}>
                <Typography variant="subtitle2" sx={{ color: "#999", mb: 2, fontWeight: 600 }}>
                  Details
                </Typography>
                
                {/* Project Section - from Help Desk Ticket's ProjectEntity */}
                {(project || ticket?.projectId || ticket?.project) && (
                  <Box sx={{ mb: 2.5, display: "flex", gap: 1 }}>
                    <BusinessIcon sx={{ color: "#2196F3", fontSize: "1.25rem", mt: 0.25 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#999", display: "block", mb: 0.5 }}>
                        Project
                      </Typography>
                      <Typography sx={{ color: "white", fontSize: "0.875rem", fontWeight: 500 }}>
                        {project?.name || ticket?.project || "N/A"}
                      </Typography>
                      {project?.code && (
                        <Typography sx={{ color: "#999", fontSize: "0.75rem", mt: 0.5 }}>
                          Code: {project.code}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Customer Section - from Help Desk Ticket's Customer entity or direct fields */}
                {(customer || ticket?.customerId || ticket?.customerName) && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <PersonIcon sx={{ color: "#4CAF50", fontSize: "1.25rem", mt: 0.25 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#999", display: "block", mb: 0.5 }}>
                        Customer
                      </Typography>
                      <Typography sx={{ color: "white", fontSize: "0.875rem", fontWeight: 500 }}>
                        {customer?.displayName || 
                         (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}`.trim() : null) ||
                         ticket?.customerName || 
                         "N/A"}
                      </Typography>
                      {(customer?.company || ticket?.customerCompany) && (
                        <Typography sx={{ color: "#999", fontSize: "0.75rem", mt: 0.5 }}>
                          Company: {customer?.company || ticket?.customerCompany}
                        </Typography>
                      )}
                      {(customer?.customerContactDetails?.[0]?.emailAddress || ticket?.customerEmail) && (
                        <Typography sx={{ color: "#999", fontSize: "0.75rem", mt: 0.5 }}>
                          Email: {customer?.customerContactDetails?.[0]?.emailAddress || ticket?.customerEmail}
                        </Typography>
                      )}
                      {(customer?.customerContactDetails?.[0]?.contactNo || ticket?.customerPhone) && (
                        <Typography sx={{ color: "#999", fontSize: "0.75rem", mt: 0.5 }}>
                          Phone: {customer?.customerContactDetails?.[0]?.contactNo || ticket?.customerPhone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Comment Input Form */}
            <Formik
              initialValues={{ comment: "", isInternal: false }}
              validationSchema={commentValidationSchema}
              onSubmit={handleAddComment}
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={10}
                    name="comment"
                    placeholder="Write a comment... (Press Enter for new line)"
                    value={values.comment}
                    onChange={(e) => setFieldValue("comment", e.target.value)}
                    error={touched.comment && !!errors.comment}
                    helperText={touched.comment && errors.comment}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "white",
                        "& fieldset": {
                          borderColor: "#E2E8F0",
                        },
                        "&:hover fieldset": {
                          borderColor: "#CBD5E0",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#2196F3",
                        },
                      },
                    }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    {!isHelpDeskCustomer && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={values.isInternal || false}
                          onChange={(e) => setFieldValue("isInternal", e.target.checked)}
                          style={{ marginRight: 8 }}
                        />
                        <Typography sx={{ color: "#999", fontSize: "0.875rem" }}>
                          Internal Note
                        </Typography>
                      </Box>
                    )}
                    {isHelpDeskCustomer && <Box />}
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting || !values.comment.trim()}
                      sx={{
                        bgcolor: "#2196F3",
                        "&:hover": { bgcolor: "#1976D2" },
                      }}
                    >
                      {isSubmitting ? "Adding..." : "Add Comment"}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>

            {/* Comments List */}
            <Box>
              {comments.length === 0 ? (
                <Typography sx={{ color: "#999", fontSize: "0.875rem" }}>
                  No comments yet
                </Typography>
              ) : (
                comments.map((comment) => (
                  <Box key={comment.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "#2196F3",
                          fontSize: "0.875rem",
                        }}
                      >
                        {comment.user?.firstName?.[0] || comment.user?.email?.[0] || "U"}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: "white", fontSize: "0.875rem", fontWeight: 500 }}>
                          {comment.user?.firstName && comment.user?.lastName
                            ? `${comment.user.firstName} ${comment.user.lastName}`
                            : comment.user?.email || comment.user?.userName || "Unknown User"}
                        </Typography>
                        <Typography sx={{ color: "#999", fontSize: "0.75rem" }}>
                          {formatDate(comment.createdOn)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography 
                      sx={{ 
                        color: "#CCC", 
                        fontSize: "0.875rem", 
                        ml: 5,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {comment.comment}
                    </Typography>
                  </Box>
                ))
              )}

              {/* Activity Log */}
              <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid #333" }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "#4CAF50",
                      fontSize: "0.875rem",
                    }}
                  >
                    {ticket.createdByUser?.firstName?.[0] || "S"}
                  </Avatar>
                  <Box>
                    <Typography sx={{ color: "#CCC", fontSize: "0.875rem" }}>
                      {ticket.createdByUser?.firstName || "System"} added this ticket
                    </Typography>
                    <Typography sx={{ color: "#999", fontSize: "0.75rem" }}>
                      {formatDate(ticket.createdOn)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

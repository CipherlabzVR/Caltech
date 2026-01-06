"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Modal,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import SearchProjectByKeyword from "@/components/utils/SearchProjectByKeyword";
import SearchMaterialRequestNote from "@/components/utils/SearchMaterialRequestNote";
import SearchUser from "@/components/utils/SearchUser";

const EditMaterialIssuedNote = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [documentNo, setDocumentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [remark, setRemark] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRequestNotes, setSelectedRequestNotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [issuedNote, setIssuedNote] = useState({});
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchIssuedNote();
    }
    fetchWarehouses();
  }, [id]);

  useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userid") : null;
    setLoggedInUserId(userId ? Number(userId) : null);
  }, []);

  useEffect(() => {
    // Update products when selectedRequestNotes change (for create-like functionality)
    // But in edit mode, products come from API response
    if (selectedRequestNotes.length > 0 && !issuedNote.id) {
      const allLineItems = [];
      selectedRequestNotes.forEach(note => {
        const lineDetails = note.materialRequestNoteLines || [];
        lineDetails.forEach(item => {
          const uniqueKey = `${item.productId}_${note.id}`;
          const existingIndex = allLineItems.findIndex(p => p.uniqueKey === uniqueKey);
          if (existingIndex >= 0) {
            allLineItems[existingIndex].requestedQty += (item.requestingQty || 0);
          } else {
            allLineItems.push({
              uniqueKey: uniqueKey,
              id: item.productId,
              code: item.productCode,
              name: item.productName,
              stockQty: item.stockQty || 0,
              requestedQty: item.requestingQty || 0,
              issuedQty: item.issuedQty || 0,
              issueQty: "",
              difference: 0,
              materialRequestNoteId: note.id,
              materialRequestNoteLineId: item.id,
            });
          }
        });
      });
      setProducts(allLineItems);
    }
  }, [selectedRequestNotes, issuedNote.id]);

  const fetchIssuedNote = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/MaterialIssuedNote/GetMaterialIssuedNoteById?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      const result = data.result;
      setIssuedNote(result);
      setDocumentNo(result.documentNo || "");
      setDate(result.date ? formatDate(result.date) : formatDate(today));
      setReferenceNo(result.referenceNo || "");
      setRemark(result.remark || "");

      // Set project from response
      if (result.projectId) {
        setSelectedProject({
          id: result.projectId,
          name: result.projectName || "",
          code: result.projectCode || "",
        });
      }

      // Set warehouse
      if (result.warehouseId) {
        setWarehouseId(String(result.warehouseId));
      }

      // Set assigned user from response
      if (result.assignedUserId) {
        setSelectedUser({
          id: result.assignedUserId,
          firstName: result.assignedUserName?.split(" ")[0] || "",
          lastName: result.assignedUserName?.split(" ").slice(1).join(" ") || "",
          userName: result.assignedUserName || "",
        });
      }

      // Load material request notes from response
      if (result.materialRequestNotes && result.materialRequestNotes.length > 0) {
        setSelectedRequestNotes(result.materialRequestNotes);
      }

      // Map products from materialIssuedNoteLines and materialRequestNotes
      if (result.materialIssuedNoteLines && result.materialIssuedNoteLines.length > 0) {
        const mappedProducts = result.materialIssuedNoteLines.map((issuedLine) => {
          // Find corresponding material request note line to get full details
          let requestNoteLine = null;
          if (result.materialRequestNotes && result.materialRequestNotes.length > 0) {
            for (const requestNote of result.materialRequestNotes) {
              if (requestNote.id === issuedLine.materialRequestNoteId) {
                requestNoteLine = requestNote.materialRequestNoteLines?.find(
                  line => line.id === issuedLine.materialRequestNoteLineId
                );
                break;
              }
            }
          }

          // Use data from request note line if available, otherwise calculate from issued line
          const requestedQty = requestNoteLine?.requestingQty || ((issuedLine.issuedQty || 0) + (issuedLine.difference || 0));
          
          const productCode = requestNoteLine?.productCode || "";
          const productName = issuedLine.productName || requestNoteLine?.productName || "";
          // issuedQty in request note line is the total issued so far across all issued notes
          const totalIssuedQty = requestNoteLine?.issuedQty || 0;
          // issueQty is what was issued in this specific issued note
          const currentIssueQty = issuedLine.issuedQty || 0;
          
          // Calculate difference using same formula as create page
          // x = requestedQty - issuedQty (remaining quantity that can be issued)
          // y = issueQty (current issue qty in this note)
          // difference = x - y
          const x = requestedQty - (issuedLine.materialRequestNoteIssuedQty);
          const y = currentIssueQty;
          const difference = x - y;

          return {
            id: issuedLine.productId,
            code: productCode,
            name: productName,
            stockQty: issuedLine.stockQty,
            requestedQty: requestedQty,
            issuedQty: issuedLine.materialRequestNoteIssuedQty ||0, // Total issued excluding this note
            issueQty: String(currentIssueQty), // Current issue qty for this issued note
            difference: difference,
            materialRequestNoteId: issuedLine.materialRequestNoteId,
            materialRequestNoteLineId: issuedLine.materialRequestNoteLineId,
          };
        });
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error("Error fetching issued note:", error);
      toast.error("Failed to load material issued note");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const warehouseList = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        setWarehouses(warehouseList);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const handleRequestNoteSelect = (note) => {
    // Check if note is already selected
    const isAlreadySelected = selectedRequestNotes.some(n => n.id === note.id);
    if (isAlreadySelected) {
      toast.warning("This material request note is already added");
      return;
    }

    // Add note to selected list
    setSelectedRequestNotes(prev => [...prev, note]);
  };

  const handleRemoveRequestNote = (noteId) => {
    setSelectedRequestNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...products];
    const row = updatedRows[index];
    
    if (name === "issueQty") {
      const issueQty = parseFloat(value) || 0;
      
      // x = requestedQty - issuedQty (remaining quantity that can be issued)
      // Note: issuedQty here is total issued excluding this note
      const x = row.requestedQty - row.issuedQty;
      
      // Validation: issue quantity cannot be more than stockQty
      if (issueQty > row.stockQty) {
        toast.warning(`Issue quantity cannot be more than stock quantity (${row.stockQty})`);
        return;
      }
      
      // Validation: issue quantity cannot be more than x (remaining quantity)
      if (issueQty > x) {
        toast.warning(`Issue quantity cannot be more than remaining quantity (${x.toFixed(2)})`);
        return;
      }
      
      row.issueQty = value;
      // difference = x - y = (requestedQty - issuedQty) - issueQty
      row.difference = x - issueQty;
    } else {
      row[name] = value;
    }

    setProducts(updatedRows);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...products];
    updatedRows.splice(index, 1);
    setProducts(updatedRows);
  };

  const handleSubmit = async () => {
    if (!selectedProject) return toast.error("Please select project");
    if (!warehouseId) return toast.error("Please select warehouse");
    if (!selectedUser) return toast.error("Please select assigned user");
    if (products.length === 0) return toast.error("At least one product must be added");
    if (products.some((p) => !p.issueQty || parseFloat(p.issueQty) <= 0))
      return toast.error("All rows must have issue quantity");
    
    // Validate issue quantity constraints
    for (const product of products) {
      const issueQty = parseFloat(product.issueQty) || 0;
      
      // x = requestedQty - issuedQty (remaining quantity that can be issued)
      const x = product.requestedQty - product.issuedQty;
      
      // Validation: issue quantity cannot be more than stockQty
      if (issueQty > product.stockQty) {
        toast.error(`Issue quantity for ${product.name} cannot be more than stock quantity (${product.stockQty})`);
        return;
      }
      
      // Validation: issue quantity cannot be more than x (remaining quantity)
      if (issueQty > x) {
        toast.error(`Issue quantity for ${product.name} cannot be more than remaining quantity (${x.toFixed(2)})`);
        return;
      }
    }

    const data = {
      Id: issuedNote.id,
      ProjectId: Number(selectedProject.id),
      Date: date ? new Date(date).toISOString() : null,
      Remark: remark || "",
      ReferenceNo: referenceNo || "",
      WarehouseId: Number(warehouseId),
      AssignedUserId: selectedUser ? Number(selectedUser.id) : null,
      MaterialIssuedNoteLines: products.map((row) => ({
        MaterialRequestNoteId: row.materialRequestNoteId,
        MaterialRequestNoteLineId: row.materialRequestNoteLineId,
        ProductId: row.id || null,
        ProductName: row.name || "",
        IssuedQty: parseFloat(row.issueQty) || null,
        Difference: parseFloat(row.difference) || null,
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(
        `${BASE_URL}/MaterialIssuedNote/UpdateMaterialIssuedNote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.statusCode === 200) {
          toast.success(jsonResponse.message);
          setTimeout(() => {
            window.location.href = "/manufacture/material-issued-note/";
          }, 1500);
        } else {
          toast.error(jsonResponse.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setIsSubmitting(false);
      setIsDisable(false);
    }
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/manufacture/material-issued-note/",
    });
  };

  // Check if user can approve/reject
  const canApproveReject = () => {
    return (
      loggedInUserId &&
      issuedNote.assignedUserId &&
      Number(loggedInUserId) === Number(issuedNote.assignedUserId) &&
      issuedNote.status === 1
    );
  };

  // Approve handlers
  const handleOpenApproveModal = () => {
    setApproveModalOpen(true);
  };

  const handleCloseApproveModal = () => {
    setApproveModalOpen(false);
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const data = {
        Id: Number(id),
        Status: 2, // Approved
        StatusRemark: "",
      };

      const response = await fetch(
        `${BASE_URL}/MaterialIssuedNote/UpdateMaterialIssuedNoteStatus`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.statusCode === 200) {
          toast.success(jsonResponse.message || "Material Issued Note approved successfully");
          handleCloseApproveModal();
          setTimeout(() => {
            router.push("/manufacture/material-issued-note/");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to approve");
        }
      } else {
        toast.error("Failed to approve Material Issued Note");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while approving");
    } finally {
      setIsApproving(false);
    }
  };

  // Reject handlers
  const handleOpenRejectModal = () => {
    setRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning("Please enter a reason for rejection");
      return;
    }

    try {
      setIsRejecting(true);
      const data = {
        Id: Number(id),
        Status: 3, // Rejected
        StatusRemark: rejectReason.trim(),
      };

      const response = await fetch(
        `${BASE_URL}/MaterialIssuedNote/UpdateMaterialIssuedNoteStatus`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.statusCode === 200) {
          toast.success(jsonResponse.message || "Material Issued Note rejected successfully");
          handleCloseRejectModal();
          setTimeout(() => {
            router.push("/manufacture/material-issued-note/");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to reject");
        }
      } else {
        toast.error("Failed to reject Material Issued Note");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while rejecting");
    } finally {
      setIsRejecting(false);
    }
  };

  // Modal style
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 3,
    borderRadius: 1,
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Edit Material Issued Note</h1>
        <ul>
          <li>
            <Link href="/manufacture/material-issued-note">Material Issued Note</Link>
          </li>
          <li> Edit</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" gap={1} justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  Note No: {documentNo}
                </Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                Go Back
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Project
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchProjectByKeyword
                  label="Project"
                  placeholder="Search project by keyword"
                  displayValue={selectedProject 
                    ? (selectedProject.code 
                        ? `${selectedProject.name} - ${selectedProject.code}`
                        : selectedProject.name || "")
                    : ""}
                  onSelect={(project) => {
                    setSelectedProject(project);
                  }}
                  onClear={() => {
                    setSelectedProject(null);
                  }}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Warehouse
              </Typography>
              <Box sx={{ width: "60%" }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={warehouseId}
                    label="Warehouse"
                    onChange={(e) => setWarehouseId(e.target.value)}
                    required
                  >
                    <MenuItem value="">None</MenuItem>
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Reference No
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Remark
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Assigned User
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchUser
                  label="Assigned User"
                  placeholder="Search users by name"
                  main={true}
                  mainItem={selectedUser?.id || null}
                  displayValue={selectedUser 
                    ? (selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.firstName || selectedUser.lastName || selectedUser.userName || "")
                    : ""}
                  onSelect={(user) => {
                    setSelectedUser(user);
                  }}
                  onClear={() => {
                    setSelectedUser(null);
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} mt={3}>
              <Typography variant="h6" fontWeight={600} mb={1}>
                Material Request Notes
              </Typography>
              <Box sx={{ mb: 1 }}>
                <SearchMaterialRequestNote
                  label="Search Material Request Notes"
                  placeholder={selectedProject ? "Search material request notes..." : "Please select a project first"}
                  projectId={selectedProject?.id || null}
                  onSelect={handleRequestNoteSelect}
                  onClear={() => {}}
                />
              </Box>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="request notes table" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Document No</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Reference No</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Date</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Customer</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRequestNotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No material request notes added. Search and select notes to add them here.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedRequestNotes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell>{note.documentNo || "-"}</TableCell>
                          <TableCell>{note.referenceNo || "-"}</TableCell>
                          <TableCell>{formatDate(note.date)}</TableCell>
                          <TableCell>{note.customerName || "-"}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveRequestNote(note.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} mt={3}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Products
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="products table" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Stock Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Requested Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Issued Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Issue Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Difference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Select a material request note to load products
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((item, index) => (
                        <TableRow key={index}
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell align="right">
                            <Tooltip title="Delete" placement="top">
                              <IconButton onClick={() => handleDeleteRow(index)} aria-label="delete" size="small">
                                <DeleteIcon color="error" fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {item.name}
                          </TableCell>
                          <TableCell>{item.stockQty}</TableCell>
                          <TableCell>{item.requestedQty}</TableCell>
                          <TableCell>{item.issuedQty}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.issueQty}
                              onChange={(e) => handleChange(index, e.target.value, "issueQty")}
                              disabled={item.requestedQty === item.issuedQty}
                              helperText={item.requestedQty === item.issuedQty ? "Already fully issued" : ""}
                            />
                          </TableCell>
                          <TableCell>{item.difference}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item lg={6} xs={12} my={2}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable}
              />
            </Grid>
            {canApproveReject() && (
              <Grid item lg={6} xs={12} mt={2} display="flex" gap={1} justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="success"
                  sx={{height: 35}}
                  onClick={handleOpenApproveModal}
                  disabled={isSubmitting}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  sx={{height: 35}}
                  onClick={handleOpenRejectModal}
                  disabled={isSubmitting}
                >
                  Reject
                </Button>
              </Grid>
            )}

          </Grid>
        </Grid>
      </Grid>

      {/* Approve Confirmation Modal */}
      <Modal
        open={approveModalOpen}
        onClose={handleCloseApproveModal}
        aria-labelledby="approve-modal-title"
        aria-describedby="approve-modal-description"
      >
        <Box sx={modalStyle} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} mb={2}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "5px",
                  }}
                >
                  Are you sure you want to approve this Material Issued Note?
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseApproveModal}
              disabled={isApproving}
            >
              No
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? "Approving..." : "Yes"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        open={rejectModalOpen}
        onClose={handleCloseRejectModal}
        aria-labelledby="reject-modal-title"
        aria-describedby="reject-modal-description"
      >
        <Box sx={modalStyle} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} mb={2}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "5px",
                  }}
                >
                  Are you sure you want to reject this Material Issued Note?
                </Typography>
              </Grid>
              <Grid item xs={12} mb={2}>
                <TextField
                  size="small"
                  fullWidth
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please enter reason (required)"
                  required
                  error={!rejectReason.trim()}
                  helperText={!rejectReason.trim() ? "Reason is required" : ""}
                />
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseRejectModal}
              disabled={isRejecting}
            >
              No
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? "Rejecting..." : "Yes"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default EditMaterialIssuedNote;

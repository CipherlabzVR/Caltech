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
import SearchUser from "@/components/utils/SearchUser";
import SearchMaterialIssuedNote from "@/components/utils/SearchMaterialIssuedNote";

const EditMaterialReturnNote = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [documentNo, setDocumentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [remark, setRemark] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIssuedNotes, setSelectedIssuedNotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [returnNote, setReturnNote] = useState({});
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchReturnNote();
    }
    fetchWarehouses();
  }, [id]);

  useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userid") : null;
    setLoggedInUserId(userId ? Number(userId) : null);
  }, []);

  useEffect(() => {
    // Update products when selectedIssuedNotes change (for create-like functionality)
    // But in edit mode, products come from API response
    if (selectedIssuedNotes.length > 0 && !returnNote.id) {
      loadProductsFromSelectedNotes();
    }
  }, [selectedIssuedNotes, returnNote.id]);

  const fetchReturnNote = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/MaterialReturnNote/GetMaterialReturnNoteById?id=${id}`,
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
      setReturnNote(result);
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

      // Load material issued notes from response
      if (result.materialIssuedNotes && result.materialIssuedNotes.length > 0) {
        setSelectedIssuedNotes(result.materialIssuedNotes);
      }

      // Map products from materialReturnNoteLines
      if (result.materialReturnNoteLines && result.materialReturnNoteLines.length > 0) {
        const mappedProducts = result.materialReturnNoteLines.map((item) => {
          // Find the corresponding material issued note to get documentNo
          const issuedNote = result.materialIssuedNotes?.find(note => note.id === item.materialIssuedNoteId);
          
          return {
            id: item.productId,
            code: item.productCode || "",
            name: item.productName,
            stockQty: item.stockQty || 0,
            materialIssuedNo: issuedNote?.documentNo || "",
            issuedQty: item.issuedQty || 0,
            returnQty: String(item.returnQty || ""),
            materialRequestNoteReturnedQty: item.materialRequestNoteReturnedQty || 0,
            materialIssuedNoteId: item.materialIssuedNoteId,
            materialIssuedNoteLineId: item.materialIssuedNoteLineId,
          };
        });
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error("Error fetching return note:", error);
      toast.error("Failed to load material return note");
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

  const loadProductsFromSelectedNotes = async () => {
    try {
      const allProducts = [];

      for (const note of selectedIssuedNotes) {
        try {
          const response = await fetch(`${BASE_URL}/MaterialIssuedNote/GetMaterialIssuedNoteById?id=${note.id}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            const issuedNote = data.result;

            // Set project from first note
            if (allProducts.length === 0) {
              if (issuedNote.projectId) {
                setSelectedProject({
                  id: issuedNote.projectId,
                  name: issuedNote.projectName || "",
                  code: issuedNote.projectCode || "",
                });
              }
            }

            // Add products from this note
            const lineDetails = issuedNote.materialIssuedNoteLines || [];
            lineDetails.forEach(item => {
              allProducts.push({
                id: item.productId,
                code: item.productCode || "",
                name: item.productName,
                stockQty: item.stockQty || 0,
                materialIssuedNo: issuedNote.documentNo || issuedNote.referenceNo,
                issuedQty: item.issuedQty || 0,
                returnQty: "",
                materialRequestNoteReturnedQty: item.materialRequestNoteReturnedQty || 0,
                materialIssuedNoteId: note.id,
                materialIssuedNoteLineId: item.id,
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching issued note ${note.id}:`, error);
        }
      }

      setProducts(allProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleIssuedNoteSelect = (note) => {
    // Check if note is already selected
    const isAlreadySelected = selectedIssuedNotes.some(n => n.id === note.id);
    if (isAlreadySelected) {
      toast.warning("This material issued note is already added");
      return;
    }

    // Add note to selected list
    setSelectedIssuedNotes(prev => [...prev, note]);
  };

  const handleRemoveIssuedNote = (noteId) => {
    setSelectedIssuedNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...products];
    const row = updatedRows[index];
    
    if (name === "returnQty") {
      const returnQty = parseFloat(value) || 0;
      const issuedQty = parseFloat(row.issuedQty) || 0;
      const returnedQty = parseFloat(row.materialRequestNoteReturnedQty) || 0;
      const availableQty = issuedQty - returnedQty;
      
      // Validation: return quantity cannot be greater than (issuedQty - returnedQty)
      if (returnQty > availableQty) {
        toast.warning(`Return quantity cannot be greater than available quantity (${availableQty.toFixed(2)})`);
        return;
      }
      
      row.returnQty = value;
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
    if (products.some((p) => !p.returnQty || parseFloat(p.returnQty) <= 0))
      return toast.error("All rows must have return quantity");
    
    // Validate return quantity constraints
    for (const product of products) {
      const returnQty = parseFloat(product.returnQty) || 0;
      const issuedQty = parseFloat(product.issuedQty) || 0;
      const returnedQty = parseFloat(product.materialRequestNoteReturnedQty) || 0;
      const availableQty = issuedQty - returnedQty;
      
      // Validation: return quantity cannot be greater than (issuedQty - returnedQty)
      if (returnQty > availableQty) {
        toast.error(`Return quantity for ${product.name} cannot be greater than available quantity (${availableQty.toFixed(2)})`);
        return;
      }
    }

    const data = {
      Id: returnNote.id,
      ProjectId: Number(selectedProject.id),
      Date: date ? new Date(date).toISOString() : null,
      Remark: remark || "",
      ReferenceNo: referenceNo || "",
      WarehouseId: Number(warehouseId),
      AssignedUserId: selectedUser ? Number(selectedUser.id) : null,
      MaterialReturnNoteLines: products.map((row) => ({
        MaterialIssuedNoteId: Number(row.materialIssuedNoteId),
        MaterialIssuedNoteLineId: Number(row.materialIssuedNoteLineId),
        ProductId: row.id ? Number(row.id) : null,
        ProductName: row.name || "",
        IssuedQty: row.issuedQty ? parseFloat(row.issuedQty) : null,
        ReturnQty: row.returnQty ? parseFloat(row.returnQty) : null,
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(
        `${BASE_URL}/MaterialReturnNote/UpdateMaterialReturnNoteStatus`,
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
            window.location.href = "/manufacture/material-return-note/";
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
      pathname: "/manufacture/material-return-note/",
    });
  };

  // Check if user can approve/reject
  const canApproveReject = () => {
    return (
      loggedInUserId &&
      returnNote.assignedUserId &&
      Number(loggedInUserId) === Number(returnNote.assignedUserId) &&
      returnNote.status === 1
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
        `${BASE_URL}/MaterialReturnNote/UpdateMaterialReturnNoteStatus`,
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
          toast.success(jsonResponse.message || "Material Return Note approved successfully");
          handleCloseApproveModal();
          setTimeout(() => {
            router.push("/manufacture/material-return-note/");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to approve");
        }
      } else {
        toast.error("Failed to approve Material Return Note");
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
        `${BASE_URL}/MaterialReturnNote/UpdateMaterialReturnNoteStatus`,
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
          toast.success(jsonResponse.message || "Material Return Note rejected successfully");
          handleCloseRejectModal();
          setTimeout(() => {
            router.push("/manufacture/material-return-note/");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to reject");
        }
      } else {
        toast.error("Failed to reject Material Return Note");
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
        <h1>Edit Material Return Note</h1>
        <ul>
          <li>
            <Link href="/manufacture/material-return-note">Material Return Note</Link>
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
                Material Issued Notes
              </Typography>
              <Box sx={{ mb: 1 }}>
                <SearchMaterialIssuedNote
                  label="Search Material Issued Notes"
                  placeholder={selectedProject ? "Search material issued notes..." : "Please select a project first"}
                  projectId={selectedProject?.id || null}
                  onSelect={handleIssuedNoteSelect}
                  onClear={() => { }}
                />
              </Box>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="issued notes table" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Material Issued No</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Customer</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Date</TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedIssuedNotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No material issued notes added. Search and select notes to add them here.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedIssuedNotes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell>{note.documentNo || note.referenceNo || "-"}</TableCell>
                          <TableCell>{note.customerName || "-"}</TableCell>
                          <TableCell>{formatDate(note.date)}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveIssuedNote(note.id)}
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
                      <TableCell sx={{ color: "#fff" }}>Material Issued No</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Issued Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Returned Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Return Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Select a material issued note to load products
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
                          <TableCell>{item.materialIssuedNo}</TableCell>
                          <TableCell>{item.issuedQty}</TableCell>
                          <TableCell>{item.materialRequestNoteReturnedQty}</TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.returnQty}
                              onChange={(e) => handleChange(index, e.target.value, "returnQty")}
                            />
                          </TableCell>
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
                  Are you sure you want to approve this Material Return Note?
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
                  Are you sure you want to reject this Material Return Note?
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

export default EditMaterialReturnNote;

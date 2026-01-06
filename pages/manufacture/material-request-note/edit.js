"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  IconButton,
  Modal,
  Grid,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import SearchBOMANDBOQSingle from "@/components/utils/SearchBOMANDBOQSingle";
import SearchCustomer from "@/components/utils/SearchCustomer";
import SearchProject from "@/components/utils/SearchProject";
import SearchUser from "@/components/utils/SearchUser";
import SearchItems from "@/components/utils/SearchItems";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

const EditMaterialRequestNote = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [documentNo, setDocumentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectBillType, setProjectBillType] = useState(null);
  const [remark, setRemark] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [addedRows, setAddedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [selectedBOMBOQ, setSelectedBOMBOQ] = useState(null);
  const [requestNote, setRequestNote] = useState({});
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchRequestNote();
    }
  }, [id]);

  useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userid") : null;
    setLoggedInUserId(userId ? Number(userId) : null);
  }, []);

  // Fetch project details to get billType when project is selected
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (selectedProject?.id) {
        try {
          const response = await fetch(`${BASE_URL}/Project/GetProjectById?id=${selectedProject.id}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              setProjectBillType(data.result.billType || null);
            }
          }
        } catch (error) {
          console.error("Error fetching project details:", error);
        }
      } else {
        setProjectBillType(null);
      }
    };
    fetchProjectDetails();
  }, [selectedProject]);

  const fetchRequestNote = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/MaterialRequestNote/GetMaterialRequestNoteById?id=${id}`,
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
      setRequestNote(result);
      setDocumentNo(result.documentNo || "");
      setDate(result.date ? formatDate(result.date) : formatDate(today));
      setReferenceNo(result.referenceNo || "");
      setRemark(result.remark || "");

      // Set customer from response
      if (result.customerId) {
        const customerName = result.customerName || "";
        const nameParts = customerName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setSelectedCustomer({
          id: result.customerId,
          firstName: firstName,
          lastName: lastName,
          displayName: customerName,
        });
      }

      // Set project from response
      if (result.projectId) {
        setSelectedProject({
          id: result.projectId,
          name: result.projectName || "",
          code: result.projectCode || "",
        });
      }

      // Set assigned user from response
      if (result.assignedUser) {
        setSelectedUser({
          id: result.assignedUser,
          firstName: result.assignedUserName?.split(" ")[0] || "",
          lastName: result.assignedUserName?.split(" ").slice(1).join(" ") || "",
          userName: result.assignedUserName || "",
        });
      }

      // Map line items from materialRequestNoteLines
      // Fetch product details for each line item
      const lineItemsWithProducts = await Promise.all(
        (result.materialRequestNoteLines || []).map(async (item) => {
          try {
            // Fetch product details
            const productResponse = await fetch(
              `${BASE_URL}/Items/GetItemById?id=${item.productId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  "Content-Type": "application/json",
                },
              }
            );

            let productCode = "";
            let productName = "";

            if (productResponse.ok) {
              const productData = await productResponse.json();
              if (productData.result) {
                productCode = productData.result.code || "";
                productName = productData.result.name || "";
              }
            }

            return {
              id: item.productId,
              code: item.productCode,
              name: item.productName,
              boqQty: item.billQuantity || "",
              requestingQty: item.requestingQty || "",
              remark: item.remark || "",
              billType: item.billType,
              billId: item.billId,
              parentBOMBOQId: item.billId,
            };
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
            return {
              id: item.productId,
              code: item.productCode,
              name: item.productName,
              boqQty: item.billQuantity || "",
              requestingQty: item.requestingQty || "",
              remark: item.remark || "",
              billType: item.billType,
              billId: item.billId,
              parentBOMBOQId: item.billId,
            };
          }
        })
      );

      setAddedRows(lineItemsWithProducts);

      // Set selectedBOMBOQ if there are line items with billId
      if (lineItemsWithProducts.length > 0) {
        const firstItem = lineItemsWithProducts[0];
        if (firstItem.billId && firstItem.billType) {
          // Fetch BOM/BOQ details to set selectedBOMBOQ
          try {
            let bomBoqResponse;
            if (firstItem.billType === 1) {
              // BOM
              bomBoqResponse = await fetch(
                `${BASE_URL}/BillOfMaterial/GetBillOfMaterialById?id=${firstItem.billId}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                  },
                }
              );
            } else if (firstItem.billType === 2) {
              // BOQ
              bomBoqResponse = await fetch(
                `${BASE_URL}/BillOfQuantity/GetBillOfQuantityById?id=${firstItem.billId}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                  },
                }
              );
            }

            if (bomBoqResponse && bomBoqResponse.ok) {
              const bomBoqData = await bomBoqResponse.json();
              if (bomBoqData.result) {
                setSelectedBOMBOQ(bomBoqData.result);
              }
            }
          } catch (error) {
            console.error("Error fetching BOM/BOQ details:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching :", error);
    }
  };

  const handleBOMBOQSingleSelect = (item, lineItems) => {
    // Set selected BOM/BOQ (single selection)
    setSelectedBOMBOQ(item);

    // Add all line items to the table
    const newRows = lineItems.map((lineItem) => {
      const billType = item.billOfMaterialLineDetails ? 1 : 2;
      const mappedRow = {
        id: lineItem.productId,
        code: lineItem.productCode,
        name: lineItem.productName,
        boqQty: lineItem.quantity || "",
        requestingQty: "",
        remark: "",
        parentBOMBOQId: item.id,
        billType: billType,
        billId: item.id,
        originalLineItem: lineItem,
      };
      return mappedRow;
    });

    // Replace all existing rows with new ones from selected BOM/BOQ
    setAddedRows(newRows);
  };

  const handleBOMBOQSingleClear = () => {
    setSelectedBOMBOQ(null);
    setAddedRows([]);
  };

  const handleAddRow = (item) => {
    const isDuplicate = addedRows.some(row => row.id === item.id);
    if (isDuplicate) {
      toast.warning("This Item is already added.");
      return;
    }

    const newRow = {
      ...item,
      boqQty: "", // null when added via SearchItems
      requestingQty: "",
      remark: "",
      billType: null,
      billId: null,
      parentBOMBOQId: null,
    };

    setAddedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      return updatedRows;
    });
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...addedRows];
    updatedRows[index][name] = value;
    setAddedRows(updatedRows);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...addedRows];
    updatedRows.splice(index, 1);
    setAddedRows(updatedRows);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return toast.error("Please select customer");
    if (!selectedProject) return toast.error("Please select project");
    if (addedRows.length === 0) return toast.error("At least one item must be added");
    if (addedRows.some((r) => !r.requestingQty))
      return toast.error("All rows must have requesting quantity");

    const data = {
      Id: requestNote.id,
      ProjectId: Number(selectedProject.id),
      CustomerId: Number(selectedCustomer.id),
      Date: date ? new Date(date).toISOString() : null,
      Remark: remark || "",
      ReferenceNo: referenceNo || "",
      AssignedUser: selectedUser ? Number(selectedUser.id) : null,
      MaterialRequestNoteLines: addedRows.map((row) => ({
        ProductId: row.id,
        BillType: row.billType || 0,
        BillQuantity: row.boqQty ? parseFloat(row.boqQty) : 0,
        BillId: row.billId || 0,
        RequestingQty: parseFloat(row.requestingQty) || null,
        IssuedQty: null,
        ReturnedQty: null,
        Remark: row.remark || "",
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(
        `${BASE_URL}/MaterialRequestNote/UpdateMaterialRequestNote`,
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
            window.location.href = "/manufacture/material-request-note/";
          }, 1500);
        } else {
          toast.error(jsonResponse.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/manufacture/material-request-note/",
    });
  };

  // Check if user can approve/reject
  const canApproveReject = () => {
    return (
      loggedInUserId &&
      requestNote.assignedUser &&
      Number(loggedInUserId) === Number(requestNote.assignedUser) &&
      requestNote.status === 1
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
        `${BASE_URL}/MaterialRequestNote/UpdateMaterialRequestNoteStatus`,
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
          toast.success(jsonResponse.message || "Material Request Note approved successfully");
          handleCloseApproveModal();
          setTimeout(() => {
            router.push("/manufacture/material-request-note/");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to approve");
        }
      } else {
        toast.error("Failed to approve Material Request Note");
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
        `${BASE_URL}/MaterialRequestNote/UpdateMaterialRequestNoteStatus`,
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
          toast.success(jsonResponse.message || "Material Request Note rejected successfully");
          handleCloseRejectModal();
          setTimeout(() => {
            router.push("/manufacture/material-request-note/");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to reject");
        }
      } else {
        toast.error("Failed to reject Material Request Note");
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
        <h1>Edit Material Request Note</h1>
        <ul>
          <li>
            <Link href="/manufacture/material-request-note">Material Request Note</Link>
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
                Customer
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchCustomer
                  label="Customer"
                  placeholder="Search customers by name"
                  main={true}
                  mainItem={selectedCustomer?.id || null}
                  displayValue={selectedCustomer
                    ? (selectedCustomer.firstName && selectedCustomer.lastName
                      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                      : selectedCustomer.displayName || "")
                    : ""}
                  onSelect={(customer) => {
                    setSelectedCustomer(customer);
                  }}
                  onClear={() => {
                    setSelectedCustomer(null);
                  }}
                  disabled={true}
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
                Project
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchProject
                  label="Project"
                  placeholder="Search projects by name"
                  main={true}
                  mainItem={selectedProject?.id || null}
                  billType={0}
                  customerId={selectedCustomer?.id || null}
                  displayValue={selectedProject
                    ? (selectedProject.code || "")
                    : ""}
                  onSelect={(project) => {
                    setSelectedProject(project);
                  }}
                  onClear={() => {
                    setSelectedProject(null);
                  }}
                  disabled={true}
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
            {selectedCustomer?.id && selectedProject?.id && (
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
                  {projectBillType === 1 ? "BOM Number" : projectBillType === 2 ? "BOQ Number" : "BOM/BOQ Number"}
                </Typography>
                <Box sx={{ width: "60%" }}>
                  <SearchBOMANDBOQSingle
                    label={projectBillType === 1 ? "BOM Number" : projectBillType === 2 ? "BOQ Number" : "BOM/BOQ Number"}
                    placeholder="Search BOM and BOQ by keyword"
                    customerId={selectedCustomer?.id || null}
                    projectId={selectedProject?.id || null}
                    projectBillType={projectBillType}
                    displayValue={selectedBOMBOQ
                      ? (selectedBOMBOQ.documentNo
                        ? `${selectedBOMBOQ.documentNo} - ${selectedBOMBOQ.productName || ""}`
                        : selectedBOMBOQ.productName || "")
                      : ""}
                    onSelect={handleBOMBOQSingleSelect}
                    onClear={handleBOMBOQSingleClear}
                    disabled={true}
                  />
                </Box>
              </Grid>
            )}
            <Grid item xs={12} mt={3} mb={1}>
              <SearchItems
                label="Search"
                placeholder="Search Items by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                main={false}
                mainItem={null}
                onSelect={(item) => {
                  handleAddRow(item)
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Code</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product</TableCell>
                      <TableCell sx={{ color: "#fff" }}>BOQ/BOM Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Requesting Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No items added
                        </TableCell>
                      </TableRow>
                    ) : (
                      addedRows.map((item, index) => (
                        <TableRow key={index}
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRow(index)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {item.code || "-"}
                          </TableCell>
                          <TableCell>
                            {item.name || "-"}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.boqQty || ""}
                              disabled
                              InputProps={{
                                readOnly: true,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={item.requestingQty} onChange={(e) => handleChange(index, e.target.value, "requestingQty")} />
                          </TableCell>
                          <TableCell>
                            <TextField fullWidth size="small" value={item.remark} onChange={(e) => handleChange(index, e.target.value, "remark")} />
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
                  Are you sure you want to approve this Material Request Note?
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
                  Are you sure you want to reject this Material Request Note?
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

export default EditMaterialRequestNote;


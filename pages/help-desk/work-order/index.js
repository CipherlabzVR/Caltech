import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Autocomplete,
  TextField,
} from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

export default function HelpDeskWorkOrder() {
  useEffect(() => {
    sessionStorage.setItem("category", "108"); // Work Order category - will be updated when category is created
  }, []);

  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print: canPrint } = IsPermissionEnabled(cId);
  const router = useRouter();
  const [ticketSearch, setTicketSearch] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { data: IsProfessionalWorkOrderEnabled } = IsAppSettingEnabled(`IsProfessionalWorkOrderEnabled`);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/HelpDesk/GetAllTickets?SkipCount=0&MaxResultCount=10000&Search=null`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.result && result.result.items) {
            setTickets(result.result.items);
          } else if (Array.isArray(result.result)) {
            setTickets(result.result);
          }
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };
    fetchTickets();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  const navigateToCreate = () => {
    if (selectedTicket) {
      router.push(`/help-desk/work-order/create?ticketId=${selectedTicket.id}`);
    } else {
      router.push("/help-desk/work-order/create");
    }
  };

  const navigateToEdit = (id) => {
    router.push(`/help-desk/work-order/edit?id=${id}`);
  };

  const navigateToView = (id) => {
    router.push(`/help-desk/work-order/view?id=${id}`);
  };

  const navigateToViewPdf = (workOrderId, workOrderIssueDate) => {
    router.push({
      pathname: '/help-desk/work-order/viewPdf',
      query: { workOrderId, workOrderIssueDate }
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this work order?")) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/HelpDesk/DeleteWorkOrder?id=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.statusCode === 1 || result.statusCode === "SUCCESS") {
          toast.success("Work Order deleted successfully");
          fetchWorkOrderList(page, search, pageSize);
        } else {
          toast.error(result.message || "Failed to delete work order");
        }
      } else {
        toast.error("Failed to delete work order");
      }
    } catch (error) {
      console.error("Error deleting work order:", error);
      toast.error("An error occurred while deleting work order");
    }
  };


  const handlePrint = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to print the work order");
        return;
      }

      const url = `${BASE_URL}/HelpDesk/GenerateWorkOrderPdf?workOrderId=${id}`;

      // Fetch PDF with authorization header
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blob = await response.blob();

        // Check if the response is actually a PDF
        if (blob.type === "application/pdf" || blob.type === "") {
          const pdfUrl = window.URL.createObjectURL(blob);
          const newWindow = window.open(pdfUrl, "_blank");

          if (!newWindow) {
            // If popup blocked, create download link
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `WorkOrder_${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.info("PDF downloaded. Please check your downloads folder.");
          }

          // Clean up the URL after a delay
          setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 1000);
        } else {
          // If not PDF, might be an error response
          const text = await blob.text();
          try {
            const errorData = JSON.parse(text);
            toast.error(errorData.message || "Failed to generate PDF");
          } catch {
            toast.error("Failed to generate PDF. Please try again.");
          }
        }
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          toast.error(errorData.message || "Failed to generate PDF");
        } catch {
          toast.error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("An error occurred while generating PDF");
    }
  };

  const {
    data: workOrderList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchWorkOrderList,
  } = usePaginatedFetch("HelpDesk/GetAllWorkOrders", "", 10, true, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchWorkOrderList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchWorkOrderList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchWorkOrderList(1, search, size);
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Work Order</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>
            <Link href="/help-desk/help-desk">Help Desk</Link>
          </li>
          <li>Work Order</li>
        </ul>
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                <Search>
                  <StyledInputBase
                    placeholder="Search work orders..."
                    inputProps={{ "aria-label": "search" }}
                    value={search}
                    onChange={handleSearchChange}
                  />
                </Search>
                <Autocomplete
                  options={tickets}
                  getOptionLabel={(option) => `${option.ticketNumber} - ${option.subject}`}
                  value={selectedTicket}
                  onChange={(event, newValue) => {
                    setSelectedTicket(newValue);
                  }}
                  sx={{ minWidth: 300 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Search by Ticket" size="small" />
                  )}
                />
              </Box>
              {create && (
                <Button variant="outlined" onClick={navigateToCreate}>
                  + Add New
                </Button>
              )}
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Work Order No</TableCell>
                    <TableCell>Ticket No</TableCell>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Required Arrival</TableCell>
                    <TableCell>Job Site Client</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workOrderList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="error">No Work Orders Available</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrderList.map((item, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.workOrderNumber}</TableCell>
                          <TableCell>{item.ticketNumber || "N/A"}</TableCell>
                          <TableCell>{item.projectName || "N/A"}</TableCell>
                          <TableCell>{formatDate(item.workOrderIssueDate)}</TableCell>
                          <TableCell>
                            {item.requiredArrivalDate
                              ? `${formatDate(item.requiredArrivalDate)} ${item.requiredArrivalTime
                                ? new Date(`2000-01-01T${item.requiredArrivalTime}`).toLocaleTimeString(
                                  "en-US",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                                : ""
                              }`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{item.jobSiteClientName || "N/A"}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                              {!IsProfessionalWorkOrderEnabled ?
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => navigateToView(item.id)}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip> :
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => navigateToViewPdf(item.id, item.workOrderIssueDate)}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              }
                              {canPrint && (
                                <Tooltip title="Print">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handlePrint(item.id)}
                                  >
                                    <PrintIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {update && (
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => navigateToEdit(item.id)}
                                  >
                                    <BorderColorIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {remove && (
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total: {totalCount} work orders
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Page Size</InputLabel>
                  <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
                <Pagination
                  count={Math.ceil(totalCount / pageSize)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}


import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Modal,
  Box,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import AddCompany from "./AddCompany";
import EditCompany from "./EditCompany";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { formatCurrency } from "@/components/utils/formatHelper";

export default function Company() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [letterheadModalOpen, setLetterheadModalOpen] = useState(false);
  const [selectedLetterheadImage, setSelectedLetterheadImage] = useState("");
  const controller = "Company/DeleteCompany";

  const handleOpenLetterheadModal = (imageUrl) => {
    setSelectedLetterheadImage(imageUrl);
    setLetterheadModalOpen(true);
  };

  const handleCloseLetterheadModal = () => {
    setLetterheadModalOpen(false);
    setSelectedLetterheadImage("");
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Company/GetAllCompanies`, {
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
      setCompanies(data.result);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = companies.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBillingTypeName = (billingType) => {
    if (billingType === null || billingType === undefined) return "-";
    const type = Number(billingType);
    switch (type) {
      case 1:
        return "Monthly";
      case 2:
        return "Yearly";
      default:
        return "-";
    }
  };

  const getMonthName = (month) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthNum = Number(month);
    if (monthNum >= 1 && monthNum <= 12) {
      return months[monthNum - 1];
    }
    return "";
  };

  const formatBillingDate = (company) => {
    if (!company.renewalDate) return "-";
    
    const billingType = Number(company.billingType);
    const renewalDate = Number(company.renewalDate);
    
    if (billingType === 1) {
      return `Every month ${renewalDate}`;
    } else if (billingType === 2) {
      const monthName = getMonthName(company.renewalMonth);
      if (monthName) {
        return `${monthName} ${renewalDate}`;
      }
      return `${renewalDate}`;
    }
    
    return "-";
  };

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>
          Companies
        </h1>
        <ul>
          <li>
            <Link href="/administrator">Companies</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <ToastContainer />
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 2 }}
        >
          {create ? <AddCompany fetchItems={fetchCompanies} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Contact No</TableCell>
                  <TableCell>Hosting Fee</TableCell>
                  <TableCell>Billing Date</TableCell>
                  <TableCell>Billing Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Letter Head</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" colSpan={8}>
                      <Typography color="error">
                        No Companies Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((company, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {index + 1}
                      </TableCell>
                      <TableCell>{company.name}</TableCell>
                      <TableCell>{company.code}</TableCell>
                      <TableCell>{company.contactPerson}</TableCell>
                      <TableCell>
                        {company.contactNumber}
                      </TableCell>
                      <TableCell>{formatCurrency(company.hostingFee)}</TableCell>
                      <TableCell>{formatBillingDate(company)}</TableCell>
                      <TableCell>{getBillingTypeName(company.billingType)}</TableCell>
                      <TableCell>{company.description}</TableCell>
                      <TableCell>
                        {company.letterHeadImage ? (
                          <Tooltip title="View Letterhead">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenLetterheadModal(company.letterHeadImage)}
                            >
                              <ImageIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" display="flex" gap={2}>
                        {update ? <EditCompany
                          item={company}
                          fetchItems={fetchCompanies}
                        /> : ""}
                        {remove ? <DeleteConfirmationById
                          id={company.id}
                          controller={controller}
                          fetchItems={fetchCompanies}
                        /> : ""}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={paginatedData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Grid>
      </Grid>

      <Modal
        open={letterheadModalOpen}
        onClose={handleCloseLetterheadModal}
        aria-labelledby="letterhead-modal-title"
        aria-describedby="letterhead-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "80%", md: "70%", lg: "60%" },
            maxWidth: "900px",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 2,
            overflow: "auto",
          }}
          className="bg-black"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Letterhead Image
            </Typography>
            <IconButton onClick={handleCloseLetterheadModal} color="error">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              minHeight: "400px",
            }}
          >
            {selectedLetterheadImage && (
              <img
                src={selectedLetterheadImage}
                alt="Letterhead"
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
}

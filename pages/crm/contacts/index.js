import React from "react";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Chip from "@mui/material/Chip";
import { Box, FormControl, InputLabel, MenuItem, Pagination, Select } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AddContactModal from "./create";
import EditContactModal from "./edit";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";

export default function ContactsList() {
  const {
    data: contacts,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchContacts,
  } = usePaginatedFetch("CRMContacts/GetAllCRMContacts", "", 10, false, false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const refreshContacts = React.useCallback(
    (targetPage = page) => {
      fetchContacts(targetPage, search, pageSize, false);
    },
    [fetchContacts, page, pageSize, search]
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchContacts(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchContacts(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    fetchContacts(1, search, size, false);
  };

  const handleDeleteClick = (contact) => {
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedContact(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact?.id) {
      toast.error("Unable to determine contact to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`${BASE_URL}/CRMContacts/DeleteCRMContact?id=${selectedContact.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete contact");
      }

      toast.success(data?.message || "Contact deleted successfully.");
      handleCloseDialog();
      refreshContacts(page);
    } catch (error) {
      toast.error(error.message || "Unable to delete contact");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Contacts</h1>
        <ul>
          <li>
            <Link href="/crm/contacts/">Contacts</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search contacts..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          <AddContactModal
            onContactCreated={() => {
              setPage(1);
              refreshContacts(1);
            }}
          />
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="contacts table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No contacts available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => {
                    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "-";
                    return (
                      <TableRow key={contact.id}>
                        <TableCell>{fullName}</TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell>{contact.mobileNo || "-"}</TableCell>
                        <TableCell>{contact.jobTitle || "-"}</TableCell>
                        <TableCell>{contact.department || "-"}</TableCell>
                        <TableCell>{contact.accountName || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={contact.isActive ? "Active" : "Inactive"}
                            color={contact.isActive ? "success" : "default"}
                            variant={contact.isActive ? "filled" : "outlined"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <EditContactModal
                            contact={contact}
                            onContactUpdated={() => refreshContacts(page)}
                          />
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="delete contact"
                              onClick={() => handleDeleteClick(contact)}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2} px={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ width: 110 }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Contact</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>
              {selectedContact
                ? [selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ") || "this contact"
                : "this contact"}
            </strong>
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}


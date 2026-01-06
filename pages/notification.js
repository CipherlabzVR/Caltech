import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDateWithTime } from "@/components/utils/formatHelper";
import NotificationDialog from "@/components/_App/TopNavbar/NotificationDialog";

export default function Notifications() {
  const [noteList, setNoteList] = useState([]);
  const controller = "Notification/DeleteNotification";
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [view, setView] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchNoteList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchNoteList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchNoteList(1, searchTerm, newSize);
  };

  const fetchNoteList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Notification/GetAllNotification?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setNoteList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
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

  useEffect(() => {
    fetchNoteList();
  }, []);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Notification</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Notification</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: "none",
              }}
            >
              <Table
                sx={{ minWidth: 500 }}
                aria-label="custom pagination table"
                className="dark-table"
              >
                <TableBody>
                  {noteList.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell
                        style={{
                          borderBottom: "1px solid #F7FAFF",
                          padding: "10px",
                        }}
                      >
                        <DeleteConfirmationById id={row.id}
                          controller={controller}
                          fetchItems={fetchNoteList} />
                      </TableCell>

                      <TableCell
                        style={{
                          borderBottom: "1px solid #F7FAFF",
                          fontSize: "13px",
                          padding: "10px",
                        }}
                      >
                        <Box sx={{ cursor: "pointer" }} onClick={() => handleViewNote(row)}>
                          <Typography sx={{ fontSize: '15px', color: row.isRead ? "" : "#191919", fontWeight: row.isRead ? "400" : "700" }}>{row.title}</Typography>
                          <Typography sx={{ fontSize: '14px', fontWeight: row.isRead ? "400" : "700" }}>{row.description}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell
                        align="right"
                        style={{
                          borderBottom: "1px solid #F7FAFF",
                          fontSize: "13px",
                          padding: "10px",
                          color: row.isRead ? "" : "#191919",
                          fontWeight: row.isRead ? "400" : "700"
                        }}
                      >
                        {formatDateWithTime(row.createdOn)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      <NotificationDialog
        open={view}
        onClose={() => setView(false)}
        note={selectedNote}
      />
    </>
  );
}

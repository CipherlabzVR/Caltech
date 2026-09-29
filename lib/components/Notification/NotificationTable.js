import * as React from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import { Box, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import Checkbox from "@mui/material/Checkbox";
import { formatDateWithTime } from "../utils/formatHelper";
import NotificationDialog from "../_App/TopNavbar/NotificationDialog";
import { useState } from "react";
import DeleteConfirmationById from "../UIElements/Modal/DeleteConfirmationById";
import BASE_URL from "Base/api";

const label = { inputProps: { "aria-label": "Checkbox demo" } };

function Notification(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>

      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>

      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

Notification.propTypes = {
  count: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};

export default function NotificationTable({ notes, fetchItems }) {
  const [page, setPage] = React.useState(0);
  const [view, setView] = useState(false);
  const controller = "Notification/DeleteNotification";
  const [selectedNote, setSelectedNote] = useState(null);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - notes.length) : 0;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Dropdown
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "10px",
          p: "25px 25px 10px",
          mb: "15px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #EEF0F7",
            paddingBottom: "10px",
            mb: "20px",
          }}
          className="for-dark-bottom-border"
        >
          <Typography
            as="h3"
            sx={{
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Notification List
          </Typography>

          <Box>
            {/* <Tooltip title="Delete">
              <IconButton
                size="small"
                sx={{ background: "#F2F6F8" }}
                className='ml-5px'
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip> */}
          </Box>
        </Box>

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
              {(rowsPerPage > 0
                ? notes?.slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage
                )
                : notes
              ).map((row) => (
                <TableRow key={row.id}>
                  <TableCell
                    style={{
                      borderBottom: "1px solid #F7FAFF",
                      padding: "10px",
                    }}
                  >
                    {/* <Checkbox {...label} size="small" /> */}
                    <DeleteConfirmationById id={row.id}
                      controller={controller}
                      fetchItems={fetchItems} />
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

              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell
                    colSpan={3}
                    style={{ borderBottom: "1px solid #F7FAFF" }}
                  />
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={5}
                  count={notes.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  SelectProps={{
                    inputProps: {
                      "aria-label": "rows per page",
                    },
                    native: true,
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={Notification}
                  style={{ borderBottom: "none" }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Card>

      <NotificationDialog
        open={view}
        onClose={() => setView(false)}
        note={selectedNote}
      />
    </>
  );
}

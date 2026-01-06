import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Grid,
  IconButton,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { toast } from "react-toastify";

const styles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 450, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function Reports({ item }) {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [checkedReports, setCheckedReports] = useState([]);

  const handleOpen = () => {
    setOpen(true);
    fetchReports(item.id)
  }
  const handleClose = () => {
    setOpen(false);
    setCheckedReports([]);
  }

  const fetchReports = async (role) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/ReportSetting/GetAllEnabledReports?roleId=${role}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      setReports(data.result);
      const preChecked = data.result
        .filter((r) => r.isPermissionEnabled)
        .map((r) => r.id);
      setCheckedReports(preChecked);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCheckboxChange = (reportId) => {
    setCheckedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSave = async () => {
    const selected = reports.filter((r) => checkedReports.includes(r.id));

    const data = selected.map((row) => ({
      RoleId: item.id,
      ReportId: row.id,
      WarehouseId: 1
    }));

    try {
      const response = await fetch(
        `${BASE_URL}/ReportSetting/CreateReportPermissionsToUserRoles?roleId=${item.id}`,
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
          setOpen(false);
          setCheckedReports([]);
        } else {
          toast.error(jsonResponse.result.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    }

  };

  return (
    <>
      <Tooltip title="Edit">
        <IconButton onClick={handleOpen} size="small">
          <NoteAddIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose}>
        <Box sx={styles} className="bg-black">
          <Grid container spacing={2}>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Typography variant="h5" fontWeight={500}>Add Report Permissions</Typography>
              <Typography variant="h6" fontWeight={500}>{item.name}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ maxHeight: "50vh", overflowY: "auto" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Report Name</TableCell>
                        <TableCell align="right">Add Permission</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Typography>Reports Not Available</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>{report.title}</TableCell>
                            <TableCell align="right">
                              <Checkbox
                                checked={checkedReports.includes(report.id)}
                                onChange={() => handleCheckboxChange(report.id)}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Button variant="contained" size="small" color="error" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="contained" size="small" color="primary" onClick={handleSave}>
                Save
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

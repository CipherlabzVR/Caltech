import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
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
import HowToRegIcon from "@mui/icons-material/HowToReg";
import BASE_URL from "Base/api";
import { getModule } from "@/components/types/module";
import AddPermission from "./AddPermissions";

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

export default function Modules({ item }) {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const company = localStorage.getItem("company");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/Permission/GetActiveCompanyModules?companyId=${company}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <>
      <Tooltip title="Edit">
        <IconButton onClick={handleOpen} size="small">
          <HowToRegIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose}>
        <Box sx={styles} className="bg-black">
          <Grid container spacing={2}>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Typography variant="h5" fontWeight={500}>Add Permissions</Typography>
              <Typography variant="h6" fontWeight={500}>{item.name}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ maxHeight: "50vh", overflowY: "auto" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Module</TableCell>
                        <TableCell align="right">Add Permissions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modules.length === 0 ?
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Typography>Active Modules not Available</Typography>
                          </TableCell>
                        </TableRow>
                        : (modules.map((module, index) => (
                          <TableRow key={index}>
                            <TableCell>{getModule(module.moduleId)}</TableCell>
                            <TableCell align="right">
                              <AddPermission module={module} role={item} />
                            </TableCell>
                          </TableRow>
                        )))}

                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Button variant="contained" size="small" color="error" onClick={handleClose}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

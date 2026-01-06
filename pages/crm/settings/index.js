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
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AddSettingModal from "./create";
import EditSettingModal from "./edit";

const mockSettings = [
  {
    id: 1,
    type: "LeadSource",
    key: "website",
    value: "Website",
    order: 1,
    active: true,
  },
  {
    id: 2,
    type: "Stage",
    key: "qualification",
    value: "Qualification",
    order: 2,
    active: true,
  },
  {
    id: 3,
    type: "Tag",
    key: "vip",
    value: "VIP Customer",
    order: 5,
    active: false,
  },
];

export default function CRMSettingsList() {
  const [searchValue, setSearchValue] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedSetting, setSelectedSetting] = React.useState(null);

  const handleDeleteClick = (setting) => {
    setSelectedSetting(setting);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedSetting(null);
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>CRM Settings</h1>
        <ul>
          <li>
            <Link href="/crm/settings/">Settings</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search settings..."
              inputProps={{ "aria-label": "search" }}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          <AddSettingModal />
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="settings table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Setting Type</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockSettings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">No settings available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  mockSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>{setting.type}</TableCell>
                      <TableCell>{setting.key}</TableCell>
                      <TableCell>{setting.value}</TableCell>
                      <TableCell>{setting.order}</TableCell>
                      <TableCell>
                        {setting.active ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <EditSettingModal setting={setting} />
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="delete setting"
                            onClick={() => handleDeleteClick(setting)}
                          >
                            <DeleteOutlineIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Setting</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedSetting ? selectedSetting.value : "this setting"}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCloseDialog} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Modal,
  Tooltip,
  Typography,
} from "@mui/material";
import { Formik, Form } from "formik";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha } from "@mui/material/styles";
import BASE_URL from "Base/api";
import { getModule } from "@/components/types/module";
import { toast } from "react-toastify";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function AddPermission({ module, role }) {
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [allSelected, setAllSelected] = useState(false);

  const areAllPermissionsSelected = (permissionGroups) =>
    permissionGroups.length > 0 &&
    permissionGroups.every((category) =>
      category.permissionTypes.every((perm) => perm.isActive)
    );

  const handleSelectAll = () => {
    const updatedPermissions = permissions.map(category => ({
      ...category,
      permissionTypes: category.permissionTypes.map(perm => ({
        ...perm,
        isActive: !allSelected,
      })),
    }));
    setPermissions(updatedPermissions);
    setAllSelected(areAllPermissionsSelected(updatedPermissions));
  };

  const handleCategorySelectAll = (categoryIndex) => {
    setPermissions(prev => {
      const updated = prev.map((category, index) => {
        if (index !== categoryIndex) return category;
        const allChecked = category.permissionTypes.every(perm => perm.isActive);
        return {
          ...category,
          permissionTypes: category.permissionTypes.map(perm => ({
            ...perm,
            isActive: !allChecked,
          })),
        };
      });
      setAllSelected(areAllPermissionsSelected(updated));
      return updated;
    });
  };


  const handleOpen = () => {
    fetchPermissions();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/User/GetRolePermission?roleId=${role.id}&module=${module.moduleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      const fetchedPermissions = Array.isArray(data.result) ? data.result : [];
      setPermissions(fetchedPermissions);
      setAllSelected(areAllPermissionsSelected(fetchedPermissions));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCheckboxChange = (categoryIndex, permissionIndex) => {
    setPermissions((prev) => {
      const updated = prev.map((category, cIndex) => {
        if (cIndex !== categoryIndex) return category;
        return {
          ...category,
          permissionTypes: category.permissionTypes.map((perm, pIndex) => {
            if (pIndex !== permissionIndex) return perm;
            return { ...perm, isActive: !perm.isActive };
          }),
        };
      });
      setAllSelected(areAllPermissionsSelected(updated));
      return updated;
    });
  };


  const handleSubmit = () => {
    const data = permissions.flatMap((category) =>
      category.permissionTypes.map((perm) => ({
        PermissionId: perm.id,
        IsGranted: perm.isActive,
      }))
    );


    fetch(`${BASE_URL}/Permission/CreateOrUpdateRolePermissions?roleId=${role.id}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Tooltip title="Edit">
        <IconButton onClick={handleOpen} size="small">
          <AddIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle} className="bg-black">
          <Formik
            initialValues={{}}
            onSubmit={(values, actions) => {
              handleSubmit();
              actions.setSubmitting(false);
              handleClose();
            }}
          >
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12} display="flex" justifyContent="space-between">
                  <Typography variant="h5" fontWeight={500}>Add Permissions</Typography>
                  <Typography variant="h6" fontWeight={500}>{role.name} - {getModule(module.moduleId)}</Typography>
                </Grid>
                <Grid item xs={12} display="flex">
                  <Button variant="outlined" size="small" onClick={handleSelectAll}>
                    {allSelected ? "Deselect All" : "Select All"}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ height: "70vh", overflowY: "auto" }}>
                    <Grid container>
                      {permissions.map((category, categoryIndex) => {
                        const isCategorySelected = category.permissionTypes.every(
                          (perm) => perm.isActive
                        );
                        return (
                          <Grid item key={category.id || categoryIndex} xs={12}>
                            <Accordion disableGutters>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  width="100%"
                                  gap={2}
                                >
                                  <Typography variant="h6" color="primary" fontWeight={500}>
                                    {category.name}
                                  </Typography>
                                  <Box
                                    onClick={(event) => {
                                      event.stopPropagation();
                                    }}
                                    onFocus={(event) => {
                                      event.stopPropagation();
                                    }}
                                  >
                                    <FormControlLabel
                                      label="Select All"
                                      control={
                                        <Checkbox
                                          checked={isCategorySelected}
                                          onClick={(event) => event.stopPropagation()}
                                          onChange={(event) => {
                                            event.stopPropagation();
                                            handleCategorySelectAll(categoryIndex);
                                          }}
                                          size="small"
                                        />
                                      }

                                      sx={{ m: 0,mr:3 }}
                                    />
                                  </Box>
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails
                                sx={(theme) => ({
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  borderRadius: 1,
                                  px: 2,
                                  py: 2,
                                })}
                              >
                                <Grid container spacing={1}>
                                  {category.permissionTypes.map((permission, permIndex) => (
                                    <Grid item key={permission.id || permIndex} xs={12} md={6}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={permission.isActive}
                                            onChange={() =>
                                              handleCheckboxChange(categoryIndex, permIndex)
                                            }
                                          />
                                        }
                                        label={permission.name}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="space-between">
                  <Button variant="contained" size="small" color="error" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="small">
                    Save
                  </Button>
                </Grid>
              </Grid>
            </Form>
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

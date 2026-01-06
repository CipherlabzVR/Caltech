import React, { useEffect, useState } from "react";
import { Button, Checkbox, FormControlLabel, Grid } from "@mui/material";
import Box from "@mui/material/Box";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

export default function Modules({ handleClose,item }) {
    const [modules, setModules] = useState([]);
    const [checkedModules, setCheckedModules] = useState([]);
    const token = localStorage.getItem("token");

    const fetchModules = async () => {
        try {
            const response = await fetch(`${BASE_URL}/Permission/GetAllModules`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch all modules");

            const data = await response.json();
            setModules(data.result);
        } catch (error) {
            console.error("Error fetching all modules:", error);
        }
    };

    const fetchActiveModules = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}/Permission/GetActiveCompanyModules?companyId=${item}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch active modules");

            const data = await response.json();

            setCheckedModules(
                data.map((item) => ({
                    CompanyId: item.id,
                    ModuleId: item.moduleId ?? item.ModuleId,
                    isActive: item.isActive,
                }))
            );
        } catch (error) {
            console.error("Error fetching active modules:", error);
        }
    };

    useEffect(() => {
        fetchModules();
        fetchActiveModules();
    }, []);

    const isModuleChecked = (moduleId) => {
        const checked = checkedModules.find((m) => m.ModuleId === moduleId);
        return checked ? checked.isActive : false;
    };

    const handleSelectAllChange = (checked) => {
        setCheckedModules(
            modules.map((module) => ({
                CompanyId: item,
                ModuleId: module.id,
                isActive: checked,
            }))
        );
    };

    const handleCheckboxChange = (moduleId, checked) => {
        setCheckedModules((prev) => {
            const filtered = prev.filter((item) => item.ModuleId !== moduleId);

            if (checked) {
                return [...filtered, { CompanyId: item, ModuleId: moduleId, isActive: true }];
            } else {
                return [...filtered, { CompanyId: item, ModuleId: moduleId, isActive: false }];
            }
        });
    };

    const handleSaveCompanyModules = () => {
        if (checkedModules.length === 0) {
            toast.warning("Please Select Modules");
            return;
        }

        const data = checkedModules.map((row) => ({
            CompanyId: parseInt(row.CompanyId),
            ModuleId: row.ModuleId,
            isActive: row.isActive,
        }));

        fetch(`${BASE_URL}/Permission/CreateCompanyModules`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.statusCode === 200) {
                    toast.success(data.message);
                    handleClose();
                } else {
                    toast.error(data.message || "Failed to save modules");
                }
            })
            .catch((error) => {
                toast.error(error.message || "Error saving modules");
            });
    };

    const allSelected =
        modules.length > 0 && modules.every((module) => isModuleChecked(module.id));
    const partiallySelected =
        !allSelected && modules.some((module) => isModuleChecked(module.id));

    return (
        <Box sx={{ maxHeight: "55vh", overflowY: "auto", my: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={allSelected}
                                indeterminate={partiallySelected}
                                onChange={(event) => handleSelectAllChange(event.target.checked)}
                            />
                        }
                        label="Select All"
                    />
                </Grid>
                {modules.map((module) => (
                    <Grid key={module.id} item xs={12} lg={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isModuleChecked(module.id)}
                                    onChange={(e) => handleCheckboxChange(module.id, e.target.checked)}
                                />
                            }
                            label={module.name}
                        />
                    </Grid>
                ))}
                <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" mt={2}>
                        <Button onClick={handleClose} variant="outlined" color="error" size="small">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCompanyModules} variant="contained" size="small">
                            Save
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

import { Grid, Switch, Typography, Box } from "@mui/material";
import React, { useState } from "react";

export default function Settings() {
    const [isPickup, setIsPickup] = useState(false);

    const handleChange = () => {
        setIsPickup(!isPickup);
    };

    return (
        <Grid container spacing={1}>
            <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ borderBottom: '1px solid #e5e5e5' }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Settings
                </Typography>
            </Grid>

            <Grid item xs={10} sx={{ mt: 1 }}>
                hello
            </Grid>
        </Grid>
    );
}

import { Grid, Switch, Typography, Box } from "@mui/material";
import React, { useState } from "react";

export default function Reports() {
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
                    Reports
                </Typography>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Restaurant reports and analytics will be available here.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        View sales summaries, order statistics, and performance metrics.
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
}

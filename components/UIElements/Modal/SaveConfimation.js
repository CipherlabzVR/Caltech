import React, { useEffect, useState } from "react";
import {
    Autocomplete,
    Button,
    IconButton,
    Modal,
    Box,
    Grid,
    Tooltip,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    TextField,
    Paper,
} from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { Field, Form, Formik } from "formik";
import { Rowing } from "@mui/icons-material";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 800,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
};

export default function SaveConfirmation({ getChangeStatus }) {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleChangeStatus = (bool) => {
        getChangeStatus(bool);
        setOpen(false);
    };

    return (
        <>
            <Button variant="contained" onClick={handleOpen}>
                Save
            </Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="bg-black">
                    <Typography>
                        <h3>Are you sure?</h3>
                    </Typography>
                    <Typography>
                        You can't revert this after updating.
                    </Typography>
                    <Grid
                        sx={{
                            mt: "24px",
                        }}
                    >
                        <Button onClick={() => handleChangeStatus(false)}>
                            CLOSE
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleChangeStatus(true)}
                        >
                            CONTINUE
                        </Button>
                    </Grid>
                </Box>
            </Modal>
        </>
    );
}

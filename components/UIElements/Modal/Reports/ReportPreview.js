import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import { Chip, Grid, IconButton, Tooltip } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";


const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { lg: 700, xs: 300 },
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 2,
};

export default function ReportPreview({ url }) {
    const [open, setOpen] = useState(false);

    const handleOpen = async () => {
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    return (
        <>
            <Tooltip title="Preview" placement="top">
                <IconButton
                    onClick={handleOpen}
                    aria-label="view"
                    size="small"
                >
                    <PictureAsPdfIcon color="primary"/>
                </IconButton>
            </Tooltip>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="bg-black">
                    <Grid container>
                        <Grid item xs={12} mt={1}>
                            <iframe
                                src={url}
                                width="100%"
                                height="500px"
                                style={{ border: "none" }}
                            ></iframe>
                        </Grid>
                        <Grid item display="flex" gap={1} xs={12} mt={2}>
                            <Button color="error" onClick={handleClose} variant="outlined">
                                Close
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>
        </>
    );
}

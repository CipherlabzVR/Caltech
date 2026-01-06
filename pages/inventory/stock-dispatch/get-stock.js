import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import {
    Grid,
    Typography,
} from "@mui/material";
import BASE_URL from "Base/api";
import ViewStock from "./view-stock";
import { toast } from "react-toastify";
import SearchItemByName from "@/components/utils/SearchItemByName";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { lg: 450, xs: 350 },
    bgcolor: "background.paper",
    maxHeight: "80vh",
    boxShadow: 24,
    p: 2,
};

export default function GetStock({ fetchItems }) {
    const [open, setOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState({});
    const [viewStock, setViewStock] = useState(false);
    const inputRef = useRef(null);

    const handleOpen = () => {
        setOpen(true)
    };
    const handleClose = () => {
        setOpen(false);
        resetState();
    };

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [open]);

    const resetState = () => {
        setViewStock(false);
        setOpen(false);
        fetchItems(1, "", 10);
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
        fetchItems(1, "", 10);
        setOpen(false);
        setViewStock(true);
    };

    return (
        <>
            {!viewStock ? (
                <>
                    <Button onClick={handleOpen} variant="outlined">- Dispatch</Button>
                    <Modal
                        open={open}
                        onClose={handleClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Box sx={style} className="bg-black">
                            <Typography variant="h6" my={2}>
                                Search Item for Dispatch
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={12} mt={2}>
                                    <SearchItemByName
                                        ref={inputRef}
                                        label="Search"
                                        placeholder="Search Items by name"
                                        fetchUrl={`${BASE_URL}/Items/GetAllItemsWithoutZeroQty`}
                                        onSelect={(item) => {
                                            handleItemSelect(item);
                                        }}
                                    />
                                </Grid>
                            </Grid>
                            <Box display="flex" my={2} justifyContent="space-between">
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="error"
                                    onClick={handleClose}
                                >
                                    Close
                                </Button>
                            </Box>
                        </Box>
                    </Modal>
                </>
            ) : (
                <ViewStock item={selectedItem} reset={resetState} />
            )}

        </>
    );
}

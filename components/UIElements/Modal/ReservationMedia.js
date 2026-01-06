import React, { useEffect, useState } from "react";
import {
  Box,
  Modal,
  IconButton,
  Tooltip,
  Grid,
  Typography,
  Button,
} from "@mui/material";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import AddPhotos from "./AddPhotos";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import BASE_URL from "Base/api";
import DeleteConfirmationById from "./DeleteConfirmationById";

const ReservationMedia = ({ id }) => {
  const [open, setOpen] = useState(false);
  const [itemData, setItemData] = useState([]);
  const controller = "ReservationMedia/Delete";

  const fetchImages = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/ReservationMedia/GetAllReservationMediaByID?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setItemData(data.result);
    } catch (error) {
      console.error("Error fetching", error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <>
      <Tooltip sx={{width:'30px',height: '30px' }} title="Media" placement="top">
        <IconButton
          onClick={() => setOpen(true)}
          aria-label="edit"
          size="small"
        >
          <PermMediaIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { lg: 800, xs: 400 },
            maxHeight: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: "8px",
          }}
        >
          <Grid container my={2} spacing={2}>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Media
              </Typography>
              <AddPhotos id={id} fetchItems={fetchImages} />
            </Grid>
            <Grid item xs={12} sx={{ maxHeight: "50vh", overflowY: "auto" }}>
              <Box p={2} sx={{ bgcolor: "background.paper" }}>
                <Box sx={{ width: "100%", height: "auto" }}>
                  <ImageList variant="masonry" cols={3} gap={8}>
                    {itemData.length === 0 ? (
                      <Typography align="center" color="error">
                        Images not available
                      </Typography>
                    ) : (
                      itemData.map((item, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={item.imageURL}
                            alt={item.fileName}
                            loading="lazy"
                            style={{ borderRadius: "8px" }}
                            onClick={() => window.open(item.imageURL, "_blank")}
                          />
                          <ImageListItemBar
                            title={item.fileName}
                            position="bottom"
                            sx={{
                              background:
                                "linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0))",
                              padding: "8px",
                            }}
                            actionIcon={
                              <DeleteConfirmationById
                                id={item.id}
                                controller={controller}
                                fetchItems={fetchImages}
                              />
                            }
                          />
                        </ImageListItem>
                      ))
                    )}
                  </ImageList>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button
                color="error"
                variant="outlined"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default ReservationMedia;

// const itemData = [
//   {
//     img: "https://static.toiimg.com/imagenext/toiblogs/photo/readersblog/wp-content/uploads/2020/04/Indian-Bridal-Jewellery.jpg",
//     title: "Bride Name",
//   },
//   {
//     img: "https://pakibridals.com/wp-content/uploads/2021/12/Red-Tail-Bridal-Dresses-801.jpg",
//     title: "Bride Name",
//   },
//   {
//     img: "https://t3.ftcdn.net/jpg/02/33/53/56/360_F_233535604_H8GDXwPPLwAkhlLu54ac7f4bOt1ydd7k.jpg",
//     title: "Bride Name",
//   },
//   {
//     img: "https://thumbs.dreamstime.com/b/blonde-bride-bouquet-wedding-ceremony-beautiful-groom-stylish-summer-fun-smile-joy-55265459.jpg",
//     title: "Bride Name",
//   },
//   {
//     img: "https://gjepc.org/solitaire/wp-content/uploads/2023/09/alia-bhatt-1-800x600.jpg",
//     title: "Bride Name",
//   },
// ];

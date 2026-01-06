import React, { useState } from "react";
import { Button, Box, Modal, TextField } from "@mui/material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const AddPhotos = ({ id , fetchItems}) => {
  const [open, setOpen] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    const imagePreviews = validImages.map((file) => ({
      img: URL.createObjectURL(file),
      title: "",
      file,
    }));

    setNewImages((prev) => [...prev, ...imagePreviews]);
  };

  const handleNameChange = (index, value) => {
    setNewImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, title: value } : img))
    );
  };
  const handleAddImages = async () => {
    const file = newImages[0].file;
    const data = newImages[0];
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("FileName", data.title != "" ? data.title : file.name);
      formData.append("ReservationId", id);

      const response = await fetch(`${BASE_URL}/ReservationMedia/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (response.ok) {
        toast.success("Image Uploaded Successfully");
        setNewImages([]);
        setOpen(false);
        fetchItems();
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };

  const handleCloseModal = () => {
    setOpen(false);
    setNewImages([]);
  };
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        + Add Photos
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            maxHeight: "80vh",
            overflowY: "scroll",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
          }}
        >
          <h2>Add Photos</h2>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {newImages.length > 0 && (
            <Box mt={2}>
              {newImages.map((image, index) => (
                <Box key={index} mb={2}>
                  <img
                    src={image.img}
                    alt="preview"
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                  <TextField
                    label="Image Name"
                    fullWidth
                    value={image.title}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    margin="dense"
                  />
                </Box>
              ))}
            </Box>
          )}

          <Box mt={2} display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddImages}
              disabled={newImages.length === 0}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AddPhotos;

const itemData = [
  {
    img: "https://static.toiimg.com/imagenext/toiblogs/photo/readersblog/wp-content/uploads/2020/04/Indian-Bridal-Jewellery.jpg",
    title: "Bride Name",
  },
  {
    img: "https://pakibridals.com/wp-content/uploads/2021/12/Red-Tail-Bridal-Dresses-801.jpg",
    title: "Bride Name",
  },
  {
    img: "https://t3.ftcdn.net/jpg/02/33/53/56/360_F_233535604_H8GDXwPPLwAkhlLu54ac7f4bOt1ydd7k.jpg",
    title: "Bride Name",
  },
  {
    img: "https://thumbs.dreamstime.com/b/blonde-bride-bouquet-wedding-ceremony-beautiful-groom-stylish-summer-fun-smile-joy-55265459.jpg",
    title: "Bride Name",
  },
  {
    img: "https://gjepc.org/solitaire/wp-content/uploads/2023/09/alia-bhatt-1-800x600.jpg",
    title: "Bride Name",
  },
];

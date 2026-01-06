import BASE_URL from "Base/api";

export const removeFile = async ({
    id,
}) => {
    try {
        const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return await response.json();
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const GetAllItemDetails = () => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [uoms, setUoms] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [categoryRes, subCategoryRes, uomRes] = await Promise.all([
          fetch(`${BASE_URL}/Category/GetAllCategory`, { method: 'GET', headers }),
          fetch(`${BASE_URL}/SubCategory/GetAllSubCategory`, { method: 'GET', headers }),
          fetch(`${BASE_URL}/UnitOfMeasure/GetAllUnitOfMeasure`, { method: 'GET', headers }),
        ]);

        if (!categoryRes.ok || !subCategoryRes.ok || !uomRes.ok) {
          throw new Error('One or more requests failed');
        }

        const categoryData = await categoryRes.json();
        const subCategoryData = await subCategoryRes.json();
        const uomData = await uomRes.json();

        setCategories(categoryData.result);
        setSubCategories(subCategoryData.result);
        setUoms(uomData.result);
      } catch (err) {
        // handle error here if needed
      }
    };

    fetchData();
  }, []);

  return {
    categories,
    subCategories,
    uoms,
  };
};

export default GetAllItemDetails;

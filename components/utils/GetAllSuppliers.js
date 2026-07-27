import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const GetAllSuppliers = () => {
  const [data, setData] = useState([]);

  async function fetchData() {
    try {
      const response = await fetch(`${BASE_URL}/Supplier/GetAllSupplier`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      setData(result.result);
    } catch (err) {
      //
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; refetch() is explicit
  }, []);

  return { data, refetch: fetchData };
};

export default GetAllSuppliers;

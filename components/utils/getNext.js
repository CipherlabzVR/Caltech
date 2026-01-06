import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const getNext = (type) => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=${type}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      setData(result.result);
    } catch (err) {
      // Handle error if needed
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  return { data, fetchData };
};

export default getNext;

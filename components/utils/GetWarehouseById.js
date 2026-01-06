import BASE_URL from 'Base/api';

const GetWarehouseById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/Warehouse/GetWarehouseById?Id=${id}`, {
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

    const code = result?.result?.code || '';
    const name = result?.result?.name || '';

    return `${code} - ${name}`;
  } catch (error) {
    return '';
  }
};

export default GetWarehouseById;

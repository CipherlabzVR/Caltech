import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const IsPermissionEnabled = (cId) => {
  const role = localStorage.getItem("role");

  const [navigate, setNavigate] = useState(true);
  const [create, setCreate] = useState(false);
  const [update, setUpdate] = useState(false);
  const [remove, setRemove] = useState(false);
  const [print, setPrint] = useState(false);
  const [approve1, setApprove1] = useState(false);
  const [approve3, setApprove3] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/User/GetModuleCategoryPermissions?roleId=${role}&categoryId=${cId}`, {
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
        const data = result.result.result;
        if (data.some(item => item.permissionType === 1)) {
          setNavigate(true);
        }
        if (data.some(item => item.permissionType === 2)) {
          setCreate(true);
        }
        if (data.some(item => item.permissionType === 3)) {
          setUpdate(true);
        }
        if (data.some(item => item.permissionType === 4)) {
          setRemove(true);
        }
        if (data.some(item => item.permissionType === 5)) {
          setPrint(true);
        }
        if (data.some(item => item.permissionType === 6)) {
          setApprove1(true);
        }
        if (data.some(item => item.permissionType === 8)) {
          setApprove3(true);
        }
      } catch (err) {
        //
      }
    };

    fetchData();
  }, [cId]);

  return { navigate, create, update, remove, print,approve1 ,approve3};
};

export default IsPermissionEnabled;

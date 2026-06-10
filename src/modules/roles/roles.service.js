import { query } from '../../config/db.js';

export const fetchAllRoles = async () => {
  
  const result = await query('SELECT role_id, role_name FROM roles ORDER BY role_id ASC');
  return result.rows;
};
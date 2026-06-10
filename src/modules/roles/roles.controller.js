import { fetchAllRoles } from "./roles.service.js";

export const getRoles = async (req, res) => {
    try {
        const roles = await fetchAllRoles();
        return res.status(201).json({
            message:'Roles feached successfully!',
            data: roles
        });
    } catch (error) {
         return res.status(400).json({ error: error.message });
    }
}
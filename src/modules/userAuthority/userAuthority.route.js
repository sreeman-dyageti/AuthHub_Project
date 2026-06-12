import express from 'express';
import { verifyUser , inviteUser,updateUser } from './userAuthority.controller.js';

const router = express.Router();
router.post('/invite', inviteUser);
router.get('/verify/:userToken', verifyUser );
router.put('/update',updateUser);
export default router;

import express from 'express';
import { verifyUser , inviteUser } from './userAuthority.controller.js';

const router = express.Router();
router.post('/invite', inviteUser);
router.post('/verify', verifyUser );
export default router;

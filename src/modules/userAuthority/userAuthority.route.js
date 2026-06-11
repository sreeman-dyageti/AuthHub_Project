import express from 'express';
import { inviteUser } from './userAuthority.controller.js';
const router = express.Router();
router.post('/invite', inviteUser);
export default router;

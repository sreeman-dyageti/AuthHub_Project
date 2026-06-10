import express from 'express';
import { createOrg } from './organisation.controller.js';
import {verifyOrg} from './organisation.controller.js';
const router = express.Router();
router.post('/create' , createOrg);
router.get('/verify/:token', verifyOrg);
export default router;

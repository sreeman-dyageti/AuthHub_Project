import express from "express";
import { Router } from "express";
import { getRoles } from "./roles.controller.js";

const router = express.Router();

router.get('/',getRoles);

export default router;


import dotenv from 'dotenv';
import express from 'express';
import { query } from './src/config/db.js';

import authRouter from './src/modules/auth/auth.routes.js';
import rolesRouter from './src/modules/roles/roles.routes.js';
import organisationRouter from './src/modules/organisations/organisation.route.js';
import userAuthorityRouter from './src/modules/userAuthority/userAuthority.route.js';
import auditRouter from './src/modules/audit/audit.router.js';

dotenv.config();

const app = express();

// Middleware for JSON requests
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.use('/v1/auth', authRouter);
app.use('/v1/roles', rolesRouter);
app.use('/v1/organisations', organisationRouter);
app.use('/v1/userAuthority',userAuthorityRouter);
app.use('/v1/audit',auditRouter);

app.listen(PORT,"0.0.0.0", async () => {
  console.log(`AuthHub Server is running on port ${PORT}`);

  try {
    const res = await query('SELECT NOW()');
    console.log(
      'Database connected successfully! Current DB time:',
      res.rows[0].now
    );
  } catch (err) {
    console.error(
      'Database connection failed. Check your .env file.',
      err
    );
  }
});
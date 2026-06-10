import { query } from './db.js';

const setupDatabase = async () => {
  const masterSQL = `
    -- ==========================================
    -- 1. DESTROY EXISTING TABLES (CLEAN SLATE)
    -- ==========================================
    -- CASCADE ensures all foreign key locks are destroyed with them
    DROP TABLE IF EXISTS jwt_tokens CASCADE;
    DROP TABLE IF EXISTS verification_tokens CASCADE;
    DROP TABLE IF EXISTS user_authority CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS organizations CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    -- ==========================================
    -- 2. CREATE PARENT TABLES FIRST
    -- ==========================================
    
    -- Organizations Table
    CREATE TABLE organizations (
      org_id VARCHAR(50) PRIMARY KEY, -- Custom String ID
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Roles Table (Static lookups like 'Admin', 'User')
    CREATE TABLE roles (
      role_id SERIAL PRIMARY KEY,
      role_name VARCHAR(50) UNIQUE NOT NULL
    );

    -- Users Table (With your new VARCHAR constraint)
    CREATE TABLE users (
      user_id VARCHAR(50) PRIMARY KEY, -- Custom String ID (e.g., sreDya2122)
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ==========================================
    -- 3. CREATE CHILD TABLES (DEPENDENCIES)
    -- ==========================================

    -- User Authority (The bridge connecting Users, Orgs, and Roles)
    CREATE TABLE user_authority (
      user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
      org_id VARCHAR(50) REFERENCES organizations(org_id) ON DELETE CASCADE,
      role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, org_id) -- A user can only have one role per organization
    );

    -- Verification Tokens (For Phase 1 Email Verification)
    CREATE TABLE verification_tokens (
      token VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- JWT Tokens (For tracking Refresh Tokens and Login Sessions later)
    CREATE TABLE jwt_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
      refresh_token VARCHAR(255) NOT NULL,
      is_revoked BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Nuking old tables and rebuilding schema...');
    
    // Execute the massive query
    await query(masterSQL);
    
    console.log('✅ All 6 tables created successfully with matching VARCHAR locks!');
    
    // Optional: Insert some default roles so the roles table isn't empty
    await query(`
      INSERT INTO roles (role_name) VALUES ('Admin'), ('Member'), ('Viewer') 
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Default Roles inserted.');

  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  } finally {
    process.exit(); 
  }
};

setupDatabase();
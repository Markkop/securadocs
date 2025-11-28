-- This script runs automatically on first PostgreSQL initialization
-- Creates databases and users for Nextcloud and SecuraDocs

-- Create databases
CREATE DATABASE nextcloud;
CREATE DATABASE securdocs;

-- Create users with passwords
CREATE USER nextcloud WITH ENCRYPTED PASSWORD 'nextcloud_dev_password';
CREATE USER securdocs WITH ENCRYPTED PASSWORD 'securdocs_dev_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nextcloud TO nextcloud;
GRANT ALL PRIVILEGES ON DATABASE securdocs TO securdocs;

-- Connect to nextcloud database and grant schema permissions
\c nextcloud
GRANT ALL ON SCHEMA public TO nextcloud;

-- Connect to securdocs database and grant schema permissions
\c securdocs
GRANT ALL ON SCHEMA public TO securdocs;

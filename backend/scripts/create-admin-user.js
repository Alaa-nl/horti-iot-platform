const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminUser() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'horti_iot',
    user: process.env.DB_USER || 'horti_user',
    password: process.env.DB_PASSWORD || 'horti_password'
  });

  try {
    console.log('Connecting to database...');

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Insert the admin user
    const insertUserQuery = `
      INSERT INTO users (
        email,
        password_hash,
        name,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, name, role;
    `;

    const userResult = await pool.query(insertUserQuery, [
      'admin@it.com',
      hashedPassword,
      'IT Administrator',
      'admin',
      true
    ]);

    const user = userResult.rows[0];
    console.log('✅ Admin user created/updated successfully:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   ID:', user.id);

    // Grant admin access to all existing greenhouses
    const grantAccessQuery = `
      INSERT INTO user_greenhouse_permissions (user_id, greenhouse_id, permission_type, granted_by)
      SELECT
        $1,
        g.id,
        'manage',
        $1
      FROM greenhouses g
      ON CONFLICT (user_id, greenhouse_id) DO UPDATE SET
        permission_type = EXCLUDED.permission_type;
    `;

    const accessResult = await pool.query(grantAccessQuery, [user.id]);
    console.log(`✅ Granted access to ${accessResult.rowCount} greenhouses`);

    // Log the creation in audit logs
    const auditQuery = `
      INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP);
    `;

    await pool.query(auditQuery, [
      user.id,
      'create_admin_user',
      'user',
      user.id,
      JSON.stringify({
        email: 'admin@it.com',
        role: 'admin',
        created_via: 'script'
      })
    ]);

    console.log('✅ Audit log entry created');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: admin@it.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection failed. Please ensure:');
      console.log('   - Database server is running');
      console.log('   - Connection details in .env are correct');
      console.log('   - Database "horti_iot" exists');
    }
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUser();
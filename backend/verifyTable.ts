/**
 * Verify sap_flow table exists and has correct structure
 */

import database from './src/utils/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyTable() {
  console.log('📊 Verifying sap_flow table...\n');

  try {
    // Check if table exists
    const tableExists = await database.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sap_flow'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.error('❌ Table sap_flow does not exist!');
      return;
    }

    console.log('✅ Table sap_flow exists\n');

    // Get column information
    const columns = await database.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sap_flow'
      ORDER BY ordinal_position
    `);

    console.log('Table structure:');
    console.log('================');
    columns.rows.forEach((col: any) => {
      console.log(`${col.column_name}:`.padEnd(25) +
                  `${col.data_type}`.padEnd(25) +
                  `${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`.padEnd(10) +
                  `${col.column_default || ''}`);
    });

    // Check indexes
    const indexes = await database.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'sap_flow'
    `);

    console.log('\nIndexes:');
    console.log('========');
    indexes.rows.forEach((idx: any) => {
      console.log(`- ${idx.indexname}`);
    });

    // Check constraints
    const constraints = await database.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'sap_flow'::regclass
    `);

    console.log('\nConstraints:');
    console.log('============');
    constraints.rows.forEach((con: any) => {
      const type = con.contype === 'p' ? 'PRIMARY KEY' :
                   con.contype === 'u' ? 'UNIQUE' :
                   con.contype === 'c' ? 'CHECK' :
                   con.contype === 'f' ? 'FOREIGN KEY' : con.contype;
      console.log(`- ${con.conname}: ${type}`);
    });

    // Count existing records
    const count = await database.query('SELECT COUNT(*) FROM sap_flow');
    console.log(`\n📈 Current record count: ${count.rows[0].count}`);

    console.log('\n✅ Table verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await database.close();
  }
}

// Run verification
verifyTable().catch(console.error);
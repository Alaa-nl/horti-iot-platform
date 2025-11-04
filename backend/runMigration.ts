/**
 * Run Migration Script
 * Executes the SQL migration to create the sap_flow table
 */

import database from './src/utils/database';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  console.log('🚀 Running migration to create sap_flow table...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/008_create_sap_flow_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const firstLine = statement.split('\n')[0].substring(0, 50);

      process.stdout.write(`${i + 1}. Executing: ${firstLine}...`);

      try {
        await database.query(statement);
        console.log(' ✅');
      } catch (error: any) {
        console.log(' ❌');
        console.error(`   Error: ${error.message}`);
        // Continue with other statements even if one fails
      }
    }

    // Verify the table was created
    console.log('\n📊 Verifying table structure...');
    const result = await database.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sap_flow'
      ORDER BY ordinal_position
    `);

    console.log('\nTable columns:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run the migration
runMigration().catch(console.error);
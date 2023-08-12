import postgres from 'postgres'
import * as core from '@actions/core'

export type Database = {
  id: number
  database: string
  password: string
  user: string
  createdAt: Date
}

const DB_SERVER = core.getInput('PREVIEW_DB_SERVER')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CONNECTION_CONFIG = {
  // Avoid zombie connections
  idle_timeout: 20,
  max_lifetime: 60 * 30
}

const sql = postgres(DB_SERVER, {
  database: 'preview-databases'
})

export default sql

export const setupPrimaryDbIfNotExists = async () => {
  const dbServerSql = postgres(DB_SERVER)

  try {
    const previewDatabases =
      await dbServerSql`select datname from pg_database where datname = 'preview-databases';`

    if (previewDatabases.length === 0) {
      await dbServerSql`CREATE DATABASE "preview-databases";`

      const response = await sql`
        CREATE TABLE IF NOT EXISTS "Database" (
          "id" SERIAL NOT NULL,
          "user" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "database" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
          CONSTRAINT "Database_pkey" PRIMARY KEY ("id")
        );
        `

      if (response) {
        return true
      }
    }
    return
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(
        `Oops, something went wrong setting up primary DB ${error.message}`
      )
    }
  } finally {
    core.info('dbServerSql connection terminated')
    await dbServerSql.end()
  }
}

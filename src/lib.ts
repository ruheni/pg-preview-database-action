import * as core from '@actions/core'
import sql, { Database } from './db'

type Input = {
  user: string
  password: string
  database: string
}

export const provision = async ({ user, password, database }: Input) => {
  try {
    await sql`CREATE DATABASE ${sql(database)};`
    await sql`CREATE USER ${sql(user)} WITH PASSWORD '${sql(
      password
    )}' CREATEDB;`
    await sql`GRANT ALL PRIVILEGES ON DATABASE ${sql(database)} TO ${sql(
      user
    )};`
    await sql`REVOKE ALL PRIVILEGES ON SCHEMA public FROM ${sql(user)};`
    const data = await sql<Database[]>`insert into "Database" ${sql({
      user,
      password,
      database
    })} returning id, user, "database", password;`

    if (data) return data[0]
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    }
  }
}

export const deprovision = async (database: string) => {
  try {
    const previewDatabase = await sql<
      Database[]
    >`SELECT * from "Database" WHERE database = ${database}`
    if (!previewDatabase) throw new Error('Preview Database not found')

    await sql`
        DROP DATABASE IF EXISTS ${sql(previewDatabase[0].database)};
      `
    await sql`DROP ROLE ${sql(previewDatabase[0].user)}`
    await sql`DELETE FROM "Database" where id = ${previewDatabase[0].id} RETURNING *`
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    }
  }
}

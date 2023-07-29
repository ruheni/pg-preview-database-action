import { PrismaClient } from '@prisma/client'
import * as core from '@actions/core'

type Input = {
  user: string
  password: string
  database: string
}

const prisma = new PrismaClient()

const sleep = async (ms: number) =>
  new Promise(res => {
    setTimeout(res, ms)
  })

const series = async (
  iterable: number[],
  action: (arg: unknown) => Promise<unknown>
) => {
  for (const x of iterable) {
    await action(x)
  }
}

export const provision = async ({ user, password, database }: Input) => {
  try {
    const operations = [
      await prisma.$executeRawUnsafe(`CREATE DATABASE "${database}";`),
      await prisma.$executeRawUnsafe(`
        CREATE USER "${user}" WITH PASSWORD '${password}' CREATEDB;
      `),
      await prisma.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON DATABASE "${database}" TO "${user}";`
      ),
      await prisma.$executeRawUnsafe(
        `REVOKE ALL PRIVILEGES ON SCHEMA public FROM "${user}";`
      )
    ]

    series(operations, async () => sleep(10))

    const data = await prisma.database.create({
      data: {
        database,
        user,
        password
      },
      select: {
        database: true,
        user: true,
        password: true
      }
    })
    return data
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    }
  }
}

export const deprovision = async (database: string) => {
  try {
    const previewDatabase = await prisma.database.findFirst({
      where: {
        database
      },
      select: {
        id: true,
        user: true,
        database: true
      }
    })

    if (!previewDatabase) throw new Error('Preview Database not found')

    const operations = [
      await prisma.$executeRawUnsafe(`
        DROP DATABASE IF EXISTS "${previewDatabase.database}";
      `),
      await prisma.$executeRawUnsafe(`DROP ROLE "${previewDatabase.user}"`),
    ]

    series(operations, async () => sleep(10))

    await prisma.database.delete({
      where: { id: previewDatabase.id }
    })

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    }
  }
}

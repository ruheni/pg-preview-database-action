import { PrismaClient } from '@prisma/client'
import * as core from '@actions/core'

type Input = {
  user: string
  password: string
  database: string
}

const prisma = new PrismaClient()

export const provision = async ({ user, password, database }: Input) => {
  try {
    const [, data] = await prisma.$transaction([
      prisma.$executeRaw`
        CREATE USER ${user} WITH PASSWORD ${password} CREATEDB;
        GRANT provisioned_user TO ${user};
        CREATE DATABASE ${database};
      `,
      prisma.database.create({
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
    ])

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

    await prisma.$transaction([
      prisma.$executeRaw`
        DROP DATABASE IF EXISTS ${previewDatabase.database};
        DROP ROLE ${previewDatabase.user}
      `,
      prisma.database.delete({
        where: { id: previewDatabase.id }
      })
    ])

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    }
  }
}

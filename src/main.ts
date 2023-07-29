import * as core from '@actions/core'
import * as github from '@actions/github'
import { uniqueNamesGenerator, adjectives, names } from 'unique-names-generator'
import generatePassword from 'password-generator'

import { $ } from 'execa'
import { deprovision, provision } from './db'

async function run(): Promise<void> {
  try {
    const databaseServer = core.getInput('PREVIEW_DB_SERVER')
    core.debug(databaseServer)

    // Setup Primary Preview DB for tracking other preview databases
    const database = new URL('/preview-databases', databaseServer).toString()
    core.debug(database)
    const $$ = $({
      env: {
        DATABASE_URL: database
      }
    })

    const { exitCode } = await $$`prisma migrate deploy`

    if (exitCode !== 0) {
      core.setFailed('')
    }

    const previewDatabase = `preview-db-${github.context.payload.pull_request?.number}`

    const event = github.context.action

    if (event === 'opened' || event === 'reopened') {
      // provision
      const user = uniqueNamesGenerator({
        dictionaries: [adjectives, names],
        style: 'lowerCase'
      })
      const password = generatePassword(12, false, /([a-z|A-Z])/)

      await provision({ user, password, database: previewDatabase })
    }
    if (event === 'closed') {
      await deprovision(previewDatabase)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()

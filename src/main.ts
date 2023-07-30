import * as core from '@actions/core'
import * as github from '@actions/github'
import { uniqueNamesGenerator, adjectives, names } from 'unique-names-generator'
import generatePassword from 'password-generator'

import { deprovision, provision } from './lib'
import { setupPrimaryDbIfNotExists } from './db'

async function run(): Promise<URL | void> {
  try {
    const databaseServer = core.getInput('PREVIEW_DB_SERVER')

    await setupPrimaryDbIfNotExists()

    const previewDatabase = `preview-db-${github.context.payload.pull_request?.number}`

    const event = github.context.action

    if (event === 'opened' || event === 'reopened') {
      const user = uniqueNamesGenerator({
        dictionaries: [adjectives, names],
        style: 'lowerCase'
      })
      const password = generatePassword(12, false, /([a-z|A-Z])/)

      const response = await provision({
        user,
        password,
        database: previewDatabase
      })

      if (response) {
        const previewDatabaseUrl = new URL(response.database, databaseServer)
        previewDatabaseUrl.password = response.password
        previewDatabaseUrl.username = response.user

        return previewDatabaseUrl
      }
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

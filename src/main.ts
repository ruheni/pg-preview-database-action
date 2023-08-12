import * as core from '@actions/core'
import * as github from '@actions/github'
import { uniqueNamesGenerator, adjectives, names } from 'unique-names-generator'
import generatePassword from 'password-generator'
import fs from 'fs'

import { deprovision, provision } from './lib'
import { setupPrimaryDbIfNotExists } from './db'

async function run(): Promise<URL | void> {
  const pullRequest = github.context.payload.pull_request

  const eventPath = process.env.GITHUB_EVENT_PATH

  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH environment variable not set.')
  }

  // Read and parse the GitHub event payload
  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))

  // Extract Pull Request Action
  const pullRequestAction = eventData.action

  if (pullRequest) {
    try {
      const databaseServer = core.getInput('PREVIEW_DB_SERVER')

      await setupPrimaryDbIfNotExists()

      const previewDatabase = `preview-db-${pullRequest.number}`

      if (pullRequestAction === 'opened' || pullRequestAction === 'reopened') {
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
          previewDatabaseUrl.protocol = 'postgresql'
          previewDatabaseUrl.username = response.user
          previewDatabaseUrl.password = response.password

          return previewDatabaseUrl
        }
      }
      if (pullRequestAction === 'closed') {
        await deprovision(previewDatabase)
      }
    } catch (error) {
      if (error instanceof Error) {
        core.setFailed(error.message)
      }
    }
  }
}

run()

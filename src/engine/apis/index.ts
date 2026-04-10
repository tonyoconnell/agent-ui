/**
 * Pre-built API units for common services.
 * Each returns an apiUnit() wired with the right base URL, auth, and headers.
 *
 * Usage:
 *   net.units['github'] = github(GITHUB_TOKEN)
 *   net.signal({ receiver: 'github:post',
 *     data: { path: '/repos/owner/repo/pulls', body: { title: 'PR', head: 'feat', base: 'main' } }
 *   }, 'loop')
 */

import { apiUnit } from '../api'

export const github = (token: string) => apiUnit('github', {
  base: 'https://api.github.com',
  auth: `Bearer ${token}`,
  headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
})

export const slack = (token: string) => apiUnit('slack', {
  base: 'https://slack.com/api',
  auth: `Bearer ${token}`,
})

export const notion = (token: string) => apiUnit('notion', {
  base: 'https://api.notion.com/v1',
  auth: `Bearer ${token}`,
  headers: { 'Notion-Version': '2022-06-28' },
})

export const linear = (token: string) => apiUnit('linear', {
  base: 'https://api.linear.app',
  auth: `Bearer ${token}`,
})

export const pagerduty = (token: string) => apiUnit('pagerduty', {
  base: 'https://api.pagerduty.com',
  auth: `Token token=${token}`,
})

export const mailchimp = (token: string, dc: string) => apiUnit('mailchimp', {
  base: `https://${dc}.api.mailchimp.com/3.0`,
  auth: `Bearer ${token}`,
})

export const discord = (botToken: string) => apiUnit('discord', {
  base: 'https://discord.com/api/v10',
  auth: `Bot ${botToken}`,
})

export const stripe = (secretKey: string) => apiUnit('stripe', {
  base: 'https://api.stripe.com/v1',
  auth: `Bearer ${secretKey}`,
})

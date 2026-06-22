import { CLIENT_API_URL } from './config'

export async function fetchClientStats() {
  const res = await fetch(`${CLIENT_API_URL}/api/stats`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

export async function fetchRecentReviewers() {
  const res = await fetch(`${CLIENT_API_URL}/api/reviews/reviewers`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

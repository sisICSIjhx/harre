import { isIsoDate } from './format.js'

export function ageInYears(
  birthDate: string | null | undefined,
  today = new Date(),
): number | null {
  if (!birthDate || !isIsoDate(birthDate) || Number.isNaN(today.getTime())) return null
  const [year = 0, month = 0, day = 0] = birthDate.split('-').map(Number)
  let age = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day))
    age--
  return age >= 0 ? age : null
}

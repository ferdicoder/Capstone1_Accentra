export default function toISODateString(input) {
  if (!input) return null

  const date = new Date(input)

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${input}`)
  }

  // Use local date parts to avoid UTC off-by-one shifts
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}` // e.g. "1998-04-23"
}
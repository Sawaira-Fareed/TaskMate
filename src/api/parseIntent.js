export async function parseIntent(rawText) {
  const text = rawText.toLowerCase()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toTimeString().slice(0, 5)

  let service_type = 'plumber'
  if (text.includes('electric') || text.includes('bijli')) service_type = 'electrician'
  else if (text.includes('grocery') || text.includes('atta') || text.includes('doodh')) service_type = 'grocery'
  else if (text.includes('computer') || text.includes('laptop')) service_type = 'computer_repair'

  const language = /[\u0600-\u06FF]/.test(rawText) ? 'urdu' : 'english'

  let urgency = 'normal'
  if (text.includes('urgent') || text.includes('emergency') || text.includes('jaldi')) urgency = 'urgent'

  return {
    service_type,
    items: [],
    preferred_date: today,
    preferred_time: now,
    language,
    urgency
  }
}

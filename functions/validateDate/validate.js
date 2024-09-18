export function checkDate(date) {
  const dateOrder = new Date(date)
  const dateNow = new Date()

  const dayDiff = dateNow - dateOrder

  const diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));
  return diferenciaDias
}

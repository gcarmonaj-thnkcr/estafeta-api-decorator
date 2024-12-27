export function checkDate(date: string, endDate?: string) {
  const dateOrder = new Date(date);
  const dateNow = endDate ? new Date(endDate) : new Date();

  // Normalizar la fecha sin afectar la zona horaria
  const normalizedDateOrder = new Date(Date.UTC(dateOrder.getUTCFullYear(), dateOrder.getUTCMonth(), dateOrder.getUTCDate()));
  const normalizedDateNow = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth(), dateNow.getUTCDate()));

  console.log('Fecha enviada (normalizada a UTC):', normalizedDateOrder);
  console.log('Fecha actual (normalizada a UTC):', normalizedDateNow);

  const dayDiff = normalizedDateNow.getTime() - normalizedDateOrder.getTime();
  const diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));

  return diferenciaDias;
}

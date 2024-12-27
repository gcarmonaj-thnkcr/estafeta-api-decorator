export function checkDate(date: string, endDate?: string) {
  const dateOrder = new Date(date);
  const dateNow = endDate ? new Date(endDate) : new Date();

  dateOrder.setDate(dateOrder.getDate() -1 )
  dateOrder.setHours(0, 0, 0, 0);
  dateNow.setHours(0, 0, 0, 0);

  console.log('Date Now:', dateNow.toLocaleDateString());
  console.log('Date Order:', dateOrder.toLocaleDateString());

  const dayDiff = dateNow.getTime() - dateOrder.getTime();
  const diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));

  return diferenciaDias;
}

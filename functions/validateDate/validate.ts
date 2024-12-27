export function checkDate(date: string, endDate: string | undefined) {
  console.log(date)
  const dateOrder = new Date(date);
  const dateNow = endDate ? new Date(endDate) : new Date();

  console.log(dateOrder)

  dateOrder.setHours(0, 0, 0, 0);
  dateNow.setHours(0, 0, 0, 0);

  console.log(dateNow);
  console.log(dateOrder);

  const dayDiff = dateNow.getTime() - dateOrder.getTime();
  const diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));
  
  return diferenciaDias;
}

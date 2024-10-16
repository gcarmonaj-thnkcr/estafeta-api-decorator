export const FormaterDate = (date: string, withTime: boolean) => {
  if (!date || date == '') return '';
  const newDate = new Date(date);

  const configDate = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  const configTime = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  //@ts-ignore
  const formattedDate = newDate.toLocaleDateString('es-ES', {
    ...configDate,
    ...(withTime ? configTime : {}),
  });

  return formattedDate.replace(',', '');
};

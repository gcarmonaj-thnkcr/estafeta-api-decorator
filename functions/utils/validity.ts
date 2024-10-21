export const getValidityData = (isPickup: boolean = false) => {
  const validityDays = {
    qr: parseInt(process.env.QR_VALIDITY_DAYS || '15'),
    pickup: parseInt(process.env.PDF_VALIDITY_DAYS || '30'),
  };

  let days = isPickup ? validityDays.pickup : validityDays.qr;

  const date = new Date();

  date.setDate(date.getDate() + days);

  let base: any = {
    qrStatus: 'active',
    validityDays: days,
    validityDate: date.toISOString(),
  };

  if (!isPickup)
    base = {
      ...base,
      renovationDate: null,
      renovationEndDate: null,
      updatedAddress: false,
    };

  return base;
};

export const getValidityData = (isPickup: boolean = false, isPudo: boolean = false) => {
  const validityDays = {
    qr: parseInt(process.env.QR_VALIDITY_DAYS || '15'),
    pickup: parseInt(process.env.PDF_VALIDITY_DAYS || '30'),
    pudo: parseInt(process.env.PUDO_VALIDITY_DAYS || '7'),
  };

  let days = isPickup ? validityDays.pickup : isPudo ? validityDays.pudo : validityDays.qr;

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

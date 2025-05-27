import axios from "axios";

export const getChargeByTransactionId = async (transactionId: string) => {
  const token = Buffer.from(`${process.env.OPENPAY_PRIMARY_KEY}:`, 'utf8').toString('base64');

  const urlRequest = `${process.env.OPENPAY_URL}/${process.env.OPENPAY_MERCHANT_ID}/charges/${transactionId}`
  try{
    const request = await axios.get(urlRequest, {
      headers: {
        "Authorization": `Basic ${token}`
      }
    })
    if (request.status >= 300) return request.data.description
    return request.data
  } catch(err: any){
    console.error("Openpay error:",err)
    return err
  }
}

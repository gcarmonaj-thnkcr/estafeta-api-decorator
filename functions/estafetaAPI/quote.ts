import axios from "axios";
import { authToken } from "./auth";

export async function handleCotizacion(body: any) {
  const data = body

  let dataCookie = JSON.stringify(data);
  const token = await authToken({ type: 'quote'})
  const config = {
    method: 'post',
    url: 'https://wscotizadorqa.estafeta.com/Cotizacion/rest/Cotizador/Cotizacion',
    headers: {
      apikey: 'l7beefb34b43bc44ef8d318541258df87c',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Cookie: 'BIGipServerCaildad_8443=!WuZyHrCif8e/oHAeQuK4+sWx1d8MfXw6kMKwes1XaUfnA1qegtN97nV/TkPw6P8sisaPvspWFcz1IX8=',
    },
    data: JSON.stringify(data),
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error: any) {
    console.error('Error: Cotizacion', error.response ? error.response.data : error.message);
    throw error;
  }
}

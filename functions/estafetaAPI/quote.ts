import axios from "axios";
import { authToken } from "./auth";

export async function handleCotizacion(body: any) {
  const data = body

  let dataCookie = JSON.stringify(data);
  const token = await authToken({ type: 'quote'})
  const config = {
    method: 'post',
    url: 'https://wscotizador.estafeta.com/Cotizacion/rest/Cotizador/Cotizacion',
    headers: {
      apikey: 'l7beefb34b43bc44ef8d318541258df87c',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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


export async function handleCotizacionInternacional(body: any) {
  const data = body

  const token = await authToken({ type: 'quoteInternacional' });
  console.log(data)
  const config = {
    method: 'post',
    url: 'https://apimwscotizador.estafeta.com/Cotizacion/rest/Cotizador/InternationalQuotation?SALES_ORGANIZATION&CUSTOMER',
    headers: {
      apikey: 'f3bb437a10d348c99eeeb0101de13013',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify(data),
  };

  try {
    console.log("Config",config)
    const response = await axios.request(config);

    console.log("Response international:",response.data)
    return response.data;

  } catch (error: any) {
    console.error('Error: Cotizacion', error.message);
    return error.message;
  }
}

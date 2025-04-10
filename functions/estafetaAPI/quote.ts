import axios from "axios";
import { authToken } from "./auth";
import { logger } from "../utils/logger";

export async function handleCotizacion(body: any) {
  const data = body

  let dataCookie = JSON.stringify(data);
  const token = await authToken({ type: 'quote'})
  const config = {
    method: 'post',
    url: process.env.URL_COTIZADOR,
    headers: {
      apikey: process.env.API_KEY_COTIZADOR,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify(data),
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error: any) {
    console.log(token, "TOKEN Cotizador");
    console.log('Error: iD', process.env.ClientIdQuote);
    console.log('Error: Secret', process.env.ClientSecretQuote);
    console.error('Error: Cotizacion', error.response ? error.response.data : error.message);
    throw error;
  }
}


export async function handleCotizacionInternacional(body: any) {
  const data = body

  const token = await authToken({ type: 'quoteInternacional' });
  const config = {
    method: 'post',
    url: process.env.URL_COTIZADOR_INT,
    headers: {
      apikey: process.env.API_KEY_COTIZADOR_INT,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify(data),
  };

  try {
    logger.info(`Config ${JSON.stringify(config)}`)
    const response = await axios.request(config);

    logger.info(`Response international: ${JSON.stringify(response.data)}`)
    return response.data;

  } catch (error: any) {
    logger.error(`Error: Cotizacion ${error.message}`);
    return error.message;
  }
}

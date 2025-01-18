import axios from "axios";
import { authToken } from "./auth";

export const CreateFolios = async (quantityFolios: number) => {
  const token = await authToken({ type: 'folios' })

  let data = JSON.stringify({
    "applicationName": "TiendaEstafeta",
    "validityTime": "24", // dado por horas
    "format": "TDA-%06d", /// fiexd prefix Q3SQR
    "count": quantityFolios
  });

  const config = {
    method: 'post',
    url: 'https://wsbotrastreo.estafeta.com/Folios_IS/rest/FoliosManagement/CreateFolio',
    headers: { 
      'apikey': 'l7fa71f4ddb9b14ae3a4cf799269f3aed4', 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`, 
    },
    data : data
  };

  try {
    const response = await axios.request(config);
    debugger  
    return {
      data: response.data,
      message: undefined,
    }
  } catch (error: any) {
    debugger
    console.error('Error Response: ', error.response);
    console.error('Error Message: ', error.message);
    return {
      data: "",
      message: error.message
    }
  }
}

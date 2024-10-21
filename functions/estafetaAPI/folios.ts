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
    url: 'https://apimwsbotrastreoqa.estafeta.com/Folios_IS/rest/FoliosManagement/CreateFolio',
    headers: { 
      'apikey': 'dde71ba840d743e1b217db74e4785574', 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`, 
      'Cookie': 'dd4f03=pdaswPuDm9YyIYorIacttqNYnhSBitzehBSStG2X5HPhv3ijCDKesbRzoSQkgQX5QbFA7eQoQUwuYma/CTSimSpocQ6/wtBu/M1EV0JoxRx8q4eGZO/b1VCKBVNundXbMxDuhiX90iuiUu0zlk0FOePVlKLg8rWp8/N0Fq+J+ro0FWde'
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

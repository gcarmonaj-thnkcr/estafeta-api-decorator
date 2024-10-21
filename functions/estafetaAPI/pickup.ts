import axios from "axios";
import { PickupRequest } from "../interfaces/pickupModel";
import { authToken } from "./auth";

export const newPickUp = async (pickupOrder: PickupRequest) => {
  const token = await authToken({type: "newPickUp"})
  const data = JSON.stringify(pickupOrder)
  const  config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://apimwspickupqa.estafeta.com/v2/MiEstafetaServices/rest/PickupAPI/NewPickup',
    headers: { 
      'apikey': '0bd16b9f856f479898b5193d6492ac8f', 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`, 
      'Cookie': 'dd4f03=GjZaiNtC4suo8uUP8brOKLQ7hIZT5L5e32Dna+FWmWFGDsj9hP9sartkcsP3Q8oksx7fXFyxgB/EyfZgdGsle2Jj9x6JEMVJiUbG4bdv3Aax5R65C4kxw10gF4AdEXlZA9U1ni3rt1c9sT9hDwgT9KxRghV04lxA2bw3xjIO+GSP/jNd'
    },
    data : data
  };

  try{
    const request = await axios.request(config)
    debugger
    return request.data
  } catch(err: any) {
    return err.message
  }
}

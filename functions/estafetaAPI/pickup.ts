import axios from "axios";
import { PickupRequest } from "../interfaces/pickupModel";
import { authToken } from "./auth";

export const newPickUp = async (pickupOrder: PickupRequest) => {
  const token = await authToken({type: "newPickUp"})
  const data = JSON.stringify(pickupOrder)
  const  config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://wspickup.estafeta.com/v2/MiEstafetaServices/rest/PickupAPI/NewPickup',
    headers: { 
      'apikey': '0bd16b9f856f479898b5193d6492ac8f', 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`, 
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

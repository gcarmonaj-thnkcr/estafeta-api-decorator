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
      'apikey': 'l706a9c7720e524ad2a0296b300db7955b', 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`, 
    },
    data : data
  };

  try{
    const request = await axios.request(config)
    console.log("Request pickups", request)
    debugger
    return request.data
  } catch(err: any) {
    console.error("Error in pickup", err)
    return err.message
  }
}

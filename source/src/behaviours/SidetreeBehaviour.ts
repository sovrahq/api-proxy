import Behaviour from "./Behaviour";
import { validateIdentifier } from "../utils";
import axios from "axios";
export default class SidetreeBehaviour implements Behaviour {
  async resolve(did: String, method: string, url: string) {
    const method_length = method.length + ((method.slice(-1) === ':') ? 0 : 1);
    console.log(`getting: ${url}/resolve/${did.substring(method_length)}`)
    //  return `${url}/resolve/${did.substring(method_length )}`;
    try {
      return (await axios.get(`${url}/resolve/${did.substring(method_length)}`)).data;
    } catch (error) {
      return error.response?.data ?? { error: error.message };
    }
  }

  validate(did: String, method: string): boolean {
    const method_length = method.length + ((method.slice(-1) === ':') ? 0 : 1);
    if (did.charAt(method_length - 1) !== ':')
      return false;
    return validateIdentifier(did.substring(method_length));
  }

  async registry(request: any, url: string): Promise<any> {
    try {
      return (await axios.post(`${url}/create`, request)).data;
    } catch (error) {
      return error.response?.data ?? { error: error.message };
    }
  }
}
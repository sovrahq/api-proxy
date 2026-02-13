import Behaviour from "./Behaviour";
import {validateIdentifier}from "../utils";
import axios from "axios";

export default class UniversalBehaviour implements Behaviour{
    
    registry(request: any, url: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    
    async resolve(did: String , method:string , url:string) {
        console.log(`${url}/1.0/identifiers/${did}`)
        try{
        const res = await axios.get(`${url}/1.0/identifiers/${did}`)
         return res.data
        }catch(error){
            const res = error.response;
            if(!res)
                return { error: error.message };
            if(res.status == 404)
                return 'did not found'
            if(res.status >= 500)
                return 'universal resolver server error'
            return 'unknown error'
        }
    }

    validate(did: String , method:string): boolean {
        return true;
    }
}
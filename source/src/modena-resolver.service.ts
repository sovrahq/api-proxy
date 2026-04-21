import { Injectable } from '@nestjs/common';
import mappings from './config/methods.json';
import Behaviour from './behaviours/Behaviour';
import axios from 'axios';
import { BehaviourManager } from './behaviours/BehaviourManager';
import { CreateDIDRequest } from './models/create-did-request';
import { ENVIROMENT } from './main';

const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
@Injectable()
export class AppService {
  behaviours: BehaviourManager
  _mappings: Mappings;

  constructor() {
    this.behaviours = new BehaviourManager();
  }

  ping(): string {
    return 'pong';
  }

  getMappings() {
    if (!this._mappings) {
      let nodeNumber = 1;
      let nodeUrl = ENVIROMENT[`NODE_1_URL`];

      if (!nodeUrl) {
        console.error("you should at least configure one node using the following environment variable: 'NODE_1_URL'");
        console.info("config/methods.json will used will be used instead of environment variables configuration");

        this._mappings = mappings;

        return this._mappings;
      }
      this._mappings = new Mappings();

      while (nodeUrl) {
        const pn = new ProxyNode();6

        pn.url = nodeUrl;
        pn.pattern = ENVIROMENT[`NODE_${nodeNumber}_PATTERN`];
        pn.behavior = +(ENVIROMENT[`NODE_${nodeNumber}_BEHAVIOR`] ? +ENVIROMENT[`NODE_${nodeNumber}_BEHAVIOR`] : 1);

        if (!pn.pattern) {
          throw new Error(`You need to configure NODE_${nodeNumber}_PATTERN`);
        }

        if (!pn.behavior) {
          throw new Error(`You need to configure NODE_${nodeNumber}_BEHAVIOR`);
        }

        this._mappings.list.push(pn);

        console.info(`NODE_${nodeNumber} configured: ${JSON.stringify(pn)}`)

        nodeNumber++;
        nodeUrl = ENVIROMENT[`NODE_${nodeNumber}_URL`];
      }
    }
    return this._mappings;
  }

  //1 - Utils.ts => Checkear que lo que me queda si es un identifier del did ( me fijo si es base 64 o dos base64 con :)
  //2 - Clase de Sidetree behaviour
  //3 - Clase de Universal behaviour ( si no tiene behaviour o == 0)
  //4 - Ordenar los methods por index

  async resolveDID(did: String): Promise<String> {

    for (let idx = 0; idx < this.getMappings().list.length; idx++) {
      const pattern = new RegExp("^" + this.getMappings().list[idx].pattern + '*');
      const actualResolver = this.getMappings().list[idx];

      if (did.match(pattern)) {
        const behaviour = this.behaviours.get(actualResolver.behavior)

        if (!behaviour.validate(did, actualResolver.pattern)) {
          return "bad did";
        }
        return behaviour.resolve(did, actualResolver.pattern, actualResolver.url);
      }
    }
  }
  async resolveDIDWithMetadata(did: String): Promise<any> {
    for (let idx = 0; idx < this.getMappings().list.length; idx++) {
      const pattern = new RegExp("^" + this.getMappings().list[idx].pattern + '*');
      const actualResolver = this.getMappings().list[idx];

      if (did.match(pattern)) {
        const behaviour = this.behaviours.get(actualResolver.behavior);

        if (!behaviour.validate(did, actualResolver.pattern)) {
          return "bad did";
        }
        return behaviour.resolveWithMetadata(did, actualResolver.pattern, actualResolver.url);
      }
    }
  }

  async createDID(request: any): Promise<any> {
    // Wrapped format from universal registry: {modenaRequest, didMethod}
    if (request.modenaRequest && request.didMethod) {
      const didMethod = this.getMappings().list.find(x => x.pattern == request.didMethod);

      if (didMethod) {
        const behaviour = this.behaviours.get(didMethod.behavior)
        const result = await behaviour.registry(JSON.parse(request.modenaRequest), didMethod.url);
        return result;
      }

      throw new Error("Did Method not supported");
    }

    // Raw Sidetree operation (update/recover/deactivate) — resolve DID first to find correct backend
    if (request.type && request.didSuffix) {
      // Try to resolve the DID suffix against each backend to find which one owns it
      let targetNode = null;
      for (const node of this.getMappings().list) {
        const fullDid = `${node.pattern}:${request.didSuffix}`;
        try {
          const resolveResult = await axios.get(`${node.url}/resolve/${request.didSuffix}`);
          if (resolveResult.data && resolveResult.data.id) {
            targetNode = node;
            console.log(`Routed ${request.type} for suffix ${request.didSuffix} to ${node.pattern} (${node.url})`);
            break;
          }
        } catch (e) {
          // DID not found on this backend, try next
        }
      }

      // Forward to the backend that owns the DID, or try all as fallback (for create-like operations)
      const nodesToTry = targetNode ? [targetNode] : this.getMappings().list;
      const errors = [];
      for (const node of nodesToTry) {
        const behaviour = this.behaviours.get(node.behavior);
        try {
          const result = await behaviour.registry(request, node.url);
          return result;
        } catch (e) {
          errors.push(`${node.pattern}: ${e.response?.data ? JSON.stringify(e.response.data) : e.message}`);
        }
      }
      throw new Error(`No backend could process the operation: ${errors.join('; ')}`);
    }

    throw new Error("Invalid request format");
  }
}

export class Mappings {
  list: ProxyNode[] = new Array<ProxyNode>();
}

export class ProxyNode {
  behavior: number;
  pattern: string;
  url: string;
}
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateDIDRequest } from './models/create-did-request';
import { AppService } from './modena-resolver.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  healthCheck(): string {
    return 'OK';
  }

  

  @Get("mappings")
  mappings() {
    return this.appService.getMappings();
  }

  @Get("resolve/:did")
  async get(@Param("did") did: string) {
    return await this.appService.resolveDID(new String(did));
  }

  @Get("1.0/identifiers/:did")
  async getWithMetadata(@Param("did") did: string) {
    return await this.appService.resolveDIDWithMetadata(new String(did));
  }

  @Post('create')
  async createDID(@Body() request: CreateDIDRequest) {
    return await this.appService.createDID(request);
  }
}

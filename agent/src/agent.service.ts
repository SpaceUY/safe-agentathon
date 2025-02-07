import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentService {
  getHello(): string {
    return 'Hello World!';
  }
}

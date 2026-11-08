import { Global, Module } from '@nestjs/common';
import { HotelGateway } from './hotel.gateway';

@Global()
@Module({
  providers: [HotelGateway],
  exports: [HotelGateway],
})
export class WebsocketsModule {}

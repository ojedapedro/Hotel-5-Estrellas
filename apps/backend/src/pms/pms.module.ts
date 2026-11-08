import { Module } from '@nestjs/common';
import { RoomsService } from './rooms/rooms.service';
import { RoomsController } from './rooms/rooms.controller';
import { ReservationsService } from './reservations/reservations.service';
import { ReservationsController } from './reservations/reservations.controller';
import { FoliosService } from './folios/folios.service';
import { FoliosController } from './folios/folios.controller';
import { BcvModule } from '../bcv/bcv.module';

@Module({
  imports: [BcvModule],
  controllers: [RoomsController, ReservationsController, FoliosController],
  providers: [RoomsService, ReservationsService, FoliosService],
  exports: [RoomsService, ReservationsService, FoliosService],
})
export class PmsModule {}

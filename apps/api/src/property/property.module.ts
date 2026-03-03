import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { UnitController } from './unit.controller';

@Module({
  controllers: [PropertyController, UnitController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}

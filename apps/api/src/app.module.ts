import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './property/property.module';
import { LeadModule } from './lead/lead.module';
import { ApplicationModule } from './application/application.module';
import { ScreeningModule } from './screening/screening.module';
import { LeaseModule } from './lease/lease.module';
import { DocumentModule } from './document/document.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PropertyModule,
    LeadModule,
    ApplicationModule,
    ScreeningModule,
    LeaseModule,
    DocumentModule,
    TenantModule,
  ],
})
export class AppModule {}

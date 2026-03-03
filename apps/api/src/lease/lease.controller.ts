import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaseService } from './lease.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@tms/database';

@ApiTags('Leases')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('leases')
export class LeaseController {
  constructor(private leaseService: LeaseService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'Create a new lease' })
  async createLease(@Body() body: any) {
    const data = await this.leaseService.createLease(body);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List leases' })
  async getLeases(
    @CurrentUser('organisationId') orgId: string,
    @Query('status') status?: string,
    @Query('unitId') unitId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.leaseService.getLeases({
      organisationId: orgId,
      status,
      unitId,
      tenantId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, ...result };
  }

  @Get('templates')
  @ApiOperation({ summary: 'List lease templates' })
  async getTemplates(@CurrentUser('organisationId') orgId: string) {
    const data = await this.leaseService.getTemplates(orgId);
    return { success: true, data };
  }

  @Post('templates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER)
  @ApiOperation({ summary: 'Create a lease template' })
  async createTemplate(
    @CurrentUser('organisationId') orgId: string,
    @Body() body: any,
  ) {
    const data = await this.leaseService.createTemplate(orgId, body);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lease details' })
  async getLease(@Param('id') id: string) {
    const data = await this.leaseService.getLeaseById(id);
    return { success: true, data };
  }

  @Patch(':id/sign')
  @ApiOperation({ summary: 'Sign a lease (tenant, landlord, or guarantor)' })
  async signLease(
    @Param('id') id: string,
    @Body() body: { role: 'tenant' | 'landlord' | 'guarantor'; signature: string },
  ) {
    const data = await this.leaseService.signLease(id, body.role, body.signature);
    return { success: true, data };
  }

  @Patch(':id/terminate')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
  )
  @ApiOperation({ summary: 'Terminate a lease' })
  async terminateLease(
    @Param('id') id: string,
    @Body() body: { terminationReason: string; moveOutDate: string },
  ) {
    const data = await this.leaseService.terminateLease(
      id,
      body.terminationReason,
      body.moveOutDate,
    );
    return { success: true, data };
  }
}

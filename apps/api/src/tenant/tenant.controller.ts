import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@tms/database';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tenant profile' })
  async createTenant(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const data = await this.tenantService.createTenant(userId, body);
    return { success: true, data };
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'List tenants' })
  async getTenants(
    @CurrentUser('organisationId') orgId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.tenantService.getTenants(orgId, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, ...result };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my tenant profile (for tenant portal)' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    const data = await this.tenantService.getTenantByUserId(userId);
    return { success: true, data };
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'Get tenant 360° view' })
  async getTenant(@Param('id') id: string) {
    const data = await this.tenantService.getTenantById(id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant profile' })
  async updateTenant(@Param('id') id: string, @Body() body: any) {
    const data = await this.tenantService.updateTenant(id, body);
    return { success: true, data };
  }
}

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
import { PropertyService } from './property.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@tms/database';

@ApiTags('Units')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('units')
export class UnitController {
  constructor(private propertyService: PropertyService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER, UserRole.PROPERTY_MANAGER)
  @ApiOperation({ summary: 'Create a unit' })
  async createUnit(
    @CurrentUser('organisationId') orgId: string,
    @Body() body: any,
  ) {
    const data = await this.propertyService.createUnit(orgId, body);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List units' })
  async getUnits(
    @CurrentUser('organisationId') orgId: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.propertyService.getUnits(orgId, {
      propertyId,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit details' })
  async getUnit(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
  ) {
    const data = await this.propertyService.getUnitById(orgId, id);
    return { success: true, data };
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER, UserRole.PROPERTY_MANAGER)
  @ApiOperation({ summary: 'Update a unit' })
  async updateUnit(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.propertyService.updateUnit(orgId, id, body);
    return { success: true, data };
  }
}

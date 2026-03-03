import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('properties')
export class PropertyController {
  constructor(private propertyService: PropertyService) {}

  // ---- PORTFOLIOS ----

  @Post('portfolios')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER)
  @ApiOperation({ summary: 'Create a portfolio' })
  async createPortfolio(
    @CurrentUser('organisationId') orgId: string,
    @Body() body: { name: string; description?: string },
  ) {
    const data = await this.propertyService.createPortfolio(orgId, body);
    return { success: true, data };
  }

  @Get('portfolios')
  @ApiOperation({ summary: 'List all portfolios' })
  async getPortfolios(@CurrentUser('organisationId') orgId: string) {
    const data = await this.propertyService.getPortfolios(orgId);
    return { success: true, data };
  }

  // ---- PROPERTIES ----

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER, UserRole.PROPERTY_MANAGER)
  @ApiOperation({ summary: 'Create a property' })
  async createProperty(
    @CurrentUser('organisationId') orgId: string,
    @Body() body: any,
  ) {
    const data = await this.propertyService.createProperty(orgId, body);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List properties' })
  async getProperties(
    @CurrentUser('organisationId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('portfolioId') portfolioId?: string,
  ) {
    const result = await this.propertyService.getProperties(orgId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      portfolioId,
    });
    return { success: true, ...result };
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(@CurrentUser('organisationId') orgId: string) {
    const data = await this.propertyService.getDashboardStats(orgId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property details' })
  async getProperty(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
  ) {
    const data = await this.propertyService.getPropertyById(orgId, id);
    return { success: true, data };
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER, UserRole.PROPERTY_MANAGER)
  @ApiOperation({ summary: 'Update a property' })
  async updateProperty(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.propertyService.updateProperty(orgId, id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER)
  @ApiOperation({ summary: 'Delete a property (soft delete)' })
  async deleteProperty(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.propertyService.deleteProperty(orgId, id);
    return { success: true, message: 'Property deleted' };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeadService } from './lead.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@tms/database';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('leads')
export class LeadController {
  constructor(private leadService: LeadService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'Create a new lead' })
  async createLead(
    @CurrentUser('organisationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const data = await this.leadService.createLead(orgId, userId, body);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List leads with filters' })
  async getLeads(
    @CurrentUser('organisationId') orgId: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('assignedAgentId') assignedAgentId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.leadService.getLeads(orgId, {
      status,
      propertyId,
      assignedAgentId,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, ...result };
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get pipeline stats (count per status)' })
  async getPipelineStats(@CurrentUser('organisationId') orgId: string) {
    const data = await this.leadService.getPipelineStats(orgId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead details' })
  async getLead(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
  ) {
    const data = await this.leadService.getLeadById(orgId, id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead' })
  async updateLead(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.leadService.updateLead(orgId, id, body);
    return { success: true, data };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update lead status' })
  async updateLeadStatus(
    @CurrentUser('organisationId') orgId: string,
    @Param('id') id: string,
    @Body() body: { status: string; lostReason?: string },
  ) {
    const data = await this.leadService.updateLeadStatus(
      orgId,
      id,
      body.status as any,
      body.lostReason,
    );
    return { success: true, data };
  }
}

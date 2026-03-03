import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ApplicationService } from './application.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@tms/database';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('applications')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  async createApplication(@Body() body: any) {
    const data = await this.applicationService.createApplication(body);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List applications' })
  async getApplications(
    @CurrentUser('organisationId') orgId: string,
    @Query('status') status?: string,
    @Query('unitId') unitId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.applicationService.getApplications({
      organisationId: orgId,
      status,
      unitId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details' })
  async getApplication(@Param('id') id: string) {
    const data = await this.applicationService.getApplicationById(id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an application' })
  async updateApplication(@Param('id') id: string, @Body() body: any) {
    const data = await this.applicationService.updateApplication(id, body);
    return { success: true, data };
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit an application for review' })
  async submitApplication(@Param('id') id: string) {
    const data = await this.applicationService.submitApplication(id);
    return { success: true, data };
  }

  @Patch(':id/review')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'Review an application (approve/decline)' })
  async reviewApplication(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { decision: string; notes?: string; declineReason?: string },
  ) {
    const data = await this.applicationService.reviewApplication(
      id,
      userId,
      body.decision as any,
      body.notes,
      body.declineReason,
    );
    return { success: true, data };
  }

  @Post(':id/consents')
  @ApiOperation({ summary: 'Record a consent (POPIA compliance)' })
  async addConsent(
    @Param('id') id: string,
    @Body() body: { type: string; granted: boolean; version?: string },
    @Req() req: Request,
  ) {
    const data = await this.applicationService.addConsent(
      id,
      body as any,
      req.ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }

  @Post(':id/occupants')
  @ApiOperation({ summary: 'Add an occupant to the application' })
  async addOccupant(@Param('id') id: string, @Body() body: any) {
    const data = await this.applicationService.addOccupant(id, body);
    return { success: true, data };
  }

  @Post(':id/guarantors')
  @ApiOperation({ summary: 'Add a guarantor to the application' })
  async addGuarantor(@Param('id') id: string, @Body() body: any) {
    const data = await this.applicationService.addGuarantor(id, body);
    return { success: true, data };
  }

  @Get(':id/affordability')
  @ApiOperation({ summary: 'Calculate affordability for the application' })
  async calculateAffordability(@Param('id') id: string) {
    const data = await this.applicationService.calculateAffordability(id);
    return { success: true, data };
  }
}

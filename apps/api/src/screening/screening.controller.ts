import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ScreeningService } from './screening.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole, ScreeningCheckType } from '@tms/database';

@ApiTags('Screening')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('screening')
export class ScreeningController {
  constructor(private screeningService: ScreeningService) {}

  @Post('applications/:applicationId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'Initiate screening checks for an application' })
  async initiateScreening(
    @Param('applicationId') applicationId: string,
    @Body() body: { checks: ScreeningCheckType[] },
  ) {
    const data = await this.screeningService.initiateScreening(
      applicationId,
      body.checks,
    );
    return { success: true, data };
  }

  @Get('applications/:applicationId')
  @ApiOperation({ summary: 'Get screening results for an application' })
  async getScreeningResults(@Param('applicationId') applicationId: string) {
    const data = await this.screeningService.getScreeningResults(applicationId);
    return { success: true, data };
  }

  @Get('checks/:id')
  @ApiOperation({ summary: 'Get a specific screening check' })
  async getCheck(@Param('id') id: string) {
    const data = await this.screeningService.getCheckById(id);
    return { success: true, data };
  }
}

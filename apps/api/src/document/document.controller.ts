import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentService } from './document.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@tms/database';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('documents')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload a document' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { applicationId?: string; tenantId?: string; leaseId?: string; type: string },
  ) {
    const data = await this.documentService.uploadDocument(file, {
      applicationId: body.applicationId,
      tenantId: body.tenantId,
      leaseId: body.leaseId,
      type: body.type as any,
    });
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List documents' })
  async getDocuments(
    @Query('applicationId') applicationId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('leaseId') leaseId?: string,
  ) {
    const data = await this.documentService.getDocuments({
      applicationId,
      tenantId,
      leaseId,
    });
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document metadata' })
  async getDocument(@Param('id') id: string) {
    const data = await this.documentService.getDocumentById(id);
    return { success: true, data };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document file' })
  async downloadDocument(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentService.getDocumentById(id);
    const filePath = this.documentService.getFilePath(doc.storageKey);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.fileName}"`,
    );
    res.sendFile(filePath);
  }

  @Patch(':id/verify')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'Verify a document' })
  async verifyDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.documentService.verifyDocument(id, userId);
    return { success: true, data };
  }

  @Patch(':id/reject')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.PROPERTY_MANAGER,
    UserRole.LEASING_AGENT,
  )
  @ApiOperation({ summary: 'Reject a document' })
  async rejectDocument(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const data = await this.documentService.rejectDocument(id, body.reason);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  async deleteDocument(@Param('id') id: string) {
    await this.documentService.deleteDocument(id);
    return { success: true, message: 'Document deleted' };
  }
}

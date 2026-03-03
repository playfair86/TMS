import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType, DocumentStatus } from '@tms/database';
import { MAX_FILE_SIZE_MB, ALLOWED_DOCUMENT_TYPES } from '@tms/shared';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DocumentService {
  private uploadDir: string;

  constructor(private prisma: PrismaService) {
    // For MVP, use local filesystem. In production, use S3.
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    data: {
      applicationId?: string;
      tenantId?: string;
      leaseId?: string;
      type: DocumentType;
    },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(
        `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
      );
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
      );
    }

    // Generate unique storage key
    const ext = path.extname(file.originalname);
    const storageKey = `${uuidv4()}${ext}`;
    const storagePath = path.join(this.uploadDir, storageKey);

    // Write file to local storage (MVP)
    fs.writeFileSync(storagePath, file.buffer);

    return this.prisma.document.create({
      data: {
        applicationId: data.applicationId,
        tenantId: data.tenantId,
        leaseId: data.leaseId,
        type: data.type,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageKey,
        storageUrl: `/uploads/${storageKey}`,
        status: DocumentStatus.UPLOADED,
      },
    });
  }

  async getDocuments(params: {
    applicationId?: string;
    tenantId?: string;
    leaseId?: string;
  }) {
    return this.prisma.document.findMany({
      where: {
        ...(params.applicationId
          ? { applicationId: params.applicationId }
          : {}),
        ...(params.tenantId ? { tenantId: params.tenantId } : {}),
        ...(params.leaseId ? { leaseId: params.leaseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentById(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async verifyDocument(id: string, verifiedBy: string) {
    await this.getDocumentById(id);
    return this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.VERIFIED,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });
  }

  async rejectDocument(id: string, reason: string) {
    await this.getDocumentById(id);
    return this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
        rejectionReason: reason,
      },
    });
  }

  async deleteDocument(id: string) {
    const doc = await this.getDocumentById(id);

    // Remove file from storage
    const filePath = path.join(this.uploadDir, doc.storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.prisma.document.delete({ where: { id } });
  }

  getFilePath(storageKey: string): string {
    const filePath = path.join(this.uploadDir, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return filePath;
  }
}

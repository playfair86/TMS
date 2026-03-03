import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async createTenant(userId: string, data: {
    idNumber?: string;
    dateOfBirth?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankBranchCode?: string;
  }) {
    return this.prisma.tenant.create({
      data: {
        userId,
        idNumber: data.idNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankBranchCode: data.bankBranchCode,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
  }

  async getTenants(organisationId: string, params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      user: { organisationId },
      ...(params.search
        ? {
            user: {
              organisationId,
              OR: [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          leases: {
            where: { status: 'ACTIVE' },
            include: { unit: { include: { property: { select: { name: true } } } } },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, role: true } },
        leases: {
          include: {
            unit: { include: { property: { select: { name: true, addressLine1: true, suburb: true, city: true } } } },
          },
          orderBy: { startDate: 'desc' },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        communications: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async getTenantByUserId(userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        leases: {
          where: { status: { in: ['ACTIVE', 'PENDING_SIGNATURE'] } },
          include: {
            unit: { include: { property: { select: { name: true, addressLine1: true, suburb: true, city: true } } } },
            invoices: { orderBy: { dueDate: 'desc' }, take: 6 },
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant profile not found');
    return tenant;
  }

  async updateTenant(id: string, data: any) {
    await this.getTenantById(id);
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }
}

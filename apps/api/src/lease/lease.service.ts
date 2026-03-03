import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaseStatus, LeaseType, UnitStatus } from '@tms/database';

@Injectable()
export class LeaseService {
  constructor(private prisma: PrismaService) {}

  async createLease(data: {
    applicationId?: string;
    tenantId: string;
    unitId: string;
    templateId?: string;
    leaseType: LeaseType;
    startDate: string;
    endDate?: string;
    monthlyRent: number;
    depositAmount: number;
    escalationPct?: number;
    noticePeriodDays?: number;
  }) {
    // Verify unit exists and is available
    const unit = await this.prisma.unit.findUnique({
      where: { id: data.unitId },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.status === UnitStatus.OCCUPIED) {
      throw new BadRequestException('Unit is already occupied');
    }

    // Generate lease content from template or default
    const leaseContent = await this.generateLeaseContent(data);

    const lease = await this.prisma.lease.create({
      data: {
        applicationId: data.applicationId,
        tenantId: data.tenantId,
        unitId: data.unitId,
        templateId: data.templateId,
        leaseType: data.leaseType,
        status: LeaseStatus.DRAFT,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount,
        escalationPct: data.escalationPct ?? 0,
        noticePeriodDays: data.noticePeriodDays ?? 30,
        leaseContent,
      },
      include: {
        tenant: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        unit: {
          include: {
            property: { select: { name: true, addressLine1: true, suburb: true, city: true } },
          },
        },
      },
    });

    // Update unit status to reserved
    await this.prisma.unit.update({
      where: { id: data.unitId },
      data: { status: UnitStatus.RESERVED },
    });

    // Update lead status if from application
    if (data.applicationId) {
      const app = await this.prisma.application.findUnique({
        where: { id: data.applicationId },
        select: { leadId: true },
      });
      if (app) {
        await this.prisma.lead.update({
          where: { id: app.leadId },
          data: { status: 'LEASE_SIGNED' },
        });
      }
    }

    return lease;
  }

  async getLeases(params: {
    organisationId: string;
    status?: string;
    unitId?: string;
    tenantId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      unit: { property: { organisationId: params.organisationId } },
      ...(params.status ? { status: params.status } : {}),
      ...(params.unitId ? { unitId: params.unitId } : {}),
      ...(params.tenantId ? { tenantId: params.tenantId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.lease.findMany({
        where,
        include: {
          tenant: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          unit: {
            select: {
              unitNumber: true,
              property: { select: { name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lease.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getLeaseById(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        unit: {
          include: {
            property: { select: { name: true, addressLine1: true, suburb: true, city: true, province: true } },
          },
        },
        template: { select: { id: true, name: true } },
        application: { select: { id: true, status: true } },
        documents: true,
        invoices: { orderBy: { dueDate: 'desc' }, take: 12 },
      },
    });

    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async signLease(id: string, role: 'tenant' | 'landlord' | 'guarantor', signature: string) {
    const lease = await this.getLeaseById(id);

    if (lease.status !== LeaseStatus.DRAFT && lease.status !== LeaseStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Lease is not awaiting signatures');
    }

    const updateData: any = {};

    switch (role) {
      case 'tenant':
        updateData.tenantSignedAt = new Date();
        updateData.tenantSignature = signature;
        break;
      case 'landlord':
        updateData.landlordSignedAt = new Date();
        updateData.landlordSignature = signature;
        break;
      case 'guarantor':
        updateData.guarantorSignedAt = new Date();
        updateData.guarantorSignature = signature;
        break;
    }

    // If first signature, move to pending
    if (lease.status === LeaseStatus.DRAFT) {
      updateData.status = LeaseStatus.PENDING_SIGNATURE;
    }

    const updated = await this.prisma.lease.update({
      where: { id },
      data: updateData,
    });

    // Check if all required parties have signed
    const refreshed = await this.prisma.lease.findUnique({ where: { id } });
    if (refreshed && refreshed.tenantSignedAt && refreshed.landlordSignedAt) {
      await this.activateLease(id);
    }

    return updated;
  }

  async activateLease(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      select: { unitId: true, tenantId: true, applicationId: true },
    });
    if (!lease) throw new NotFoundException('Lease not found');

    // Activate lease
    await this.prisma.lease.update({
      where: { id },
      data: { status: LeaseStatus.ACTIVE },
    });

    // Mark unit as occupied
    await this.prisma.unit.update({
      where: { id: lease.unitId },
      data: { status: UnitStatus.OCCUPIED },
    });

    // Update lead status if from application
    if (lease.applicationId) {
      const app = await this.prisma.application.findUnique({
        where: { id: lease.applicationId },
        select: { leadId: true },
      });
      if (app) {
        await this.prisma.lead.update({
          where: { id: app.leadId },
          data: { status: 'MOVED_IN' },
        });
      }
    }
  }

  async terminateLease(id: string, reason: string, moveOutDate: string) {
    const lease = await this.getLeaseById(id);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException('Can only terminate active leases');
    }

    await this.prisma.lease.update({
      where: { id },
      data: {
        status: LeaseStatus.TERMINATED,
        terminatedAt: new Date(),
        terminationReason: reason,
        moveOutDate: new Date(moveOutDate),
      },
    });

    // Mark unit as notice given
    await this.prisma.unit.update({
      where: { id: lease.unitId },
      data: { status: UnitStatus.NOTICE_GIVEN },
    });

    return this.getLeaseById(id);
  }

  // ---- LEASE TEMPLATES ----

  async createTemplate(
    organisationId: string,
    data: { name: string; leaseType: LeaseType; content: string; clauses?: any },
  ) {
    return this.prisma.leaseTemplate.create({
      data: { ...data, organisationId },
    });
  }

  async getTemplates(organisationId: string) {
    return this.prisma.leaseTemplate.findMany({
      where: { organisationId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  private async generateLeaseContent(data: {
    tenantId: string;
    unitId: string;
    leaseType: LeaseType;
    startDate: string;
    endDate?: string;
    monthlyRent: number;
    depositAmount: number;
    escalationPct?: number;
    noticePeriodDays?: number;
    templateId?: string;
  }): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: data.tenantId },
      include: { user: true },
    });

    const unit = await this.prisma.unit.findUnique({
      where: { id: data.unitId },
      include: { property: true },
    });

    if (!tenant || !unit) {
      return 'Lease content could not be generated — missing data.';
    }

    // If template specified, use it
    if (data.templateId) {
      const template = await this.prisma.leaseTemplate.findUnique({
        where: { id: data.templateId },
      });
      if (template) {
        return template.content
          .replace(/\{\{tenant_name\}\}/g, `${tenant.user.firstName} ${tenant.user.lastName}`)
          .replace(/\{\{tenant_id\}\}/g, tenant.idNumber || 'N/A')
          .replace(/\{\{property_name\}\}/g, unit.property.name)
          .replace(/\{\{property_address\}\}/g, `${unit.property.addressLine1}, ${unit.property.suburb}, ${unit.property.city}`)
          .replace(/\{\{unit_number\}\}/g, unit.unitNumber)
          .replace(/\{\{monthly_rent\}\}/g, `R ${data.monthlyRent.toLocaleString()}`)
          .replace(/\{\{deposit_amount\}\}/g, `R ${data.depositAmount.toLocaleString()}`)
          .replace(/\{\{start_date\}\}/g, new Date(data.startDate).toLocaleDateString('en-ZA'))
          .replace(/\{\{end_date\}\}/g, data.endDate ? new Date(data.endDate).toLocaleDateString('en-ZA') : 'Month-to-month')
          .replace(/\{\{escalation_pct\}\}/g, `${data.escalationPct || 0}%`)
          .replace(/\{\{notice_period\}\}/g, `${data.noticePeriodDays || 30} days`);
      }
    }

    // Default lease content
    return `
RESIDENTIAL LEASE AGREEMENT

BETWEEN:
The Landlord: ${unit.property.name}
Property Address: ${unit.property.addressLine1}, ${unit.property.suburb}, ${unit.property.city}, ${unit.property.province}

AND:
The Tenant: ${tenant.user.firstName} ${tenant.user.lastName}
ID Number: ${tenant.idNumber || 'To be provided'}
Email: ${tenant.user.email}

PREMISES:
Unit ${unit.unitNumber} at ${unit.property.name}

LEASE TERMS:
Type: ${data.leaseType.replace('_', ' ')}
Commencement Date: ${new Date(data.startDate).toLocaleDateString('en-ZA')}
${data.endDate ? `Termination Date: ${new Date(data.endDate).toLocaleDateString('en-ZA')}` : 'This lease continues on a month-to-month basis.'}

RENTAL:
Monthly Rental: R ${data.monthlyRent.toLocaleString()}
Annual Escalation: ${data.escalationPct || 0}%
Deposit: R ${data.depositAmount.toLocaleString()}

NOTICE PERIOD:
${data.noticePeriodDays || 30} calendar days written notice is required for termination.

GENERAL CONDITIONS:
1. The Tenant shall use the premises solely for residential purposes.
2. The Tenant shall pay rent on or before the 1st of each month.
3. The deposit shall be held in an interest-bearing account as required by the Rental Housing Act.
4. The Tenant shall maintain the premises in good condition.
5. No alterations to the premises without written consent from the Landlord.
6. The Tenant shall comply with the house rules and body corporate rules.
7. This agreement is subject to the Rental Housing Act (No. 50 of 1999).
8. This agreement is subject to the Consumer Protection Act and POPIA.

SIGNATURES:

Tenant: _________________________  Date: _______________

Landlord: _________________________  Date: _______________

Guarantor (if applicable): _________________________  Date: _______________
    `.trim();
  }
}

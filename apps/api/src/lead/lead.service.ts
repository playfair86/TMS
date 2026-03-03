import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus, Prisma } from '@tms/database';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async createLead(
    organisationId: string,
    createdById: string | undefined,
    data: {
      propertyId?: string;
      unitId?: string;
      assignedAgentId?: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      idNumber?: string;
      source?: string;
      sourceDetail?: string;
      monthlyIncome?: number;
      desiredMoveIn?: string;
      desiredBedrooms?: number;
      notes?: string;
    },
  ) {
    // Auto-score lead based on income and completeness
    let score = 0;
    if (data.monthlyIncome) score += 30;
    if (data.idNumber) score += 20;
    if (data.email) score += 10;
    if (data.phone) score += 10;
    if (data.desiredMoveIn) score += 15;
    if (data.propertyId) score += 15;

    return this.prisma.lead.create({
      data: {
        organisationId,
        createdById,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        idNumber: data.idNumber,
        source: (data.source as any) || 'WEBSITE',
        sourceDetail: data.sourceDetail,
        monthlyIncome: data.monthlyIncome,
        desiredMoveIn: data.desiredMoveIn ? new Date(data.desiredMoveIn) : undefined,
        desiredBedrooms: data.desiredBedrooms,
        notes: data.notes,
        propertyId: data.propertyId,
        unitId: data.unitId,
        assignedAgentId: data.assignedAgentId,
        score,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getLeads(
    organisationId: string,
    params: {
      status?: string;
      propertyId?: string;
      assignedAgentId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      organisationId,
      ...(params.status ? { status: params.status as LeadStatus } : {}),
      ...(params.propertyId ? { propertyId: params.propertyId } : {}),
      ...(params.assignedAgentId ? { assignedAgentId: params.assignedAgentId } : {}),
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
              { phone: { contains: params.search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          property: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNumber: true, monthlyRent: true } },
          assignedAgent: { select: { id: true, firstName: true, lastName: true } },
          application: { select: { id: true, status: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getLeadById(organisationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organisationId },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true, monthlyRent: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true } },
        application: { select: { id: true, status: true } },
        communications: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateLead(organisationId: string, id: string, data: Prisma.LeadUpdateInput) {
    await this.getLeadById(organisationId, id);
    return this.prisma.lead.update({
      where: { id },
      data,
      include: {
        property: { select: { id: true, name: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateLeadStatus(
    organisationId: string,
    id: string,
    status: LeadStatus,
    lostReason?: string,
  ) {
    await this.getLeadById(organisationId, id);
    return this.prisma.lead.update({
      where: { id },
      data: { status, ...(lostReason ? { lostReason } : {}) },
    });
  }

  async getPipelineStats(organisationId: string) {
    const statuses = Object.values(LeadStatus);
    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.lead.count({ where: { organisationId, status } }),
      ),
    );

    return statuses.reduce(
      (acc, status, i) => {
        acc[status] = counts[i];
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

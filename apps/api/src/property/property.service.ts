import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@tms/database';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  // ---- PORTFOLIOS ----

  async createPortfolio(organisationId: string, data: { name: string; description?: string }) {
    return this.prisma.portfolio.create({
      data: { ...data, organisationId },
    });
  }

  async getPortfolios(organisationId: string) {
    return this.prisma.portfolio.findMany({
      where: { organisationId, isActive: true },
      include: { _count: { select: { properties: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // ---- PROPERTIES ----

  async createProperty(organisationId: string, data: Prisma.PropertyCreateInput & { portfolioId?: string }) {
    const { portfolioId, ...rest } = data;
    return this.prisma.property.create({
      data: {
        ...rest,
        organisation: { connect: { id: organisationId } },
        ...(portfolioId ? { portfolio: { connect: { id: portfolioId } } } : {}),
      },
      include: { portfolio: true, _count: { select: { units: true } } },
    });
  }

  async getProperties(
    organisationId: string,
    params: { page?: number; limit?: number; search?: string; portfolioId?: string },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      organisationId,
      isActive: true,
      ...(params.portfolioId ? { portfolioId: params.portfolioId } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { suburb: { contains: params.search, mode: 'insensitive' } },
              { city: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          portfolio: { select: { id: true, name: true } },
          _count: { select: { units: true, leads: true } },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPropertyById(organisationId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, organisationId },
      include: {
        portfolio: true,
        units: { orderBy: { unitNumber: 'asc' } },
        _count: { select: { units: true, leads: true } },
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async updateProperty(organisationId: string, id: string, data: Prisma.PropertyUpdateInput) {
    await this.getPropertyById(organisationId, id);
    return this.prisma.property.update({
      where: { id },
      data,
      include: { portfolio: true, _count: { select: { units: true } } },
    });
  }

  async deleteProperty(organisationId: string, id: string) {
    await this.getPropertyById(organisationId, id);
    return this.prisma.property.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ---- UNITS ----

  async createUnit(organisationId: string, data: {
    propertyId: string;
    unitNumber: string;
    type: string;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqm?: number;
    monthlyRent: number;
    depositAmount?: number;
    description?: string;
    amenities?: string[];
    parkingBays?: number;
    availableFrom?: string;
  }) {
    // Verify property belongs to org
    await this.getPropertyById(organisationId, data.propertyId);

    const unit = await this.prisma.unit.create({
      data: {
        ...data,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
        type: data.type as any,
      },
      include: { property: { select: { id: true, name: true } } },
    });

    // Update property total units count
    const unitCount = await this.prisma.unit.count({
      where: { propertyId: data.propertyId, isActive: true },
    });
    await this.prisma.property.update({
      where: { id: data.propertyId },
      data: { totalUnits: unitCount },
    });

    return unit;
  }

  async getUnits(
    organisationId: string,
    params: { propertyId?: string; status?: string; page?: number; limit?: number },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.UnitWhereInput = {
      isActive: true,
      property: { organisationId },
      ...(params.propertyId ? { propertyId: params.propertyId } : {}),
      ...(params.status ? { status: params.status as any } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        include: { property: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: [{ property: { name: 'asc' } }, { unitNumber: 'asc' }],
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnitById(organisationId: string, id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, property: { organisationId } },
      include: {
        property: { select: { id: true, name: true, addressLine1: true, suburb: true, city: true } },
        leases: {
          where: { status: 'ACTIVE' },
          include: { tenant: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
          take: 1,
        },
      },
    });

    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async updateUnit(organisationId: string, id: string, data: Prisma.UnitUpdateInput) {
    await this.getUnitById(organisationId, id);
    return this.prisma.unit.update({
      where: { id },
      data,
      include: { property: { select: { id: true, name: true } } },
    });
  }

  // ---- STATS ----

  async getDashboardStats(organisationId: string) {
    const [
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      totalLeads,
      activeApplications,
      activeLeases,
    ] = await Promise.all([
      this.prisma.property.count({ where: { organisationId, isActive: true } }),
      this.prisma.unit.count({ where: { property: { organisationId }, isActive: true } }),
      this.prisma.unit.count({ where: { property: { organisationId }, status: 'OCCUPIED', isActive: true } }),
      this.prisma.unit.count({ where: { property: { organisationId }, status: 'VACANT', isActive: true } }),
      this.prisma.lead.count({ where: { organisationId, status: { notIn: ['LOST', 'MOVED_IN'] } } }),
      this.prisma.application.count({
        where: {
          lead: { organisationId },
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'SCREENING_IN_PROGRESS'] },
        },
      }),
      this.prisma.lease.count({
        where: { unit: { property: { organisationId } }, status: 'ACTIVE' },
      }),
    ]);

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
      totalLeads,
      activeApplications,
      activeLeases,
    };
  }
}

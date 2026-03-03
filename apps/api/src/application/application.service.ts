import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, ConsentStatus, ConsentType } from '@tms/database';
import { AFFORDABILITY_THRESHOLD } from '@tms/shared';

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  async createApplication(data: {
    leadId: string;
    unitId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber?: string;
    dateOfBirth?: string;
    nationality?: string;
    employerName?: string;
    employerPhone?: string;
    jobTitle?: string;
    employmentStartDate?: string;
    monthlyGrossIncome?: number;
    monthlyNetIncome?: number;
    currentAddress?: string;
    currentLandlord?: string;
    currentLandlordPhone?: string;
    currentRent?: number;
    reasonForLeaving?: string;
    desiredMoveIn?: string;
    leaseDuration?: number;
    numberOfOccupants?: number;
    hasPets?: boolean;
    petDetails?: string;
    hasVehicle?: boolean;
    vehicleDetails?: string;
  }) {
    // Check if lead already has an application
    const existingApp = await this.prisma.application.findUnique({
      where: { leadId: data.leadId },
    });
    if (existingApp) {
      throw new BadRequestException('Lead already has an application');
    }

    // Calculate affordability if income and unit rent provided
    let affordabilityScore: number | undefined;
    let debtToIncomeRatio: number | undefined;

    if (data.monthlyGrossIncome) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: data.unitId },
      });
      if (unit) {
        debtToIncomeRatio = unit.monthlyRent / data.monthlyGrossIncome;
        affordabilityScore = debtToIncomeRatio <= AFFORDABILITY_THRESHOLD ? 100 : 0;
      }
    }

    const application = await this.prisma.application.create({
      data: {
        leadId: data.leadId,
        unitId: data.unitId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        idNumber: data.idNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        nationality: data.nationality,
        employerName: data.employerName,
        employerPhone: data.employerPhone,
        jobTitle: data.jobTitle,
        employmentStartDate: data.employmentStartDate
          ? new Date(data.employmentStartDate)
          : undefined,
        monthlyGrossIncome: data.monthlyGrossIncome,
        monthlyNetIncome: data.monthlyNetIncome,
        currentAddress: data.currentAddress,
        currentLandlord: data.currentLandlord,
        currentLandlordPhone: data.currentLandlordPhone,
        currentRent: data.currentRent,
        reasonForLeaving: data.reasonForLeaving,
        desiredMoveIn: data.desiredMoveIn ? new Date(data.desiredMoveIn) : undefined,
        leaseDuration: data.leaseDuration,
        numberOfOccupants: data.numberOfOccupants,
        hasPets: data.hasPets,
        petDetails: data.petDetails,
        hasVehicle: data.hasVehicle,
        vehicleDetails: data.vehicleDetails,
        affordabilityScore,
        debtToIncomeRatio,
      },
      include: {
        unit: { select: { id: true, unitNumber: true, monthlyRent: true } },
        lead: { select: { id: true, status: true } },
      },
    });

    // Update lead status to APPLIED
    await this.prisma.lead.update({
      where: { id: data.leadId },
      data: { status: 'APPLIED' },
    });

    return application;
  }

  async getApplications(params: {
    organisationId: string;
    status?: string;
    unitId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      lead: { organisationId: params.organisationId },
      ...(params.status ? { status: params.status } : {}),
      ...(params.unitId ? { unitId: params.unitId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          unit: {
            select: {
              id: true,
              unitNumber: true,
              monthlyRent: true,
              property: { select: { id: true, name: true } },
            },
          },
          lead: { select: { id: true, source: true } },
          _count: { select: { documents: true, screeningChecks: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getApplicationById(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            id: true,
            unitNumber: true,
            monthlyRent: true,
            depositAmount: true,
            property: { select: { id: true, name: true, addressLine1: true, suburb: true, city: true } },
          },
        },
        lead: { select: { id: true, source: true, score: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        screeningChecks: { orderBy: { createdAt: 'desc' } },
        occupants: true,
        guarantors: true,
        consents: true,
      },
    });

    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async updateApplication(id: string, data: any) {
    await this.getApplicationById(id);
    return this.prisma.application.update({
      where: { id },
      data,
    });
  }

  async submitApplication(id: string) {
    const app = await this.getApplicationById(id);

    if (app.status !== 'DRAFT') {
      throw new BadRequestException('Application already submitted');
    }

    // Check required consents
    const hasDataConsent = app.consents.some(
      (c) => c.type === 'DATA_PROCESSING' && c.status === 'GRANTED',
    );
    if (!hasDataConsent) {
      throw new BadRequestException('Data processing consent is required');
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }

  async reviewApplication(
    id: string,
    reviewerId: string,
    decision: 'APPROVED' | 'DECLINED' | 'CONDITIONALLY_APPROVED',
    notes?: string,
    declineReason?: string,
  ) {
    const app = await this.getApplicationById(id);

    if (!['SUBMITTED', 'UNDER_REVIEW', 'SCREENING_COMPLETE'].includes(app.status)) {
      throw new BadRequestException(`Cannot review application in ${app.status} status`);
    }

    const updateData: any = {
      status: decision,
      reviewerId,
      reviewNotes: notes,
      reviewedAt: new Date(),
    };

    if (decision === 'APPROVED') {
      updateData.approvedAt = new Date();
      // Update lead status
      await this.prisma.lead.update({
        where: { id: app.leadId },
        data: { status: 'APPROVED' },
      });
    } else if (decision === 'DECLINED') {
      updateData.declinedAt = new Date();
      updateData.declineReason = declineReason;
    }

    return this.prisma.application.update({
      where: { id },
      data: updateData,
    });
  }

  async addConsent(
    applicationId: string,
    data: { type: ConsentType; granted: boolean; version?: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.consent.create({
      data: {
        applicationId,
        type: data.type,
        status: data.granted ? ConsentStatus.GRANTED : ConsentStatus.REVOKED,
        version: data.version || '1.0',
        ipAddress,
        userAgent,
        grantedAt: data.granted ? new Date() : undefined,
        revokedAt: data.granted ? undefined : new Date(),
      },
    });
  }

  async addOccupant(
    applicationId: string,
    data: {
      firstName: string;
      lastName: string;
      idNumber?: string;
      dateOfBirth?: string;
      relationship?: string;
      isMinor?: boolean;
    },
  ) {
    return this.prisma.occupant.create({
      data: {
        applicationId,
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: data.idNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        relationship: data.relationship,
        isMinor: data.isMinor || false,
      },
    });
  }

  async addGuarantor(
    applicationId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      idNumber?: string;
      employerName?: string;
      monthlyIncome?: number;
      relationship?: string;
    },
  ) {
    return this.prisma.guarantor.create({
      data: { applicationId, ...data },
    });
  }

  async calculateAffordability(applicationId: string) {
    const app = await this.getApplicationById(applicationId);
    const unit = app.unit;

    if (!app.monthlyGrossIncome || !unit) {
      throw new BadRequestException('Income and unit information required');
    }

    const ratio = unit.monthlyRent / app.monthlyGrossIncome;
    const passed = ratio <= AFFORDABILITY_THRESHOLD;

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        debtToIncomeRatio: ratio,
        affordabilityScore: passed ? 100 : 0,
      },
    });

    return {
      monthlyIncome: app.monthlyGrossIncome,
      monthlyRent: unit.monthlyRent,
      ratio: Math.round(ratio * 100) / 100,
      threshold: AFFORDABILITY_THRESHOLD,
      passed,
      maxAffordableRent: Math.round(app.monthlyGrossIncome * AFFORDABILITY_THRESHOLD),
    };
  }
}

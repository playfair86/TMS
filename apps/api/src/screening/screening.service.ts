import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ScreeningCheckType,
  ScreeningStatus,
  ApplicationStatus,
} from '@tms/database';

/**
 * MVP Screening Service — uses mock checks.
 * In production, these would integrate with TransUnion, TPN, DHA, etc.
 */
@Injectable()
export class ScreeningService {
  constructor(private prisma: PrismaService) {}

  async initiateScreening(
    applicationId: string,
    checks: ScreeningCheckType[],
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new BadRequestException(
        'Application must be submitted before screening',
      );
    }

    // Update application status
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.SCREENING_IN_PROGRESS },
    });

    // Create screening check records
    const screeningChecks = await Promise.all(
      checks.map((type) =>
        this.prisma.screeningCheck.create({
          data: {
            applicationId,
            type,
            status: ScreeningStatus.PENDING,
            provider: this.getProviderForType(type),
          },
        }),
      ),
    );

    // Run mock checks asynchronously
    for (const check of screeningChecks) {
      this.runMockCheck(check.id, check.type);
    }

    return screeningChecks;
  }

  async getScreeningResults(applicationId: string) {
    const checks = await this.prisma.screeningCheck.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });

    const totalChecks = checks.length;
    const completedChecks = checks.filter(
      (c) => c.status !== 'PENDING' && c.status !== 'IN_PROGRESS',
    ).length;
    const passedChecks = checks.filter((c) => c.passed === true).length;
    const failedChecks = checks.filter((c) => c.passed === false).length;

    let overallStatus: string = 'PENDING';
    if (completedChecks === totalChecks && totalChecks > 0) {
      overallStatus =
        failedChecks > 0
          ? 'FAILED'
          : checks.some((c) => c.status === 'REVIEW_REQUIRED')
            ? 'REVIEW_REQUIRED'
            : 'PASSED';
    } else if (completedChecks > 0) {
      overallStatus = 'IN_PROGRESS';
    }

    return {
      checks,
      summary: {
        totalChecks,
        completedChecks,
        passedChecks,
        failedChecks,
        overallStatus,
      },
    };
  }

  async getCheckById(id: string) {
    const check = await this.prisma.screeningCheck.findUnique({
      where: { id },
    });
    if (!check) throw new NotFoundException('Screening check not found');
    return check;
  }

  /**
   * Mock check runner — simulates external API calls.
   * In production, this would call TransUnion, TPN, DHA, etc.
   */
  private async runMockCheck(checkId: string, type: ScreeningCheckType) {
    // Mark as in progress
    await this.prisma.screeningCheck.update({
      where: { id: checkId },
      data: { status: ScreeningStatus.IN_PROGRESS },
    });

    // Simulate processing delay (1-3 seconds)
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    // Generate mock result
    const result = this.generateMockResult(type);

    await this.prisma.screeningCheck.update({
      where: { id: checkId },
      data: {
        status: result.passed
          ? ScreeningStatus.PASSED
          : ScreeningStatus.FAILED,
        passed: result.passed,
        score: result.score,
        summary: result.summary,
        rawResponse: result.rawResponse as any,
        checkedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    // Check if all checks are complete, update application status
    const check = await this.prisma.screeningCheck.findUnique({
      where: { id: checkId },
    });
    if (check) {
      const allChecks = await this.prisma.screeningCheck.findMany({
        where: { applicationId: check.applicationId },
      });
      const allComplete = allChecks.every(
        (c) => c.status !== 'PENDING' && c.status !== 'IN_PROGRESS',
      );
      if (allComplete) {
        await this.prisma.application.update({
          where: { id: check.applicationId },
          data: { status: ApplicationStatus.SCREENING_COMPLETE },
        });
      }
    }
  }

  private generateMockResult(type: ScreeningCheckType) {
    // ~85% chance of passing for MVP demo
    const passed = Math.random() > 0.15;

    const mockResults: Record<
      string,
      { score: number; summary: string; rawResponse: object }
    > = {
      IDENTITY_VERIFICATION: {
        score: passed ? 100 : 0,
        summary: passed
          ? 'Identity verified against DHA records'
          : 'Identity could not be verified',
        rawResponse: {
          provider: 'DHA (Mock)',
          verified: passed,
          matchScore: passed ? 98.5 : 12.3,
        },
      },
      CREDIT_CHECK: {
        score: passed ? 650 + Math.floor(Math.random() * 150) : 300 + Math.floor(Math.random() * 200),
        summary: passed
          ? 'Good credit standing, no adverse records'
          : 'Poor credit score with multiple defaults',
        rawResponse: {
          provider: 'TransUnion (Mock)',
          creditScore: passed ? 720 : 380,
          judgments: passed ? 0 : 2,
          defaults: passed ? 0 : 3,
          paymentProfile: passed ? 'GOOD' : 'POOR',
        },
      },
      TPN_CHECK: {
        score: passed ? 8 + Math.random() * 2 : 2 + Math.random() * 3,
        summary: passed
          ? 'Good tenant payment history'
          : 'Previous rental arrears recorded',
        rawResponse: {
          provider: 'TPN (Mock)',
          rating: passed ? 'A' : 'D',
          previousArrears: !passed,
          tenancyHistory: passed ? 'POSITIVE' : 'NEGATIVE',
        },
      },
      AFFORDABILITY: {
        score: passed ? 100 : 0,
        summary: passed
          ? 'Meets affordability requirements'
          : 'Does not meet minimum income threshold',
        rawResponse: {
          debtToIncomeRatio: passed ? 0.28 : 0.45,
          threshold: 0.33,
          passed,
        },
      },
      CRIMINAL_RECORD: {
        score: passed ? 100 : 0,
        summary: passed
          ? 'No criminal records found'
          : 'Criminal record found',
        rawResponse: {
          provider: 'SAPS (Mock)',
          recordsFound: !passed,
        },
      },
      EMPLOYMENT_VERIFICATION: {
        score: passed ? 100 : 0,
        summary: passed
          ? 'Employment confirmed with stated employer'
          : 'Employment could not be verified',
        rawResponse: {
          provider: 'Manual (Mock)',
          employerConfirmed: passed,
          incomeConfirmed: passed,
        },
      },
      REFERENCE_CHECK: {
        score: passed ? 100 : 50,
        summary: passed
          ? 'Positive references received'
          : 'Mixed references — review recommended',
        rawResponse: {
          provider: 'Manual (Mock)',
          previousLandlordPositive: passed,
          personalReferencePositive: true,
        },
      },
      PEP_SANCTIONS: {
        score: passed ? 100 : 0,
        summary: passed
          ? 'No PEP or sanctions matches found'
          : 'Potential PEP match — review required',
        rawResponse: {
          provider: 'LexisNexis (Mock)',
          pepMatch: !passed,
          sanctionsMatch: false,
        },
      },
      DEEDS_SEARCH: {
        score: 100,
        summary: 'Deeds office search completed',
        rawResponse: {
          provider: 'Deeds Office (Mock)',
          propertiesOwned: 0,
        },
      },
      COMPANY_CHECK: {
        score: passed ? 100 : 0,
        summary: passed
          ? 'Company in good standing'
          : 'Company deregistered or in poor standing',
        rawResponse: {
          provider: 'CIPC (Mock)',
          companyStatus: passed ? 'ACTIVE' : 'DEREGISTERED',
        },
      },
    };

    const result = mockResults[type] || { score: 0, summary: 'Unknown check type', rawResponse: {} };
    return { ...result, passed };
  }

  private getProviderForType(type: ScreeningCheckType): string {
    const providers: Record<string, string> = {
      IDENTITY_VERIFICATION: 'DHA (Mock)',
      CREDIT_CHECK: 'TransUnion (Mock)',
      TPN_CHECK: 'TPN (Mock)',
      AFFORDABILITY: 'Internal',
      CRIMINAL_RECORD: 'SAPS (Mock)',
      EMPLOYMENT_VERIFICATION: 'Manual (Mock)',
      REFERENCE_CHECK: 'Manual (Mock)',
      PEP_SANCTIONS: 'LexisNexis (Mock)',
      DEEDS_SEARCH: 'Deeds Office (Mock)',
      COMPANY_CHECK: 'CIPC (Mock)',
    };
    return providers[type] || 'Unknown';
  }
}

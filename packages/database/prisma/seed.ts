import { PrismaClient, UserRole, PropertyType, UnitType, UnitStatus, LeadSource, LeadStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Organisation
  const org = await prisma.organisation.upsert({
    where: { slug: 'demo-properties' },
    update: {},
    create: {
      name: 'Demo Properties (Pty) Ltd',
      slug: 'demo-properties',
      email: 'admin@demo-properties.co.za',
      phone: '+27 11 123 4567',
      address: '100 West Street',
      city: 'Sandton',
      province: 'Gauteng',
      postalCode: '2196',
      primaryColor: '#1e40af',
      registrationNumber: '2020/123456/07',
    },
  });

  console.log(`Created organisation: ${org.name}`);

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo-properties.co.za' },
    update: {},
    create: {
      email: 'admin@demo-properties.co.za',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+27821234567',
      role: UserRole.PORTFOLIO_MANAGER,
      organisationId: org.id,
      emailVerified: true,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@demo-properties.co.za' },
    update: {},
    create: {
      email: 'agent@demo-properties.co.za',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Nkosi',
      phone: '+27829876543',
      role: UserRole.LEASING_AGENT,
      organisationId: org.id,
      emailVerified: true,
    },
  });

  const tenantUser = await prisma.user.upsert({
    where: { email: 'tenant@example.co.za' },
    update: {},
    create: {
      email: 'tenant@example.co.za',
      passwordHash,
      firstName: 'Thabo',
      lastName: 'Mokoena',
      phone: '+27831112222',
      role: UserRole.TENANT,
      organisationId: org.id,
      emailVerified: true,
    },
  });

  console.log('Created users: admin, agent, tenant');

  // 3. Create Portfolio
  const portfolio = await prisma.portfolio.create({
    data: {
      name: 'Gauteng Residential Portfolio',
      description: 'Premium residential properties across Gauteng',
      organisationId: org.id,
    },
  });

  // 4. Create Properties
  const property1 = await prisma.property.create({
    data: {
      name: 'Sandton Central Apartments',
      type: PropertyType.APARTMENT_COMPLEX,
      addressLine1: '50 Rivonia Road',
      suburb: 'Sandton',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196',
      latitude: -26.1076,
      longitude: 28.0567,
      totalUnits: 6,
      description: 'Modern apartment complex in the heart of Sandton CBD',
      amenities: ['Pool', 'Gym', 'Secure Parking', '24/7 Security', 'Fibre Internet'],
      organisationId: org.id,
      portfolioId: portfolio.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      name: 'Rosebank Garden Village',
      type: PropertyType.TOWNHOUSE_COMPLEX,
      addressLine1: '22 Jan Smuts Avenue',
      suburb: 'Rosebank',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196',
      latitude: -26.1465,
      longitude: 28.0436,
      totalUnits: 4,
      description: 'Charming townhouse complex in leafy Rosebank',
      amenities: ['Garden', 'Braai Area', 'Secure Parking', 'Pet Friendly'],
      organisationId: org.id,
      portfolioId: portfolio.id,
    },
  });

  console.log('Created properties: Sandton Central, Rosebank Garden Village');

  // 5. Create Units
  const units = [];
  const sandtonUnits = [
    { unitNumber: 'A101', type: UnitType.STUDIO, floor: 1, bedrooms: 0, bathrooms: 1, sizeSqm: 35, monthlyRent: 7500, depositAmount: 7500, status: UnitStatus.OCCUPIED },
    { unitNumber: 'A102', type: UnitType.ONE_BED, floor: 1, bedrooms: 1, bathrooms: 1, sizeSqm: 50, monthlyRent: 9500, depositAmount: 9500, status: UnitStatus.VACANT },
    { unitNumber: 'A201', type: UnitType.ONE_BED, floor: 2, bedrooms: 1, bathrooms: 1, sizeSqm: 55, monthlyRent: 10000, depositAmount: 10000, status: UnitStatus.VACANT },
    { unitNumber: 'A202', type: UnitType.TWO_BED, floor: 2, bedrooms: 2, bathrooms: 2, sizeSqm: 75, monthlyRent: 14000, depositAmount: 14000, status: UnitStatus.OCCUPIED },
    { unitNumber: 'A301', type: UnitType.TWO_BED, floor: 3, bedrooms: 2, bathrooms: 2, sizeSqm: 80, monthlyRent: 15000, depositAmount: 15000, status: UnitStatus.VACANT },
    { unitNumber: 'A302', type: UnitType.THREE_BED, floor: 3, bedrooms: 3, bathrooms: 2, sizeSqm: 100, monthlyRent: 18000, depositAmount: 18000, status: UnitStatus.RESERVED },
  ];

  for (const unitData of sandtonUnits) {
    const unit = await prisma.unit.create({
      data: {
        ...unitData,
        propertyId: property1.id,
        parkingBays: unitData.bedrooms >= 2 ? 2 : 1,
      },
    });
    units.push(unit);
  }

  const rosebankUnits = [
    { unitNumber: 'TH1', type: UnitType.TWO_BED, floor: 0, bedrooms: 2, bathrooms: 1, sizeSqm: 90, monthlyRent: 12000, depositAmount: 12000, status: UnitStatus.OCCUPIED },
    { unitNumber: 'TH2', type: UnitType.TWO_BED, floor: 0, bedrooms: 2, bathrooms: 2, sizeSqm: 95, monthlyRent: 13000, depositAmount: 13000, status: UnitStatus.VACANT },
    { unitNumber: 'TH3', type: UnitType.THREE_BED, floor: 0, bedrooms: 3, bathrooms: 2, sizeSqm: 120, monthlyRent: 16000, depositAmount: 16000, status: UnitStatus.VACANT },
    { unitNumber: 'TH4', type: UnitType.THREE_BED, floor: 0, bedrooms: 3, bathrooms: 2, sizeSqm: 125, monthlyRent: 17000, depositAmount: 17000, status: UnitStatus.OCCUPIED },
  ];

  for (const unitData of rosebankUnits) {
    const unit = await prisma.unit.create({
      data: {
        ...unitData,
        propertyId: property2.id,
        parkingBays: 2,
      },
    });
    units.push(unit);
  }

  console.log(`Created ${units.length} units`);

  // 6. Create Tenant Profile
  const tenant = await prisma.tenant.create({
    data: {
      userId: tenantUser.id,
      idNumber: '9501015800081',
      dateOfBirth: new Date('1995-01-01'),
      emergencyContactName: 'Lerato Mokoena',
      emergencyContactPhone: '+27834445555',
    },
  });

  // 7. Create Sample Leads
  const leadNames = [
    { firstName: 'Sipho', lastName: 'Dlamini', email: 'sipho@example.co.za', phone: '+27821001001', status: LeadStatus.NEW, income: 25000 },
    { firstName: 'Nomsa', lastName: 'Zulu', email: 'nomsa@example.co.za', phone: '+27821001002', status: LeadStatus.CONTACTED, income: 32000 },
    { firstName: 'David', lastName: 'van Wyk', email: 'david@example.co.za', phone: '+27821001003', status: LeadStatus.QUALIFIED, income: 45000 },
    { firstName: 'Amahle', lastName: 'Ndlovu', email: 'amahle@example.co.za', phone: '+27821001004', status: LeadStatus.NEW, income: 28000 },
    { firstName: 'Johan', lastName: 'Pretorius', email: 'johan@example.co.za', phone: '+27821001005', status: LeadStatus.CONTACTED, income: 38000 },
    { firstName: 'Zanele', lastName: 'Mthembu', email: 'zanele@example.co.za', phone: '+27821001006', status: LeadStatus.QUALIFIED, income: 55000 },
  ];

  const sources = [LeadSource.WEBSITE, LeadSource.PROPERTY24, LeadSource.WALK_IN, LeadSource.AGENT_REFERRAL, LeadSource.PHONE, LeadSource.PRIVATE_PROPERTY];

  for (let i = 0; i < leadNames.length; i++) {
    const lead = leadNames[i];
    await prisma.lead.create({
      data: {
        organisationId: org.id,
        propertyId: i < 3 ? property1.id : property2.id,
        assignedAgentId: agent.id,
        createdById: admin.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: sources[i],
        monthlyIncome: lead.income,
        score: Math.floor(40 + Math.random() * 60),
        desiredBedrooms: 1 + Math.floor(Math.random() * 3),
      },
    });
  }

  console.log(`Created ${leadNames.length} sample leads`);

  // 8. Create a Lease Template
  await prisma.leaseTemplate.create({
    data: {
      organisationId: org.id,
      name: 'Standard Residential Lease',
      leaseType: 'FIXED_TERM',
      isDefault: true,
      content: `RESIDENTIAL LEASE AGREEMENT

BETWEEN:
The Landlord: {{property_name}}
Property Address: {{property_address}}

AND:
The Tenant: {{tenant_name}}
ID Number: {{tenant_id}}

PREMISES: Unit {{unit_number}} at {{property_name}}

LEASE TERMS:
Commencement: {{start_date}}
Termination: {{end_date}}
Monthly Rental: {{monthly_rent}}
Deposit: {{deposit_amount}}
Annual Escalation: {{escalation_pct}}
Notice Period: {{notice_period}}

This lease is governed by the Rental Housing Act (No. 50 of 1999) and POPIA.`,
      clauses: {
        useOfPremises: 'Residential purposes only',
        paymentDay: '1st of each month',
        petPolicy: 'No pets without written consent',
        maintenanceResponsibility: 'Minor repairs by tenant, structural by landlord',
      },
    },
  });

  console.log('Created lease template');
  console.log('');
  console.log('=== Seed Complete ===');
  console.log('');
  console.log('Login credentials (all users):');
  console.log('  Password: Password123');
  console.log('');
  console.log('Admin:  admin@demo-properties.co.za');
  console.log('Agent:  agent@demo-properties.co.za');
  console.log('Tenant: tenant@example.co.za');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

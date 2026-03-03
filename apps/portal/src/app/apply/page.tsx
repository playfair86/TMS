'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

const steps = ['Personal Info', 'Employment', 'Current Address', 'Preferences', 'Consent'];

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    // Personal
    firstName: '', lastName: '', email: '', phone: '', idNumber: '',
    dateOfBirth: '', nationality: 'ZA',
    // Employment
    employerName: '', jobTitle: '', employerPhone: '',
    monthlyGrossIncome: '', monthlyNetIncome: '',
    // Current Address
    currentAddress: '', currentLandlord: '', currentLandlordPhone: '',
    currentRent: '', reasonForLeaving: '',
    // Preferences
    desiredMoveIn: '', leaseDuration: '12', numberOfOccupants: '1',
    hasPets: false, petDetails: '', hasVehicle: false, vehicleDetails: '',
    // These would typically come from the property listing context
    leadId: '', unitId: '',
    // Consent
    consentDataProcessing: false, consentCreditCheck: false, consentTerms: false,
  });

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    if (!form.consentDataProcessing || !form.consentTerms) {
      setError('You must consent to data processing and terms to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For MVP, create both lead and application in sequence
      // In production, the lead would already exist from the property listing
      const leadRes = await api.createLead({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        idNumber: form.idNumber,
        source: 'WEBSITE',
        monthlyIncome: form.monthlyGrossIncome ? parseFloat(form.monthlyGrossIncome) : undefined,
      });

      if (form.unitId && leadRes.data?.id) {
        await api.createApplication({
          leadId: leadRes.data.id,
          unitId: form.unitId,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          idNumber: form.idNumber || undefined,
          dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
          nationality: form.nationality,
          employerName: form.employerName || undefined,
          jobTitle: form.jobTitle || undefined,
          employerPhone: form.employerPhone || undefined,
          monthlyGrossIncome: form.monthlyGrossIncome ? parseFloat(form.monthlyGrossIncome) : undefined,
          monthlyNetIncome: form.monthlyNetIncome ? parseFloat(form.monthlyNetIncome) : undefined,
          currentAddress: form.currentAddress || undefined,
          currentLandlord: form.currentLandlord || undefined,
          currentLandlordPhone: form.currentLandlordPhone || undefined,
          currentRent: form.currentRent ? parseFloat(form.currentRent) : undefined,
          reasonForLeaving: form.reasonForLeaving || undefined,
          desiredMoveIn: form.desiredMoveIn ? new Date(form.desiredMoveIn).toISOString() : undefined,
          leaseDuration: parseInt(form.leaseDuration),
          numberOfOccupants: parseInt(form.numberOfOccupants),
          hasPets: form.hasPets,
          petDetails: form.petDetails || undefined,
          hasVehicle: form.hasVehicle,
          vehicleDetails: form.vehicleDetails || undefined,
        });
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h2>
          <p className="text-gray-500 mb-6">
            Thank you! Your application has been submitted successfully. You will be contacted by our leasing team shortly.
          </p>
          <button onClick={() => router.push('/dashboard')} className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary-600" />
          <span className="text-lg font-bold text-gray-900">Rental Application</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <CheckCircle className="h-5 w-5" /> : i + 1}
              </div>
              <span className={`ml-2 text-sm hidden md:inline ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{s}</span>
              {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>}

          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" required value={form.firstName} onChange={(e) => updateForm({ firstName: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" required value={form.lastName} onChange={(e) => updateForm({ lastName: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => updateForm({ email: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" required value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. 0821234567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SA ID Number</label>
                  <input type="text" maxLength={13} value={form.idNumber} onChange={(e) => updateForm({ idNumber: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="13-digit ID number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => updateForm({ dateOfBirth: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Employment */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Employment Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
                  <input type="text" value={form.employerName} onChange={(e) => updateForm({ employerName: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input type="text" value={form.jobTitle} onChange={(e) => updateForm({ jobTitle: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer Phone</label>
                <input type="tel" value={form.employerPhone} onChange={(e) => updateForm({ employerPhone: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Gross Income (R)</label>
                  <input type="number" value={form.monthlyGrossIncome} onChange={(e) => updateForm({ monthlyGrossIncome: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Net Income (R)</label>
                  <input type="number" value={form.monthlyNetIncome} onChange={(e) => updateForm({ monthlyNetIncome: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Current Address */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Current Living Situation</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                <input type="text" value={form.currentAddress} onChange={(e) => updateForm({ currentAddress: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Landlord Name</label>
                  <input type="text" value={form.currentLandlord} onChange={(e) => updateForm({ currentLandlord: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Phone</label>
                  <input type="tel" value={form.currentLandlordPhone} onChange={(e) => updateForm({ currentLandlordPhone: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Rent (R)</label>
                  <input type="number" value={form.currentRent} onChange={(e) => updateForm({ currentRent: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
                  <input type="text" value={form.reasonForLeaving} onChange={(e) => updateForm({ reasonForLeaving: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Move-in Preferences</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desired Move-in Date</label>
                  <input type="date" value={form.desiredMoveIn} onChange={(e) => updateForm({ desiredMoveIn: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Duration (months)</label>
                  <select value={form.leaseDuration} onChange={(e) => updateForm({ leaseDuration: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="1">Month-to-month</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Occupants</label>
                <input type="number" min="1" max="10" value={form.numberOfOccupants} onChange={(e) => updateForm({ numberOfOccupants: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.hasPets} onChange={(e) => updateForm({ hasPets: e.target.checked })} className="rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-700">I have pets</span>
                </label>
                {form.hasPets && (
                  <input type="text" placeholder="Describe your pets (type, breed, size)" value={form.petDetails} onChange={(e) => updateForm({ petDetails: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                )}
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.hasVehicle} onChange={(e) => updateForm({ hasVehicle: e.target.checked })} className="rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-700">I have a vehicle (need parking)</span>
                </label>
                {form.hasVehicle && (
                  <input type="text" placeholder="Vehicle make, model, registration" value={form.vehicleDetails} onChange={(e) => updateForm({ vehicleDetails: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                )}
              </div>
            </div>
          )}

          {/* Step 4: Consent */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Consent & Declarations</h2>
              <p className="text-sm text-gray-500">
                In compliance with the Protection of Personal Information Act (POPIA), we require your explicit consent before processing your application.
              </p>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={form.consentDataProcessing} onChange={(e) => updateForm({ consentDataProcessing: e.target.checked })} className="rounded border-gray-300 text-primary-600 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    <strong>Data Processing Consent *</strong><br />
                    I consent to the collection, processing, and storage of my personal information for the purpose of evaluating my rental application.
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={form.consentCreditCheck} onChange={(e) => updateForm({ consentCreditCheck: e.target.checked })} className="rounded border-gray-300 text-primary-600 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    <strong>Credit & Background Check Consent</strong><br />
                    I consent to a credit check and background verification being conducted as part of the vetting process.
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={form.consentTerms} onChange={(e) => updateForm({ consentTerms: e.target.checked })} className="rounded border-gray-300 text-primary-600 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    <strong>Terms & Conditions *</strong><br />
                    I confirm that all information provided is accurate and complete. I understand that providing false information may result in my application being declined.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

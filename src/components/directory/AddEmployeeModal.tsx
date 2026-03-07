import React, { useState, useEffect } from 'react';
import { X, Trash2, FileText, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Employee } from '../../types/Employee';
import CountrySelect from '../common/CountrySelect';

interface Props {
    employees: Employee[];
    isOpen: boolean;
    onClose: () => void;
    onAdd: (employee: Employee) => void;
}

const AddEmployeeModal: React.FC<Props> = ({ employees, isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState<Partial<Employee>>({
        firstName: '',
        lastName: '',
        email: '',
        hireDate: '',
        employmentStatus: 'Full Time',
        department: 'HR',
        location: '',
        city: '',
        country: '',
        jobTitle: '',
        reportingTo: '',
        status: 'Active',
        bankName: '',
        bankAccountNumber: '',
        photoUrl: '',
        hrDocuments: [],
        nationalId: '',
        dateOfBirth: '',
        taxId: '',
        phoneNumber: '',
        homeAddress: '',
        nationality: '',
        personalEmail: '',
        maritalStatus: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        bankAccountType: '',
        igssAffiliation: '',
        gender: '',
        medicalConditions: '',
        profession: '',
        academicLevel: '',
        degreeTitle: '',
        bloodType: '',
        tShirtSize: '',
        contractingCompany: '',
        legalEntity: ''
    });
    const [sendOnboardingEmail, setSendOnboardingEmail] = useState(false);
    const [activeTab, setActiveTab] = useState<'quick' | 'full'>('quick');
    const [generatedId, setGeneratedId] = useState('');
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [hrFiles, setHrFiles] = useState<{ id: string, file: File }[]>([]);

    useEffect(() => {
        if (isOpen && !generatedId) {
            setGeneratedId(Math.random().toString(36).substring(2, 9));
        } else if (!isOpen) {
            setGeneratedId('');
            setCopiedShareLink(false);
        }
    }, [isOpen, generatedId]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const finalId = generatedId || Math.random().toString(36).substring(2, 9);

        let finalPhotoUrl = formData.photoUrl;

        if (photoFile) {
            const ext = photoFile.name.split('.').pop();
            const filePath = `${finalId}/avatar_${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage.from('avatars').upload(filePath, photoFile);
            if (data && !error) {
                const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                finalPhotoUrl = publicData.publicUrl;
            } else {
                console.error("Avatar storage upload failed, falling back to base64", error);
                // Convert photoFile to base64 synchronously or ideally handle it upstream.
                // Since this is inside form submission, we can try to await a base64 conversion.
                finalPhotoUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(photoFile);
                });
            }
        }

        const finalHrDocs = [];
        for (const doc of (formData.hrDocuments || [])) {
            const fileObj = hrFiles.find(f => f.id === doc.id);
            if (fileObj) {
                const ext = fileObj.file.name.split('.').pop();
                const filePath = `${finalId}/hr_${doc.id}.${ext}`;
                const { data, error } = await supabase.storage.from('hr-documents').upload(filePath, fileObj.file);
                if (data && !error) {
                    const { data: publicData } = supabase.storage.from('hr-documents').getPublicUrl(filePath);
                    finalHrDocs.push({ ...doc, dataUrl: publicData.publicUrl });
                } else {
                    console.error("HR Document storage upload failed, falling back to base64", error);
                    const base64Url: string = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(fileObj.file);
                    });
                    finalHrDocs.push({ ...doc, dataUrl: base64Url });
                }
            } else {
                finalHrDocs.push(doc);
            }
        }

        const { error: dbError } = await supabase.from('employees').insert([{
            id: finalId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            personal_email: formData.personalEmail,
            hire_date: formData.hireDate,
            employment_status: formData.employmentStatus,
            department: formData.department,
            location: [formData.city, formData.country].filter(Boolean).join(', '),
            job_title: formData.jobTitle,
            reporting_to: formData.reportingTo,
            status: activeTab === 'quick' ? 'Onboarding' : formData.status || 'Active',
            bank_name: formData.bankName,
            bank_account_number: formData.bankAccountNumber,
            bank_account_type: formData.bankAccountType,
            photo_url: finalPhotoUrl,
            hr_documents: finalHrDocs,
            national_id: formData.nationalId,
            date_of_birth: formData.dateOfBirth,
            tax_id: formData.taxId,
            phone_number: formData.phoneNumber,
            home_address: formData.homeAddress,
            nationality: formData.nationality,
            marital_status: formData.maritalStatus,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            emergency_contact_relationship: formData.emergencyContactRelationship,
            igss_affiliation: formData.igssAffiliation,
            gender: formData.gender,
            medical_conditions: formData.medicalConditions,
            profession: formData.profession,
            academic_level: formData.academicLevel,
            degree_title: formData.degreeTitle,
            blood_type: formData.bloodType,
            t_shirt_size: formData.tShirtSize,
            contracting_company: formData.contractingCompany,
            legal_entity: formData.legalEntity
        }]);

        if (dbError) {
            console.error("Error inserting employee into Supabase", dbError);
            setIsSubmitting(false);
            return;
        }

        // Pass back to parent
        const newEmployee: Employee = {
            ...(formData as Employee),
            id: finalId,
            location: [formData.city, formData.country].filter(Boolean).join(', '),
            photoUrl: finalPhotoUrl || '',
            hrDocuments: finalHrDocs,
            legalEntity: formData.legalEntity,
            status: activeTab === 'quick' ? 'Onboarding' : formData.status || 'Active'
        };

        const fallbackPayload = btoa(encodeURIComponent(JSON.stringify({
            firstName: newEmployee.firstName,
            lastName: newEmployee.lastName,
            personalEmail: newEmployee.personalEmail || formData.email || '',
            department: newEmployee.department || 'HR',
            jobTitle: newEmployee.jobTitle || ''
        })));

        const generatedShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${finalId}?fallback=${fallbackPayload}` : '';

        const targetEmail = activeTab === 'quick' ? formData.personalEmail : formData.email;
        if (sendOnboardingEmail && targetEmail) {
            try {
                const response = await fetch('/api/send-onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: targetEmail,
                        firstName: formData.firstName,
                        shareUrl: generatedShareUrl
                    })
                });

                if (!response.ok) {
                    console.error("Failed to send onboarding email via API");
                }
            } catch (error) {
                console.error("Error sending onboarding email:", error);
            }
        }

        onAdd(newEmployee);
        onClose();

        // Reset
        setFormData({
            firstName: '', lastName: '', email: '', hireDate: '', employmentStatus: 'Full Time',
            department: 'HR', location: '', city: '', country: '', jobTitle: '', reportingTo: '', status: 'Active',
            bankName: '', bankAccountNumber: '', photoUrl: '', hrDocuments: [],
            nationalId: '', dateOfBirth: '', taxId: '', phoneNumber: '', homeAddress: '', nationality: '', personalEmail: '', maritalStatus: '', emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '', bankAccountType: '', igssAffiliation: '', gender: '', medicalConditions: '', profession: '', academicLevel: '', degreeTitle: '', bloodType: '', tShirtSize: '', contractingCompany: '', legalEntity: ''
        });
        setSendOnboardingEmail(false);
        setGeneratedId('');
        setCopiedShareLink(false);
        setActiveTab('quick');
        setIsSubmitting(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHrDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const id = Math.random().toString(36).substring(2, 9);
        setHrFiles(prev => [...prev, { id, file }]);

        const reader = new FileReader();
        reader.onloadend = () => {
            const newDoc = {
                id,
                name: file.name,
                dataUrl: reader.result as string,
                uploadedAt: new Date().toISOString()
            };
            setFormData(prev => ({
                ...prev,
                hrDocuments: [...(prev.hrDocuments || []), newDoc]
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteHrDocument = (docId: string) => {
        setHrFiles(prev => prev.filter(f => f.id !== docId));
        setFormData(prev => ({
            ...prev,
            hrDocuments: prev.hrDocuments?.filter(d => d.id !== docId) || []
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Add New Employee</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-[#EEF2FF]/30 px-6 flex items-end shrink-0 pt-2 border-b border-gray-100">
                    <button
                        type="button"
                        onClick={() => setActiveTab('quick')}
                        className={`px-5 py-2.5 font-medium text-sm transition-colors focus:outline-none ${activeTab === 'quick'
                            ? 'bg-white text-[#4F7BFE] border-t border-x border-gray-200 rounded-t-lg shadow-sm font-semibold'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                            }`}
                    >
                        Quick Invite
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('full')}
                        className={`px-5 py-2.5 font-medium text-sm transition-colors focus:outline-none ${activeTab === 'full'
                            ? 'bg-white text-[#4F7BFE] border-t border-x border-gray-200 rounded-t-lg shadow-sm font-semibold'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                            }`}
                    >
                        Full Record
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {activeTab === 'quick' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email *</label>
                                    <input required type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                                    <input required name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select name="department" value={formData.department} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="HR">HR</option>
                                        <option value="Data Science">Data Science</option>
                                        <option value="BI">BI</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Product">Product</option>
                                        <option value="Customer Support">Customer Support</option>
                                        <option value="Lending Ops">Lending Ops</option>
                                        <option value="Legal">Legal</option>
                                        <option value="Compliance">Compliance</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Risk">Risk</option>
                                        <option value="Collection">Collection</option>
                                        <option value="Corporate">Corporate</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <CountrySelect name="country" value={formData.country || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input name="city" value={formData.city || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="e.g. Guatemala City" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                                    <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                                    <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="Full Time">Full Time</option>
                                        <option value="Part Time">Part Time</option>
                                        <option value="Contractor">Contractor</option>
                                        <option value="Intern">Intern</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reporting To</label>
                                    <select name="reportingTo" value={formData.reportingTo} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">None / CEO</option>
                                        {employees.map(emp => {
                                            const fullName = `${emp.firstName} ${emp.lastName}`;
                                            return (
                                                <option key={emp.id} value={fullName}>
                                                    {fullName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                    <input name="bankName" value={formData.bankName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="e.g. Chase" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                                    <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="Account Number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Type</label>
                                    <select name="bankAccountType" value={formData.bankAccountType} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Account Type</option>
                                        <option value="Monetaria">Monetaria</option>
                                        <option value="Ahorro">Ahorro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">National ID (DPI/DNI)</label>
                                    <input name="nationalId" value={formData.nationalId} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (NIT)</label>
                                    <input name="taxId" value={formData.taxId} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                    <select name="nationality" value={formData.nationality} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Nationality</option>
                                        <option value="Guatemalteca">Guatemalteca</option>
                                        <option value="Argentina">Argentina</option>
                                        <option value="Mexicana">Mexicana</option>
                                        <option value="Hondureña">Hondureña</option>
                                        <option value="Colombiana">Colombiana</option>
                                        <option value="Salvadoreña">Salvadoreña</option>
                                        <option value="Nicaragüense">Nicaragüense</option>
                                        <option value="Española">Española</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Gender</option>
                                        <option value="Hombre">Hombre</option>
                                        <option value="Mujer">Mujer</option>
                                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Marital Status</option>
                                        <option value="Soltero">Soltero</option>
                                        <option value="Casado">Casado</option>
                                        <option value="Divorciado">Divorciado</option>
                                        <option value="Viudo">Viudo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                                    <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Blood Type</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="No sé">No sé</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">T-Shirt Size</label>
                                    <select name="tShirtSize" value={formData.tShirtSize} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Size</option>
                                        <option value="XS">XS</option>
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                                    <input name="homeAddress" value={formData.homeAddress} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
                                    <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                    <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                                    <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Relationship</label>
                                    <input name="emergencyContactRelationship" value={formData.emergencyContactRelationship} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">IGSS Affiliation Number</label>
                                    <input name="igssAffiliation" value={formData.igssAffiliation} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions (Allergies, etc.)</label>
                                    <input name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="Leave blank if none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                                    <input name="profession" value={formData.profession} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level</label>
                                    <select name="academicLevel" value={formData.academicLevel} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Level</option>
                                        <option value="Diversificado">Diversificado</option>
                                        <option value="Técnico">Técnico</option>
                                        <option value="Universidad incompleta">Universidad incompleta</option>
                                        <option value="Estudiante regular">Estudiante regular</option>
                                        <option value="Pensum cerrado">Pensum cerrado</option>
                                        <option value="Graduado">Graduado</option>
                                        <option value="Postgrado">Postgrado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree Title</label>
                                    <input name="degreeTitle" value={formData.degreeTitle} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contracting Company</label>
                                    <select name="contractingCompany" value={formData.contractingCompany} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                        <option value="">Select Company</option>
                                        <option value="Compa Labs Guatemala">Compa Labs Guatemala</option>
                                        <option value="Vana Trust y Vana GT">Vana Trust y Vana GT</option>
                                        <option value="Comun">Comun</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Photo (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        {formData.photoUrl && (
                                            <img src={formData.photoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#EEF2FF] file:text-[#4F7BFE] hover:file:bg-[#DCE4FF] cursor-pointer"
                                        />
                                        {formData.photoUrl && (
                                            <button type="button" onClick={() => setFormData({ ...formData, photoUrl: '' })} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                                        )}
                                    </div>
                                </div>

                                {/* HR Documents Upload Section */}
                                <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-800">HR System Documents</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="relative overflow-hidden inline-block align-middle mt-0.5">
                                                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FF] text-[#4F7BFE] text-xs font-semibold rounded hover:bg-[#DCE4FF] transition-colors border-0">
                                                    Upload Document
                                                </button>
                                                <input
                                                    type="file"
                                                    onChange={handleHrDocumentUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    title="Click to upload HR document"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {formData.hrDocuments && formData.hrDocuments.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            {formData.hrDocuments.map(doc => (
                                                <div key={doc.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteHrDocument(doc.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0 m-1"
                                                        title="Delete File"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 px-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                                            <p className="text-sm text-gray-500">No internal HR documents uploaded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                    <div className="flex justify-between items-center p-6 pt-4 border-t border-gray-100 shrink-0 bg-white w-full">
                        <div>
                            {activeTab === 'quick' && (
                                <div className="flex flex-col gap-4 w-full">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sendOnboardingEmail}
                                            onChange={(e) => setSendOnboardingEmail(e.target.checked)}
                                            className="w-4 h-4 text-[#4F7BFE] bg-gray-100 border-gray-300 rounded focus:ring-[#4F7BFE] focus:ring-2 cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-gray-700 select-none">Send Email</span>
                                    </label>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 w-full max-w-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                                <LinkIcon size={16} className="text-gray-500" />
                                                Get link
                                            </div>
                                            <span className="text-xs text-gray-500 hidden sm:inline">Anyone with this link can view the public profile</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 truncate select-all">
                                                {typeof window !== 'undefined' ? `${window.location.origin}/p/${generatedId}` : ''}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!generatedId) return;
                                                    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${generatedId}` : '';
                                                    navigator.clipboard.writeText(shareUrl).then(() => {
                                                        setCopiedShareLink(true);
                                                        setTimeout(() => setCopiedShareLink(false), 2000);
                                                    }).catch(() => { });
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#4F7BFE] bg-[#EEF2FF] border border-transparent rounded-md hover:bg-[#DCE4FF] focus:outline-none transition-colors whitespace-nowrap"
                                            >
                                                {copiedShareLink ? <Check size={16} /> : <Copy size={16} />}
                                                {copiedShareLink ? 'Copied' : 'Copy link'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F7BFE] disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-[#4F7BFE] border border-transparent rounded-md hover:bg-[#3B5BDB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F7BFE] disabled:opacity-50 flex items-center justify-center">
                                {isSubmitting ? (activeTab === 'quick' ? 'Sending...' : 'Saving...') : (activeTab === 'quick' ? 'Send' : 'Save Employee')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;

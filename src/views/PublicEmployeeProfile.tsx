import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, FileText, CheckCircle, ShieldAlert, Trash2, X, Folder, FolderPlus, ChevronLeft, Check, Download, Calendar as CalendarIcon, Clock, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Employee, EmployeeDocument, TimeOffRequest } from '../types/Employee';
import CountrySelect from '../components/common/CountrySelect';

const PublicEmployeeProfile = () => {
    const { id } = useParams<{ id: string }>();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('Personal');

    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
    const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

    const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
    const [timeOffStartDate, setTimeOffStartDate] = useState('');
    const [timeOffEndDate, setTimeOffEndDate] = useState('');
    const [deletingTimeOffId, setDeletingTimeOffId] = useState<string | null>(null);

    // Profile completion state
    const [isOnboardingSetup, setIsOnboardingSetup] = useState(false);
    const [setupFormData, setSetupFormData] = useState<Partial<Employee>>({});

    const tabs = isOnboardingSetup ? ['Setup Required', 'Documents'] : ['Personal', 'Job', 'Time Off', 'Timesheet', 'Documents', 'Benefits', 'Approval'];

    useEffect(() => {
        const fetchAll = async () => {
            if (!id) return;
            try {
                const { data: allData } = await supabase.from('employees').select('*');
                if (allData) {
                    const formattedAll = allData.map(emp => ({
                        id: emp.id,
                        firstName: emp.first_name,
                        lastName: emp.last_name,
                        email: emp.email,
                        hireDate: emp.hire_date,
                        employmentStatus: emp.employment_status,
                        department: emp.department,
                        location: emp.location,
                        jobTitle: emp.job_title,
                        reportingTo: emp.reporting_to,
                        status: emp.status,
                        bankName: emp.bank_name,
                        bankAccountNumber: emp.bank_account_number,
                        photoUrl: emp.photo_url,
                        hrDocuments: emp.hr_documents || [],
                        documents: emp.documents || [],
                        documentFolders: emp.document_folders || [],
                        hrDocumentFolders: emp.hr_document_folders || [],
                        timeOffRequests: emp.time_off_requests || [],
                        nationalId: emp.national_id,
                        dateOfBirth: emp.date_of_birth,
                        taxId: emp.tax_id,
                        phoneNumber: emp.phone_number,
                        homeAddress: emp.home_address,
                        nationality: emp.nationality,
                        personalEmail: emp.personal_email,
                        maritalStatus: emp.marital_status,
                        emergencyContactName: emp.emergency_contact_name,
                        emergencyContactPhone: emp.emergency_contact_phone,
                        emergencyContactRelationship: emp.emergency_contact_relationship,
                        bankAccountType: emp.bank_account_type,
                        igssAffiliation: emp.igss_affiliation,
                        gender: emp.gender,
                        medicalConditions: emp.medical_conditions,
                        profession: emp.profession,
                        academicLevel: emp.academic_level,
                        degreeTitle: emp.degree_title,
                        bloodType: emp.blood_type,
                        tShirtSize: emp.t_shirt_size,
                        contractingCompany: emp.contracting_company,
                        legalEntity: emp.legal_entity
                    })) as Employee[];

                    setAllEmployees(formattedAll);

                    const found = formattedAll.find(emp => emp.id === id);
                    if (found) {
                        setEmployee(found);
                        if (found.status === 'Onboarding') {
                            setIsOnboardingSetup(true);
                            setActiveTab('Setup Required');
                            const [parsedCity = '', parsedCountry = ''] = (found.location || '').split(',').map(s => s.trim());
                            setSetupFormData({
                                ...found,
                                city: parsedCity,
                                country: parsedCountry
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load DB", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();
    }, [id]);

    const updateEmployeeInDb = async (updatedEmp: Employee, isOtherEmployee = false) => {
        const { error } = await supabase.from('employees').update({
            first_name: updatedEmp.firstName,
            last_name: updatedEmp.lastName,
            email: updatedEmp.email,
            personal_email: updatedEmp.personalEmail,
            hire_date: updatedEmp.hireDate,
            employment_status: updatedEmp.employmentStatus,
            department: updatedEmp.department,
            location: updatedEmp.location,
            job_title: updatedEmp.jobTitle,
            reporting_to: updatedEmp.reportingTo,
            status: updatedEmp.status,
            bank_name: updatedEmp.bankName,
            bank_account_number: updatedEmp.bankAccountNumber,
            bank_account_type: updatedEmp.bankAccountType,
            photo_url: updatedEmp.photoUrl,
            hr_documents: updatedEmp.hrDocuments,
            documents: updatedEmp.documents,
            document_folders: updatedEmp.documentFolders,
            hr_document_folders: updatedEmp.hrDocumentFolders,
            time_off_requests: updatedEmp.timeOffRequests,
            national_id: updatedEmp.nationalId,
            date_of_birth: updatedEmp.dateOfBirth,
            tax_id: updatedEmp.taxId,
            phone_number: updatedEmp.phoneNumber,
            home_address: updatedEmp.homeAddress,
            nationality: updatedEmp.nationality,
            marital_status: updatedEmp.maritalStatus,
            emergency_contact_name: updatedEmp.emergencyContactName,
            emergency_contact_phone: updatedEmp.emergencyContactPhone,
            emergency_contact_relationship: updatedEmp.emergencyContactRelationship,
            igss_affiliation: updatedEmp.igssAffiliation,
            gender: updatedEmp.gender,
            medical_conditions: updatedEmp.medicalConditions,
            profession: updatedEmp.profession,
            academic_level: updatedEmp.academicLevel,
            degree_title: updatedEmp.degreeTitle,
            blood_type: updatedEmp.bloodType,
            t_shirt_size: updatedEmp.tShirtSize,
            contracting_company: updatedEmp.contractingCompany,
            legal_entity: updatedEmp.legalEntity
        }).eq('id', updatedEmp.id);

        if (error) {
            console.error("Failed to update employee in Supabase", error);
        } else {
            const updatedEmployees = allEmployees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp);
            setAllEmployees(updatedEmployees);
            if (!isOtherEmployee) {
                setEmployee(updatedEmp);
            }
        }
    };

    const handleSetupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSetupFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCompleteSetup = () => {
        if (!employee) return;
        const completeEmployee: Employee = {
            ...employee,
            ...setupFormData,
            location: [setupFormData.city, setupFormData.country].filter(Boolean).join(', '),
            status: 'Pending Approval',
        };

        updateEmployeeInDb(completeEmployee);
        setIsOnboardingSetup(false);
        setActiveTab('Personal');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && id) {
            const ext = file.name.split('.').pop();
            const filePath = `${id}/avatar_${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage.from('avatars').upload(filePath, file);
            if (data && !error) {
                const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                setSetupFormData(prev => ({ ...prev, photoUrl: publicData.publicUrl }));
            } else {
                // Base64 fallback
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSetupFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const pendingApprovals = employee ? allEmployees.reduce((acc, emp) => {
        if (emp.reportingTo === `${employee.firstName} ${employee.lastName}`) {
            const pendingReqs = emp.timeOffRequests?.filter(req => req.status === 'Pending') || [];
            return acc.concat(pendingReqs);
        }
        return acc;
    }, [] as TimeOffRequest[]) : [];

    const handleRequestTimeOff = () => {
        if (!employee || !timeOffStartDate || !timeOffEndDate) return;

        const newRequest: TimeOffRequest = {
            id: Math.random().toString(36).substring(2, 9),
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            startDate: timeOffStartDate,
            endDate: timeOffEndDate,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        const updatedEmployee = {
            ...employee,
            timeOffRequests: [...(employee.timeOffRequests || []), newRequest]
        };

        updateEmployeeInDb(updatedEmployee);
        setIsTimeOffModalOpen(false);
        setTimeOffStartDate('');
        setTimeOffEndDate('');
    };

    const handleDeleteTimeOff = (reqId: string) => {
        if (!employee) return;

        const updatedReqs = employee.timeOffRequests?.filter(r => r.id !== reqId) || [];
        const updatedEmployee = { ...employee, timeOffRequests: updatedReqs };

        updateEmployeeInDb(updatedEmployee);
        setDeletingTimeOffId(null);
    };

    const handleApproveRejectRequest = (reqId: string, empId: string, status: 'Approved' | 'Rejected') => {
        const requestingEmp = allEmployees.find(e => e.id === empId);
        if (!requestingEmp) return;

        const updatedReqs = requestingEmp.timeOffRequests?.map(r => r.id === reqId ? { ...r, status } : r) || [];
        const updatedRequestingEmp = { ...requestingEmp, timeOffRequests: updatedReqs };

        updateEmployeeInDb(updatedRequestingEmp, employee?.id !== empId);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !employee) return;

        setIsUploading(true);
        const docId = Math.random().toString(36).substring(2, 9);
        const ext = file.name.split('.').pop();
        const filePath = `${employee.id}/doc_${docId}.${ext}`;

        const { data } = await supabase.storage.from('hr-documents').upload(filePath, file);

        if (data) {
            const { data: publicData } = supabase.storage.from('hr-documents').getPublicUrl(filePath);
            const newDoc: EmployeeDocument = {
                id: docId,
                name: file.name,
                dataUrl: publicData.publicUrl,
                uploadedAt: new Date().toISOString(),
                folderId: activeFolderId || undefined
            };

            const updatedEmployee = {
                ...employee,
                documents: [...(employee.documents || []), newDoc]
            };

            updateEmployeeInDb(updatedEmployee);
        }
        setIsUploading(false);
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim() || !employee) return;

        const newFolder = {
            id: Math.random().toString(36).substring(2, 9),
            name: newFolderName.trim(),
            createdAt: new Date().toISOString()
        };

        const updatedFolders = [...(employee.documentFolders || []), newFolder];
        const updatedEmployee = { ...employee, documentFolders: updatedFolders };

        updateEmployeeInDb(updatedEmployee);
        setNewFolderName('');
        setIsCreatingFolder(false);
    };

    const handleDeleteDocument = (docId: string) => {
        if (!employee) return;

        const updatedDocs = employee.documents?.filter(d => d.id !== docId) || [];
        const updatedEmployee = { ...employee, documents: updatedDocs };

        updateEmployeeInDb(updatedEmployee);
        setDeletingDocId(null);
    };

    const handleDeleteFolder = (folderId: string) => {
        if (!employee) return;

        const updatedFolders = employee.documentFolders?.filter(f => f.id !== folderId) || [];
        const updatedDocs = employee.documents?.filter(d => d.folderId !== folderId) || [];

        const updatedEmployee = {
            ...employee,
            documentFolders: updatedFolders,
            documents: updatedDocs
        };

        updateEmployeeInDb(updatedEmployee);
        setDeletingFolderId(null);
        if (activeFolderId === folderId) setActiveFolderId(null);
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-[#4F7BFE] font-medium">Loading profile...</div>;
    }

    if (!employee) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <ShieldAlert size={48} className="text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
                <p className="text-gray-500 max-w-md">The requested employee profile does not exist or the link has expired. Please contact your HR administrator.</p>
            </div>
        );
    }

    if (employee.status === 'Pending Approval') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
                <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full flex flex-col items-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Clock size={40} className="text-[#4F7BFE]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">Pending Approval</h1>
                    <p className="text-gray-600 mb-8 max-w-sm text-center">
                        Thank you for completing your profile! Your information has been sent to the HR System Administrator for review.
                        You will be able to access your full profile and the company directory once approved.
                    </p>
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                        {employee.photoUrl ? (
                            <img src={employee.photoUrl} alt={employee.firstName} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-white text-[#4F7BFE] flex items-center justify-center font-bold shadow-sm ring-2 ring-gray-50">
                                {employee.firstName[0]}{employee.lastName[0]}
                            </div>
                        )}
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{employee.firstName} {employee.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{employee.jobTitle}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Minimal Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-center shadow-sm">
                <div className="w-8 h-8 bg-[#4F7BFE] rounded flex items-center justify-center text-white font-bold tracking-tighter mr-2 relative overflow-hidden">
                    <span className="relative z-10">V</span>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/10"></div>
                </div>
                <span className="text-xl font-bold tracking-tight text-gray-800">Vana HR Partner</span>
            </header>

            <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Profile Card */}
                {(!isOnboardingSetup || activeTab !== 'Setup Required') && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#EEF2FF] to-white p-6 sm:p-8 flex items-center gap-6">
                            {employee.photoUrl ? (
                                <img src={employee.photoUrl} alt={employee.firstName} className="w-24 h-24 rounded-full object-cover shadow-sm ring-4 ring-white" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-white text-[#4F7BFE] flex items-center justify-center font-bold text-3xl shadow-sm ring-4 ring-gray-50">
                                    {employee.firstName[0]}{employee.lastName[0]}
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">{employee.firstName} {employee.lastName}</h1>
                                <p className="text-lg font-medium text-[#4F7BFE]">{employee.jobTitle}</p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium">
                                    <ShieldAlert size={14} className="text-amber-500" />
                                    <span>Read-Only View</span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={() => setIsTimeOffModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#4F7BFE] text-white font-semibold rounded hover:bg-[#3B5BDB] transition-colors"
                                >
                                    <CalendarIcon size={18} />
                                    Request Time Off
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs & Content Container */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tabs */}
                    {(!isOnboardingSetup || activeTab !== 'Setup Required') && (
                        <div className="bg-[#2744A0] px-6 flex items-end shrink-0 pt-2 shadow-inner overflow-x-auto">
                            {tabs.map(tab => {
                                const showBadge = tab === 'Approval' && pendingApprovals.length > 0;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-5 py-2.5 font-medium text-sm transition-colors cursor-pointer focus:outline-none whitespace-nowrap flex items-center gap-2 ${activeTab === tab
                                            ? 'bg-white text-[#2744A0] rounded-t-lg'
                                            : 'text-white/90 hover:bg-white/20 hover:text-white hover:rounded-t-lg'
                                            }`}
                                    >
                                        {tab}
                                        {showBadge && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                {pendingApprovals.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="bg-white">
                        {activeTab === 'Personal' && (
                            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                    <p className="text-gray-900 font-medium">{employee.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                                    <p className="text-gray-900 font-medium">{employee.department}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">City, Country</p>
                                    <p className="text-gray-900 font-medium">{employee.location}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hire Date</p>
                                    <p className="text-gray-900 font-medium">{employee.hireDate}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Employment Status</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {employee.employmentStatus}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full ${employee.status === 'Inactive' ? 'bg-red-100 text-red-700' : 'bg-[#E8F5E9] text-[#4CAF50]'}`}>
                                        {employee.status || 'Active'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Manager</p>
                                    <p className="text-gray-900 font-medium">{employee.reportingTo}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bank Name</p>
                                    <p className="text-gray-900 font-medium">{employee.bankName || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bank Account Number</p>
                                    <p className="text-gray-900 font-medium">{employee.bankAccountNumber ? `••••${employee.bankAccountNumber.slice(-4)}` : 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bank Account Type</p>
                                    <p className="text-gray-900 font-medium">{employee.bankAccountType || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">National ID (DPI/DNI)</p>
                                    <p className="text-gray-900 font-medium">{employee.nationalId || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tax ID (NIT)</p>
                                    <p className="text-gray-900 font-medium">{employee.taxId || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                                    <p className="text-gray-900 font-medium">{employee.dateOfBirth || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nationality</p>
                                    <p className="text-gray-900 font-medium">{employee.nationality || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                                    <p className="text-gray-900 font-medium">{employee.gender || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Marital Status</p>
                                    <p className="text-gray-900 font-medium">{employee.maritalStatus || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Blood Type</p>
                                    <p className="text-gray-900 font-medium">{employee.bloodType || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">T-Shirt Size</p>
                                    <p className="text-gray-900 font-medium">{employee.tShirtSize || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                                    <p className="text-gray-900 font-medium">{employee.phoneNumber || 'Not provided'}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Home Address</p>
                                    <p className="text-gray-900 font-medium">{employee.homeAddress || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Personal Email</p>
                                    <p className="text-gray-900 font-medium">{employee.personalEmail || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Emergency Contact Name</p>
                                    <p className="text-gray-900 font-medium">{employee.emergencyContactName || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Emergency Contact Phone</p>
                                    <p className="text-gray-900 font-medium">{employee.emergencyContactPhone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Emergency Contact Relationship</p>
                                    <p className="text-gray-900 font-medium">{employee.emergencyContactRelationship || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">IGSS Affiliation</p>
                                    <p className="text-gray-900 font-medium">{employee.igssAffiliation || 'Not provided'}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Medical Conditions</p>
                                    <p className="text-gray-900 font-medium">{employee.medicalConditions || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Profession</p>
                                    <p className="text-gray-900 font-medium">{employee.profession || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Academic Level</p>
                                    <p className="text-gray-900 font-medium">{employee.academicLevel || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Degree Title</p>
                                    <p className="text-gray-900 font-medium">{employee.degreeTitle || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Contracting Company</p>
                                    <p className="text-gray-900 font-medium">{employee.contractingCompany || 'Not provided'}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Setup Required' && isOnboardingSetup && (
                            <div className="p-6 sm:p-8">
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Sparkles className="text-[#4F7BFE]" size={20} />
                                        Complete Your Profile
                                    </h2>
                                    <p className="text-gray-500 mt-1">Please fill out your remaining details to finish the setup process and activate your account.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                        <input required name="firstName" value={setupFormData.firstName || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                        <input required name="lastName" value={setupFormData.lastName || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email *</label>
                                        <input required type="email" name="personalEmail" value={setupFormData.personalEmail || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input required type="email" name="email" value={setupFormData.email || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                                        <input required name="jobTitle" value={setupFormData.jobTitle || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <select name="department" value={setupFormData.department || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
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
                                        <div className="relative z-10">
                                            <CountrySelect
                                                name="country"
                                                value={setupFormData.country || ''}
                                                onChange={handleSetupChange}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input name="city" value={setupFormData.city || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="e.g. Guatemala City" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                                        <input type="date" name="hireDate" value={setupFormData.hireDate || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                                        <select name="employmentStatus" value={setupFormData.employmentStatus || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                            <option value="Full Time">Full Time</option>
                                            <option value="Part Time">Part Time</option>
                                            <option value="Contractor">Contractor</option>
                                            <option value="Intern">Intern</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reporting To</label>
                                        <select name="reportingTo" value={setupFormData.reportingTo || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                            <option value="">None / CEO</option>
                                            {allEmployees.map(emp => {
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                        <input name="bankName" value={setupFormData.bankName || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="e.g. Chase" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                                        <input name="bankAccountNumber" value={setupFormData.bankAccountNumber || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="Account Number" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Type</label>
                                        <select name="bankAccountType" value={setupFormData.bankAccountType || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                            <option value="">Select Account Type</option>
                                            <option value="Monetaria">Monetaria</option>
                                            <option value="Ahorro">Ahorro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">National ID (DPI/DNI)</label>
                                        <input name="nationalId" value={setupFormData.nationalId || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (NIT)</label>
                                        <input name="taxId" value={setupFormData.taxId || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                        <input type="date" name="dateOfBirth" value={setupFormData.dateOfBirth || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                        <select name="nationality" value={setupFormData.nationality || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
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
                                        <select name="gender" value={setupFormData.gender || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                            <option value="">Select Gender</option>
                                            <option value="Hombre">Hombre</option>
                                            <option value="Mujer">Mujer</option>
                                            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                                        <select name="maritalStatus" value={setupFormData.maritalStatus || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                            <option value="">Select Marital Status</option>
                                            <option value="Soltero">Soltero</option>
                                            <option value="Casado">Casado</option>
                                            <option value="Divorciado">Divorciado</option>
                                            <option value="Viudo">Viudo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                                        <select name="bloodType" value={setupFormData.bloodType || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
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
                                        <select name="tShirtSize" value={setupFormData.tShirtSize || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
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
                                        <input name="phoneNumber" value={setupFormData.phoneNumber || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                                        <input name="homeAddress" value={setupFormData.homeAddress || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                        <input name="emergencyContactName" value={setupFormData.emergencyContactName || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                                        <input name="emergencyContactPhone" value={setupFormData.emergencyContactPhone || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Relationship</label>
                                        <input name="emergencyContactRelationship" value={setupFormData.emergencyContactRelationship || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">IGSS Affiliation Number</label>
                                        <input name="igssAffiliation" value={setupFormData.igssAffiliation || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions (Allergies, etc.)</label>
                                        <input name="medicalConditions" value={setupFormData.medicalConditions || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" placeholder="Leave blank if none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                                        <input name="profession" value={setupFormData.profession || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level</label>
                                        <select name="academicLevel" value={setupFormData.academicLevel || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
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
                                        <input name="degreeTitle" value={setupFormData.degreeTitle || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contracting Company</label>
                                        <select name="contractingCompany" value={setupFormData.contractingCompany || ''} onChange={handleSetupChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none">
                                            <option value="">Select Company</option>
                                            <option value="Compa Labs Guatemala">Compa Labs Guatemala</option>
                                            <option value="Vana Trust y Vana GT">Vana Trust y Vana GT</option>
                                            <option value="Comun">Comun</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Photo (Optional)</label>
                                        <div className="flex items-center gap-4">
                                            {setupFormData.photoUrl && (
                                                <img src={setupFormData.photoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#EEF2FF] file:text-[#4F7BFE] hover:file:bg-[#DCE4FF] cursor-pointer"
                                            />
                                            {setupFormData.photoUrl && (
                                                <button type="button" onClick={() => setSetupFormData({ ...setupFormData, photoUrl: '' })} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={handleCompleteSetup}
                                        className="bg-[#4F7BFE] hover:bg-[#3B5BDB] text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <CheckCircle size={18} />
                                        Complete & Activate Profile
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Documents' && (
                            <div>
                                <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Requested Documents</h2>
                                        <p className="text-sm text-gray-500 mt-1">Upload files requested by HR (e.g. ID, Tax Forms). These will be securely attached to your profile.</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {!activeFolderId ? (
                                            <>
                                                {isCreatingFolder ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={newFolderName}
                                                            onChange={(e) => setNewFolderName(e.target.value)}
                                                            placeholder="Folder name"
                                                            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#4F7BFE] w-32 sm:w-40"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                                        />
                                                        <button onClick={handleCreateFolder} className="p-1.5 bg-[#4F7BFE] text-white rounded hover:bg-[#3B5BDB]">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setIsCreatingFolder(true)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
                                                    >
                                                        <FolderPlus size={16} /> New Folder
                                                    </button>
                                                )}

                                                <div className="relative overflow-hidden group">
                                                    <button disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-[#4F7BFE] text-white text-sm font-semibold rounded hover:bg-[#3B5BDB] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#4F7BFE] disabled:opacity-50">
                                                        <Upload size={16} />
                                                        {isUploading ? 'Uploading...' : 'Upload File'}
                                                    </button>
                                                    <input
                                                        type="file"
                                                        onChange={handleFileUpload}
                                                        disabled={isUploading}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                        title="Click to upload document"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="relative overflow-hidden group">
                                                <button disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-[#4F7BFE] text-white text-sm font-semibold rounded hover:bg-[#3B5BDB] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#4F7BFE] disabled:opacity-50">
                                                    <Upload size={16} />
                                                    {isUploading ? 'Uploading...' : 'Upload File'}
                                                </button>
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                    title="Click to upload document"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeFolderId && (
                                    <div className="px-6 sm:px-8 pt-6 pb-2 flex items-center gap-2 text-gray-600">
                                        <button
                                            onClick={() => setActiveFolderId(null)}
                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                            title="Back to Folders"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <Folder size={20} className="text-gray-400 fill-current" />
                                        <span className="font-bold text-lg text-gray-900">{employee.documentFolders?.find(f => f.id === activeFolderId)?.name || 'Folder'}</span>
                                    </div>
                                )}

                                <div className="p-6 sm:p-8">
                                    {!activeFolderId && employee.documentFolders && employee.documentFolders.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                                            {employee.documentFolders.map(folder => {
                                                const itemCnt = employee.documents?.filter(d => d.folderId === folder.id).length || 0;
                                                return (
                                                    <div
                                                        key={folder.id}
                                                        onClick={() => setActiveFolderId(folder.id)}
                                                        className="p-5 rounded-xl bg-white border border-gray-200 hover:border-[#4F7BFE] hover:shadow-md transition-all cursor-pointer group flex flex-col items-center justify-center text-center text-gray-700 h-32 relative"
                                                    >
                                                        {deletingFolderId === folder.id ? (
                                                            <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center z-10 p-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <span className="text-sm text-red-600 font-bold text-center">Delete folder?</span>
                                                                <div className="flex gap-2 text-sm">
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="px-3 py-1.5 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors">Yes</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); setDeletingFolderId(null); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 font-bold rounded hover:bg-gray-300 transition-colors">No</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeletingFolderId(folder.id);
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                                                                title="Delete Folder"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                        <Folder size={44} className="text-gray-300 group-hover:text-[#4F7BFE] mb-3 fill-current transition-colors" />
                                                        <p className="text-sm font-bold truncate w-full px-2 text-gray-900" title={folder.name}>{folder.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{itemCnt} item{itemCnt !== 1 ? 's' : ''}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {(() => {
                                        const displayedDocs = employee.documents?.filter(d =>
                                            activeFolderId ? d.folderId === activeFolderId : !d.folderId
                                        ) || [];

                                        return displayedDocs.length > 0 ? (
                                            <ul className="space-y-3">
                                                {displayedDocs.map(doc => (
                                                    <li key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="truncate">
                                                                <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                                                                <p className="text-xs text-gray-500">Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {deletingDocId === doc.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-red-600 font-medium hidden sm:inline">Delete?</span>
                                                                <button onClick={() => handleDeleteDocument(doc.id)} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">
                                                                    Yes
                                                                </button>
                                                                <button onClick={() => setDeletingDocId(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1.5 text-[#4F7BFE] hidden sm:flex">
                                                                    <CheckCircle size={16} />
                                                                    <span className="text-xs font-semibold">Received</span>
                                                                </div>
                                                                <a
                                                                    href={doc.dataUrl}
                                                                    download={doc.name}
                                                                    className="p-1.5 text-gray-400 hover:text-[#4F7BFE] hover:bg-[#EEF2FF] rounded-full transition-colors ml-1"
                                                                    title="Download Document"
                                                                >
                                                                    <Download size={16} />
                                                                </a>
                                                                <button
                                                                    onClick={() => setDeletingDocId(doc.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                                                                    title="Delete Document"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                                <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                                                <p className="text-sm font-medium text-gray-600">No documents in this section yet</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Time Off' && (() => {
                            // Calculate start of today for comparisons
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const approvedRequests = employee.timeOffRequests?.filter(r => r.status === 'Approved') || [];

                            const upcomingRequests = approvedRequests.filter(req => {
                                const endDate = new Date(req.endDate);
                                endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
                                endDate.setHours(0, 0, 0, 0);
                                return endDate >= today;
                            }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

                            const historyRequests = approvedRequests.filter(req => {
                                const endDate = new Date(req.endDate);
                                endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
                                endDate.setHours(0, 0, 0, 0);
                                return endDate < today;
                            }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Sort descending for history

                            return (
                                <div className="p-6 sm:p-8 space-y-10">
                                    {/* Upcoming Time Off Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                            <Clock size={20} className="text-gray-900" />
                                            <h2 className="text-lg font-bold text-gray-900">Upcoming Time Off</h2>
                                        </div>
                                        <div className="space-y-0">
                                            {upcomingRequests.length > 0 ? (
                                                upcomingRequests.map(req => {
                                                    const start = new Date(req.startDate);
                                                    start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
                                                    const end = new Date(req.endDate);
                                                    end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
                                                    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                                                    const dateStr = start.getTime() === end.getTime()
                                                        ? start.toLocaleDateString(undefined, options)
                                                        : `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;

                                                    return (
                                                        <div key={req.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-green-600">
                                                                    <Sparkles size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{dateStr}</p>
                                                                    <p className="text-sm text-gray-500">Approved Time Off</p>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                {deletingTimeOffId === req.id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-red-600 font-medium hidden sm:inline">Cancel?</span>
                                                                        <button onClick={() => handleDeleteTimeOff(req.id)} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">
                                                                            Yes
                                                                        </button>
                                                                        <button onClick={() => setDeletingTimeOffId(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setDeletingTimeOffId(req.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                                        title="Cancel Time Off"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-gray-500 py-4">No upcoming approved time off.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* History Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
                                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                <path d="M3 3v5h5" />
                                                <path d="M12 7v5l4 2" />
                                            </svg>
                                            <h2 className="text-lg font-bold text-gray-900">History</h2>
                                        </div>
                                        <div className="space-y-0">
                                            {historyRequests.length > 0 ? (
                                                <div className="w-full">
                                                    <div className="grid grid-cols-12 gap-4 py-3 bg-gray-100 rounded-t-md px-4 text-sm font-bold text-gray-600 border-b border-gray-200">
                                                        <div className="col-span-3 lg:col-span-2">Date</div>
                                                        <div className="col-span-6 lg:col-span-8">Description</div>
                                                        <div className="col-span-3 lg:col-span-2 text-right">Status</div>
                                                    </div>
                                                    {historyRequests.map(req => {
                                                        const start = new Date(req.startDate);
                                                        start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
                                                        const end = new Date(req.endDate);
                                                        end.setMinutes(end.getMinutes() + end.getTimezoneOffset());

                                                        const dateStr = start.getTime() === end.getTime()
                                                            ? start.toLocaleDateString()
                                                            : `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;

                                                        return (
                                                            <div key={req.id} className="grid grid-cols-12 gap-4 py-4 px-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors items-center text-sm">
                                                                <div className="col-span-3 lg:col-span-2 font-medium text-gray-900">
                                                                    {dateStr}
                                                                </div>
                                                                <div className="col-span-6 lg:col-span-8">
                                                                    <p className="font-bold text-gray-800">Vacation</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5 border border-orange-300 bg-orange-50 text-orange-800 inline-block px-1 rounded">Approved Time Off</p>
                                                                </div>
                                                                <div className="col-span-3 lg:col-span-2 text-right">
                                                                    <span className="text-gray-500 line-through text-xs font-semibold uppercase">Taken</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 py-4">No time off history.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {activeTab === 'Approval' && (
                            <div className="p-6 sm:p-8">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Pending Time Off Requests</h2>
                                {pendingApprovals.length > 0 ? (
                                    <div className="space-y-4">
                                        {pendingApprovals.map(req => {
                                            const startStr = req.startDate;
                                            const endStr = req.endDate;
                                            return (
                                                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg gap-4 bg-gray-50">
                                                    <div>
                                                        <p className="font-bold text-gray-900">{req.employeeName}</p>
                                                        <p className="text-sm text-gray-600 mt-1">Requested to be off from <strong className="text-gray-900">{startStr}</strong> to <strong className="text-gray-900">{endStr}</strong>.</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleApproveRejectRequest(req.id, req.employeeId, 'Approved')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors"
                                                        >
                                                            <Check size={16} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveRejectRequest(req.id, req.employeeId, 'Rejected')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 transition-colors"
                                                        >
                                                            <X size={16} /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                        <CheckCircle size={32} className="mx-auto text-green-500 mb-3" />
                                        <p className="text-sm font-medium text-gray-600">You're all caught up! No pending approvals.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {['Job', 'Timesheet', 'Benefits'].includes(activeTab) && (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{activeTab}</h3>
                                <p className="text-gray-500">This section is currently under construction.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Time Off Modal */}
            {isTimeOffModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CalendarIcon size={20} className="text-[#4F7BFE]" />
                                Request Time Off
                            </h2>
                            <button onClick={() => setIsTimeOffModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={timeOffStartDate}
                                    onChange={(e) => {
                                        setTimeOffStartDate(e.target.value);
                                        if (timeOffEndDate && e.target.value > timeOffEndDate) {
                                            setTimeOffEndDate(e.target.value);
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4F7BFE] focus:ring-1 focus:ring-[#4F7BFE] transition-shadow shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={timeOffEndDate}
                                    onChange={(e) => setTimeOffEndDate(e.target.value)}
                                    min={timeOffStartDate}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4F7BFE] focus:ring-1 focus:ring-[#4F7BFE] transition-shadow shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setIsTimeOffModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestTimeOff}
                                disabled={!timeOffStartDate || !timeOffEndDate}
                                className="flex items-center gap-2 px-4 py-2 bg-[#4F7BFE] text-white font-bold rounded-lg hover:bg-[#3B5BDB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <Send size={16} />
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicEmployeeProfile;

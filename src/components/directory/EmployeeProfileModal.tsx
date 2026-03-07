import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save, XCircle, Link as LinkIcon, Check, Download, FileText, Folder, FolderPlus, ChevronLeft, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Employee } from '../../types/Employee';

interface Props {
    employee: Employee | null;
    employees: Employee[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (employee: Employee) => void;
    onDelete: (id: string) => void;
}

const EmployeeProfileModal: React.FC<Props> = ({ employee, employees, isOpen, onClose, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Employee | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
    const [deletingHrDocId, setDeletingHrDocId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('Personal');

    // Parse location into city and country for the form
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');

    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

    const [activeHrFolderId, setActiveHrFolderId] = useState<string | null>(null);
    const [isCreatingHrFolder, setIsCreatingHrFolder] = useState(false);
    const [newHrFolderName, setNewHrFolderName] = useState('');
    const [deletingHrFolderId, setDeletingHrFolderId] = useState<string | null>(null);
    const [deletingTimeOffId, setDeletingTimeOffId] = useState<string | null>(null);

    const tabs = ['Personal', 'Job', 'Time Off', 'Timesheet', 'Documents', 'Benefits'];

    // Sync internal state when a new employee is selected or edited
    useEffect(() => {
        if (employee) {
            setFormData(employee);
            const [parsedCity = '', parsedCountry = ''] = (employee.location || '').split(',').map(s => s.trim());
            setCity(parsedCity);
            setCountry(parsedCountry);
        }
    }, [employee]);

    // Reset editing state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            setShowDeleteConfirm(false);
            setDeletingDocId(null);
            setDeletingHrDocId(null);
            setActiveFolderId(null);
            setActiveHrFolderId(null);
            setIsCreatingFolder(false);
            setNewFolderName('');
            setIsCreatingHrFolder(false);
            setNewHrFolderName('');
            setDeletingFolderId(null);
            setDeletingHrFolderId(null);
            setDeletingTimeOffId(null);
            setCity('');
            setCountry('');
        }
    }, [isOpen]);

    if (!isOpen || !formData || !employee) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && formData) {
            const ext = file.name.split('.').pop();
            const filePath = `${formData.id}/avatar_${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage.from('avatars').upload(filePath, file);
            if (data && !error) {
                const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                setFormData(prev => prev ? ({ ...prev, photoUrl: publicData.publicUrl }) : null);
            } else {
                console.error("Storage upload failed, falling back to base64", error);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => prev ? ({ ...prev, photoUrl: reader.result as string }) : null);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !formData) return;

        const docId = Math.random().toString(36).substring(2, 9);
        const ext = file.name.split('.').pop();
        const filePath = `${formData.id}/doc_${docId}.${ext}`;

        const { data, error } = await supabase.storage.from('hr-documents').upload(filePath, file);
        if (data && !error) {
            const { data: publicData } = supabase.storage.from('hr-documents').getPublicUrl(filePath);
            const newDoc = {
                id: docId,
                name: file.name,
                dataUrl: publicData.publicUrl,
                uploadedAt: new Date().toISOString(),
                folderId: activeFolderId || undefined
            };

            const updatedDocs = [...(formData.documents || []), newDoc];
            const updatedEmployee = { ...formData, documents: updatedDocs };
            setFormData(updatedEmployee);
            onUpdate(updatedEmployee);
        } else {
            console.error("Storage upload failed, falling back to base64", error);
            const reader = new FileReader();
            reader.onloadend = () => {
                const newDoc = {
                    id: docId,
                    name: file.name,
                    dataUrl: reader.result as string,
                    uploadedAt: new Date().toISOString(),
                    folderId: activeFolderId || undefined
                };
                const updatedDocs = [...(formData.documents || []), newDoc];
                const updatedEmployee = { ...formData, documents: updatedDocs };
                setFormData(updatedEmployee);
                onUpdate(updatedEmployee);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim() || !formData) return;

        const newFolder = {
            id: Math.random().toString(36).substring(2, 9),
            name: newFolderName.trim(),
            createdAt: new Date().toISOString()
        };

        const updatedFolders = [...(formData.documentFolders || []), newFolder];
        const updatedEmployee = { ...formData, documentFolders: updatedFolders };
        setFormData(updatedEmployee);
        onUpdate(updatedEmployee);
        setNewFolderName('');
        setIsCreatingFolder(false);
    };

    const handleCreateHrFolder = () => {
        if (!newHrFolderName.trim() || !formData) return;

        const newFolder = {
            id: Math.random().toString(36).substring(2, 9),
            name: newHrFolderName.trim(),
            createdAt: new Date().toISOString()
        };

        const updatedFolders = [...(formData.hrDocumentFolders || []), newFolder];
        const updatedEmployee = { ...formData, hrDocumentFolders: updatedFolders };
        setFormData(updatedEmployee);
        onUpdate(updatedEmployee);
        setNewHrFolderName('');
        setIsCreatingHrFolder(false);
    };

    const handleHrDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !formData) return;

        const docId = Math.random().toString(36).substring(2, 9);
        const ext = file.name.split('.').pop();
        const filePath = `${formData.id}/hr_${docId}.${ext}`;

        const { data, error } = await supabase.storage.from('hr-documents').upload(filePath, file);
        if (data && !error) {
            const { data: publicData } = supabase.storage.from('hr-documents').getPublicUrl(filePath);
            const newDoc = {
                id: docId,
                name: file.name,
                dataUrl: publicData.publicUrl,
                uploadedAt: new Date().toISOString(),
                folderId: activeHrFolderId || undefined
            };

            const updatedHrDocs = [...(formData.hrDocuments || []), newDoc];
            const updatedEmployee = { ...formData, hrDocuments: updatedHrDocs };
            setFormData(updatedEmployee);
            onUpdate(updatedEmployee);
        } else {
            console.error("Storage upload failed, falling back to base64", error);
            const reader = new FileReader();
            reader.onloadend = () => {
                const newDoc = {
                    id: docId,
                    name: file.name,
                    dataUrl: reader.result as string,
                    uploadedAt: new Date().toISOString(),
                    folderId: activeHrFolderId || undefined
                };
                const updatedHrDocs = [...(formData.hrDocuments || []), newDoc];
                const updatedEmployee = { ...formData, hrDocuments: updatedHrDocs };
                setFormData(updatedEmployee);
                onUpdate(updatedEmployee);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (formData) {
            const loc = [city, country].filter(Boolean).join(', ');
            onUpdate({ ...formData, location: loc, city, country });
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setFormData(employee); // Revert changes
        if (employee) {
            const [parsedCity = '', parsedCountry = ''] = (employee.location || '').split(',').map(s => s.trim());
            setCity(parsedCity);
            setCountry(parsedCountry);
        }
        setIsEditing(false);
    };

    const handleDeleteConfirm = () => {
        onDelete(employee.id);
        onClose();
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/p/${employee.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeleteDocument = (docId: string) => {
        if (!formData) return;
        const updatedDocs = formData.documents?.filter(d => d.id !== docId) || [];
        const updatedEmployee = { ...formData, documents: updatedDocs };
        setFormData(updatedEmployee);
        onUpdate(updatedEmployee);
        setDeletingDocId(null);
    };

    const handleDeleteHrDocument = (docId: string) => {
        if (!formData) return;
        const updatedHrDocs = formData.hrDocuments?.filter(d => d.id !== docId) || [];
        const updatedEmployee = { ...formData, hrDocuments: updatedHrDocs };
        setFormData(updatedEmployee);
        onUpdate(updatedEmployee);
        setDeletingHrDocId(null);
    };

    const handleDeleteFolder = (folderId: string) => {
        if (!formData) return;
        const updatedFolders = formData.documentFolders?.filter(f => f.id !== folderId) || [];
        const updatedDocs = formData.documents?.filter(d => d.folderId !== folderId) || [];
        const updatedEmployee = { ...formData, documentFolders: updatedFolders, documents: updatedDocs };
        setFormData(updatedEmployee);
        onUpdate(updatedEmployee);
        setDeletingFolderId(null);
        if (activeFolderId === folderId) setActiveFolderId(null);
    };

    const handleDeleteHrFolder = (folderId: string) => {
        if (!formData) return;
        const updatedFolders = formData.hrDocumentFolders?.filter(f => f.id !== folderId) || [];
        const updatedDocs = formData.hrDocuments?.filter(d => d.folderId !== folderId) || [];
        const updatedEmployee = { ...formData, hrDocumentFolders: updatedFolders, hrDocuments: updatedDocs };
        onUpdate(updatedEmployee);
        setDeletingHrFolderId(null);
        if (activeHrFolderId === folderId) setActiveHrFolderId(null);
    };

    const handleDeleteTimeOff = (reqId: string) => {
        if (!formData) return;
        const updatedReqs = formData.timeOffRequests?.filter(r => r.id !== reqId) || [];
        const updatedEmployee = { ...formData, timeOffRequests: updatedReqs };
        setFormData(updatedEmployee);
        onUpdate(updatedEmployee);
        setDeletingTimeOffId(null);
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] max-h-[850px] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#EEF2FF]/30 relative shrink-0">
                    <div className="flex items-center gap-4">
                        {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt={formData.firstName} className="w-16 h-16 rounded-full object-cover shadow-sm ring-4 ring-white" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-[#EEF2FF] text-[#4F7BFE] flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-white">
                                {formData.firstName[0]}{formData.lastName[0]}
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h2>
                            <p className="text-[#4F7BFE] font-medium">{formData.jobTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-2 mr-2 bg-red-50 rounded-full py-1 pl-3 pr-1 border border-red-100">
                                <span className="text-sm text-red-700 font-medium whitespace-nowrap">Delete {formData.firstName}?</span>
                                <button onClick={handleDeleteConfirm} className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full hover:bg-red-600 shadow-sm transition-colors">
                                    Confirm
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors shadow-sm mr-2"
                                    title="Copy Public Profile Link"
                                >
                                    {copied ? <Check size={16} className="text-[#4F7BFE]" /> : <LinkIcon size={16} />}
                                    {copied ? 'Copied!' : 'Share'}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors group" title="Delete Employee">
                                    <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        )}
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-[#2744A0] px-6 flex items-end shrink-0 pt-2 shadow-inner">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 font-medium text-sm transition-colors cursor-pointer focus:outline-none ${activeTab === tab
                                ? 'bg-white text-[#2744A0] rounded-t-lg'
                                : 'text-white/90 hover:bg-white/20 hover:text-white hover:rounded-t-lg'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden bg-white">
                    {activeTab === 'Personal' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-[#4F7BFE] pb-1 inline-block">Personal Information</h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none transition-colors"
                                    >
                                        <Edit2 size={16} /> Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none transition-colors"
                                        >
                                            <XCircle size={16} /> Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#4F7BFE] border border-transparent rounded hover:bg-[#3B5BDB] focus:outline-none transition-colors shadow-sm"
                                        >
                                            <Save size={16} /> Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                                    {isEditing ? (
                                        <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.firstName}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                                    {isEditing ? (
                                        <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.lastName}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                                    {isEditing ? (
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.email}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</label>
                                    {isEditing ? (
                                        <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.jobTitle}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                                    {isEditing ? (
                                        <select name="department" value={formData.department} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
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
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.department}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</label>
                                    {isEditing ? (
                                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select Country...</option>
                                            <option value="Guatemala">Guatemala</option>
                                            <option value="Argentina">Argentina</option>
                                            <option value="Mexico">Mexico</option>
                                            <option value="Honduras">Honduras</option>
                                            <option value="Colombia">Colombia</option>
                                            <option value="El Salvador">El Salvador</option>
                                            <option value="Nicaragua">Nicaragua</option>
                                            <option value="Costa Rica">Costa Rica</option>
                                            <option value="Panama">Panama</option>
                                            <option value="Spain">Spain</option>
                                            <option value="United States">United States</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{country || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City</label>
                                    {isEditing ? (
                                        <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" placeholder="e.g. Guatemala City" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{city || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hire Date</label>
                                    {isEditing ? (
                                        <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.hireDate}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employment Status</label>
                                    {isEditing ? (
                                        <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="Full Time">Full Time</option>
                                            <option value="Part Time">Part Time</option>
                                            <option value="Contractor">Contractor</option>
                                            <option value="Intern">Intern</option>
                                        </select>
                                    ) : (
                                        <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full ml-2">
                                            {formData.employmentStatus}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporting To</label>
                                    {isEditing ? (
                                        <select name="reportingTo" value={formData.reportingTo || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">None / CEO</option>
                                            {employees
                                                .filter(emp => emp.id !== formData.id)
                                                .map(emp => {
                                                    const fullName = `${emp.firstName} ${emp.lastName}`;
                                                    return (
                                                        <option key={emp.id} value={fullName}>
                                                            {fullName}
                                                        </option>
                                                    );
                                                })
                                            }
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.reportingTo || 'None'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Legal Entity *</label>
                                    {isEditing ? (
                                        <select required name="legalEntity" value={formData.legalEntity || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select Legal Entity</option>
                                            <option value="Easy, S.A.">Easy, S.A.</option>
                                            <option value="Vana Tech, S.A.">Vana Tech, S.A.</option>
                                            <option value="Vana Mas S.A.">Vana Mas S.A.</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.legalEntity || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                                    {isEditing ? (
                                        <select name="status" value={formData.status ?? 'Active'} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full ml-2 ${formData.status === 'Inactive' ? 'bg-red-100 text-red-700' : 'bg-[#E8F5E9] text-[#4CAF50]'}`}>
                                            {formData.status || 'Active'}
                                        </span>
                                    )}
                                </div>
                                {formData.status === 'Inactive' && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Day</label>
                                        {isEditing ? (
                                            <input type="date" name="lastDay" value={formData.lastDay || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                        ) : (
                                            <p className="py-1 text-gray-900 font-medium px-2">{formData.lastDay || 'Not provided'}</p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Name</label>
                                    {isEditing ? (
                                        <input name="bankName" value={formData.bankName} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" placeholder="e.g. Chase" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.bankName || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Account Number</label>
                                    {isEditing ? (
                                        <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" placeholder="Account Number" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.bankAccountNumber ? `••••${formData.bankAccountNumber.slice(-4)}` : 'Not provided'}</p>
                                    )}
                                </div>

                                {/* New Fields Added from Onboarding Form */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Account Type</label>
                                    {isEditing ? (
                                        <select name="bankAccountType" value={formData.bankAccountType || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="Monetaria">Monetaria</option>
                                            <option value="Ahorro">Ahorro</option>
                                            <option value="N/A">N/A (Extranjeros)</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.bankAccountType || 'Not provided'}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">National ID (DPI/DNI)</label>
                                    {isEditing ? (
                                        <input name="nationalId" value={formData.nationalId || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.nationalId || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax ID (NIT)</label>
                                    {isEditing ? (
                                        <input name="taxId" value={formData.taxId || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.taxId || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</label>
                                    {isEditing ? (
                                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.dateOfBirth || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nationality</label>
                                    {isEditing ? (
                                        <select name="nationality" value={formData.nationality || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="GT">GT</option>
                                            <option value="DO">DO</option>
                                            <option value="HN">HN</option>
                                            <option value="ARG">ARG</option>
                                            <option value="COL">COL</option>
                                            <option value="PE">PE</option>
                                            <option value="UY">UY</option>
                                            <option value="VZ">VZ</option>
                                            <option value="BO">BO</option>
                                            <option value="EC">EC</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.nationality || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</label>
                                    {isEditing ? (
                                        <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Masculino">Masculino</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.gender || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Marital Status</label>
                                    {isEditing ? (
                                        <select name="maritalStatus" value={formData.maritalStatus || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="Soltero">Soltero</option>
                                            <option value="Casado">Casado</option>
                                            <option value="Unido">Unido</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.maritalStatus || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Type</label>
                                    {isEditing ? (
                                        <select name="bloodType" value={formData.bloodType || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="Desconozco">Desconozco</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.bloodType || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">T-Shirt Size</label>
                                    {isEditing ? (
                                        <select name="tShirtSize" value={formData.tShirtSize || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="XS">XS</option>
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                            <option value="XL">XL</option>
                                            <option value="XXL">XXL</option>
                                            <option value="XXXL">XXXL</option>
                                            <option value="XXXXL">XXXXL</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.tShirtSize || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                    {isEditing ? (
                                        <input name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.phoneNumber || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Home Address</label>
                                    {isEditing ? (
                                        <input name="homeAddress" value={formData.homeAddress || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.homeAddress || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Personal Email</label>
                                    {isEditing ? (
                                        <input name="personalEmail" type="email" value={formData.personalEmail || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.personalEmail || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Contact Name</label>
                                    {isEditing ? (
                                        <input name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.emergencyContactName || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Contact Phone</label>
                                    {isEditing ? (
                                        <input name="emergencyContactPhone" value={formData.emergencyContactPhone || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.emergencyContactPhone || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Contact Relationship</label>
                                    {isEditing ? (
                                        <input name="emergencyContactRelationship" value={formData.emergencyContactRelationship || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.emergencyContactRelationship || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IGSS Affiliation</label>
                                    {isEditing ? (
                                        <input name="igssAffiliation" value={formData.igssAffiliation || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.igssAffiliation || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical Conditions (Allergies, etc)</label>
                                    {isEditing ? (
                                        <input name="medicalConditions" value={formData.medicalConditions || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.medicalConditions || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profession</label>
                                    {isEditing ? (
                                        <input name="profession" value={formData.profession || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.profession || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Academic Level</label>
                                    {isEditing ? (
                                        <select name="academicLevel" value={formData.academicLevel || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="Básicos">Básicos</option>
                                            <option value="Diversificado">Diversificado</option>
                                            <option value="Técnico">Técnico</option>
                                            <option value="Licenciatura">Licenciatura</option>
                                            <option value="Maestría">Maestría</option>
                                            <option value="Doctorado">Doctorado</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.academicLevel || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Degree Title</label>
                                    {isEditing ? (
                                        <input name="degreeTitle" value={formData.degreeTitle || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2" />
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.degreeTitle || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contracting Company</label>
                                    {isEditing ? (
                                        <select name="contractingCompany" value={formData.contractingCompany || ''} onChange={handleChange} className="w-full border-b border-gray-300 py-1 text-gray-900 focus:border-[#4F7BFE] outline-none transition-colors bg-gray-50 font-medium px-2">
                                            <option value="">Select...</option>
                                            <option value="Vana">Vana</option>
                                            <option value="Easy">Easy</option>
                                            <option value="Krece">Krece</option>
                                            <option value="Vana Card">Vana Card</option>
                                        </select>
                                    ) : (
                                        <p className="py-1 text-gray-900 font-medium px-2">{formData.contractingCompany || 'Not provided'}</p>
                                    )}
                                </div>

                                {isEditing && (
                                    <div className="md:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Employee Photo</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#EEF2FF] file:text-[#4F7BFE] hover:file:bg-[#DCE4FF] cursor-pointer"
                                            />
                                            {formData.photoUrl && (
                                                <button type="button" onClick={() => setFormData({ ...formData, photoUrl: '' })} className="text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-md">Remove</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Documents' && (
                        <div className="space-y-8">
                            <div className="min-h-[320px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Employee Uploaded Documents</h3>
                                    <div className="flex items-center gap-4">
                                        {!activeFolderId ? (
                                            <>
                                                {isCreatingFolder ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={newFolderName}
                                                            onChange={(e) => setNewFolderName(e.target.value)}
                                                            placeholder="Folder name"
                                                            className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#4F7BFE] w-32"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                                        />
                                                        <button onClick={handleCreateFolder} className="p-1.5 bg-[#4F7BFE] text-white rounded hover:bg-[#3B5BDB]">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setIsCreatingFolder(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
                                                    >
                                                        <FolderPlus size={14} /> New Folder
                                                    </button>
                                                )}
                                                <span className="bg-gray-100 text-gray-600 text-xs py-1 px-2 rounded-full font-medium">
                                                    {formData.documents?.filter(d => !d.folderId)?.length || 0} Files
                                                </span>
                                            </>
                                        ) : (
                                            <div className="relative overflow-hidden inline-block align-middle">
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F7BFE] text-white text-xs font-semibold rounded hover:bg-[#3B5BDB] transition-colors">
                                                    Upload Document
                                                </button>
                                                <input
                                                    type="file"
                                                    onChange={handleDocumentUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    title="Click to upload document"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeFolderId && (
                                    <div className="mb-4 flex items-center gap-2 text-gray-600">
                                        <button
                                            onClick={() => setActiveFolderId(null)}
                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                            title="Back to Folders"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <Folder size={20} className="text-gray-400 fill-current" />
                                        <span className="font-medium text-lg">{formData.documentFolders?.find(f => f.id === activeFolderId)?.name || 'Folder'}</span>
                                    </div>
                                )}

                                {!activeFolderId && formData.documentFolders && formData.documentFolders.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                        {formData.documentFolders.map(folder => {
                                            const itemCnt = formData.documents?.filter(d => d.folderId === folder.id).length || 0;
                                            return (
                                                <div
                                                    key={folder.id}
                                                    onClick={() => setActiveFolderId(folder.id)}
                                                    className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#4F7BFE] hover:bg-[#EEF2FF]/30 transition-colors cursor-pointer group flex flex-col items-center justify-center text-center text-gray-700 h-28 relative"
                                                >
                                                    {deletingFolderId === folder.id ? (
                                                        <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center z-10 p-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <span className="text-xs text-red-600 font-bold text-center">Delete folder?</span>
                                                            <div className="flex gap-2">
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">Yes</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setDeletingFolderId(null); }} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 transition-colors">No</button>
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
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    <Folder size={36} className="text-gray-400 group-hover:text-[#4F7BFE] mb-2 fill-current" />
                                                    <p className="text-sm font-semibold truncate w-full px-2" title={folder.name}>{folder.name}</p>
                                                    <p className="text-xs text-gray-500">{itemCnt} item{itemCnt !== 1 ? 's' : ''}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {(() => {
                                    const displayedDocs = formData.documents?.filter(d =>
                                        activeFolderId ? d.folderId === activeFolderId : !d.folderId
                                    ) || [];

                                    return displayedDocs.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {displayedDocs.map(doc => (
                                                <div key={doc.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-[#4F7BFE] transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#4F7BFE] flex items-center justify-center shrink-0">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {deletingDocId === doc.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-red-600 font-medium">Delete?</span>
                                                            <button onClick={() => handleDeleteDocument(doc.id)} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">
                                                                Yes
                                                            </button>
                                                            <button onClick={() => setDeletingDocId(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <a
                                                                href={doc.dataUrl}
                                                                download={doc.name}
                                                                className="p-2 text-gray-400 hover:text-[#4F7BFE] hover:bg-[#EEF2FF] rounded-full transition-colors"
                                                                title="Download File"
                                                            >
                                                                <Download size={16} />
                                                            </a>
                                                            <button
                                                                onClick={() => setDeletingDocId(doc.id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                                title="Delete File"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-sm text-gray-500">No documents in this section yet.</p>
                                            {!activeFolderId && <p className="text-xs text-gray-400 mt-1">Share their public profile link to request documents.</p>}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">HR System Documents</h3>
                                    <div className="flex items-center gap-4">
                                        {!activeHrFolderId ? (
                                            <>
                                                {isCreatingHrFolder ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={newHrFolderName}
                                                            onChange={(e) => setNewHrFolderName(e.target.value)}
                                                            placeholder="Folder name"
                                                            className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#4F7BFE] w-32"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateHrFolder()}
                                                        />
                                                        <button onClick={handleCreateHrFolder} className="p-1.5 bg-[#4F7BFE] text-white rounded hover:bg-[#3B5BDB]">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => { setIsCreatingHrFolder(false); setNewHrFolderName(''); }} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setIsCreatingHrFolder(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
                                                    >
                                                        <FolderPlus size={14} /> New Folder
                                                    </button>
                                                )}
                                                <span className="bg-gray-100 text-gray-600 text-xs py-1 px-2 rounded-full font-medium">
                                                    {formData.hrDocuments?.filter(d => !d.folderId)?.length || 0} Files
                                                </span>
                                                <div className="relative overflow-hidden inline-block align-middle mt-0.5">
                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F7BFE] text-white text-xs font-semibold rounded hover:bg-[#3B5BDB] transition-colors">
                                                        Upload
                                                    </button>
                                                    <input
                                                        type="file"
                                                        onChange={handleHrDocumentUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        title="Click to upload HR document"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="relative overflow-hidden inline-block align-middle">
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F7BFE] text-white text-xs font-semibold rounded hover:bg-[#3B5BDB] transition-colors">
                                                    Upload Document
                                                </button>
                                                <input
                                                    type="file"
                                                    onChange={handleHrDocumentUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    title="Click to upload HR document"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeHrFolderId && (
                                    <div className="mb-4 flex items-center gap-2 text-gray-600">
                                        <button
                                            onClick={() => setActiveHrFolderId(null)}
                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                            title="Back to Folders"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <Folder size={20} className="text-gray-400 fill-current" />
                                        <span className="font-medium text-lg">{formData.hrDocumentFolders?.find(f => f.id === activeHrFolderId)?.name || 'Folder'}</span>
                                    </div>
                                )}

                                {!activeHrFolderId && formData.hrDocumentFolders && formData.hrDocumentFolders.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                        {formData.hrDocumentFolders.map(folder => {
                                            const itemCnt = formData.hrDocuments?.filter(d => d.folderId === folder.id).length || 0;
                                            return (
                                                <div
                                                    key={folder.id}
                                                    onClick={() => setActiveHrFolderId(folder.id)}
                                                    className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#4F7BFE] hover:bg-[#EEF2FF]/30 transition-colors cursor-pointer group flex flex-col items-center justify-center text-center text-gray-700 h-28 relative"
                                                >
                                                    {deletingHrFolderId === folder.id ? (
                                                        <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center z-10 p-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <span className="text-xs text-red-600 font-bold text-center">Delete folder?</span>
                                                            <div className="flex gap-2">
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteHrFolder(folder.id); }} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">Yes</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setDeletingHrFolderId(null); }} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 transition-colors">No</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeletingHrFolderId(folder.id);
                                                            }}
                                                            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                                                            title="Delete Folder"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    <Folder size={36} className="text-gray-400 group-hover:text-[#4F7BFE] mb-2 fill-current" />
                                                    <p className="text-sm font-semibold truncate w-full px-2" title={folder.name}>{folder.name}</p>
                                                    <p className="text-xs text-gray-500">{itemCnt} item{itemCnt !== 1 ? 's' : ''}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {(() => {
                                    const displayedDocs = formData.hrDocuments?.filter(d =>
                                        activeHrFolderId ? d.folderId === activeHrFolderId : !d.folderId
                                    ) || [];

                                    return displayedDocs.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                            {displayedDocs.map(doc => (
                                                <div key={doc.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-[#4F7BFE] transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {deletingHrDocId === doc.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-red-600 font-medium">Delete?</span>
                                                            <button onClick={() => handleDeleteHrDocument(doc.id)} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">
                                                                Yes
                                                            </button>
                                                            <button onClick={() => setDeletingHrDocId(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <a
                                                                href={doc.dataUrl}
                                                                download={doc.name}
                                                                className="p-2 text-gray-400 hover:text-[#4F7BFE] hover:bg-[#EEF2FF] rounded-full transition-colors"
                                                                title="Download File"
                                                            >
                                                                <Download size={16} />
                                                            </a>
                                                            <button
                                                                onClick={() => setDeletingHrDocId(doc.id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                                title="Delete File"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-100 mb-8">
                                            <p className="text-sm text-gray-500">No HR documents in this section yet.</p>
                                            {!activeHrFolderId && <p className="text-xs text-gray-400 mt-1">These documents are only visible to System Admins.</p>}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Time Off' && (() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const allRequests = formData.timeOffRequests || [];
                        const pendingRequests = allRequests.filter(r => r.status === 'Pending').sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                        const approvedRequests = allRequests.filter(r => r.status === 'Approved');

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
                        }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

                        return (
                            <div className="space-y-10 max-w-4xl">
                                {/* Pending Requests */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                        <div className="relative">
                                            <Clock size={20} className="text-gray-400" />
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full border border-white"></div>
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900">Pending Requests</h2>
                                        {pendingRequests.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                                {pendingRequests.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-0">
                                        {pendingRequests.length > 0 ? (
                                            pendingRequests.map(req => {
                                                const start = new Date(req.startDate);
                                                start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
                                                const end = new Date(req.endDate);
                                                end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
                                                const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                                                const dateStr = start.getTime() === end.getTime()
                                                    ? start.toLocaleDateString(undefined, options)
                                                    : `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;

                                                return (
                                                    <div key={req.id} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
                                                        <div className="text-orange-400 opacity-60">
                                                            <Clock size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{dateStr}</p>
                                                            <p className="text-sm text-gray-400 italic">Pending Manager Approval</p>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className="text-gray-500 py-4 text-sm">No pending requests.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Upcoming Time Off */}
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
                                            <p className="text-gray-500 py-4 text-sm">No upcoming approved time off.</p>
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
                                                <div className="grid grid-cols-12 gap-4 py-3 bg-gray-100 rounded-t-lg px-4 text-sm font-bold text-gray-600 border-b border-gray-200">
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
                                                                <p className="text-xs text-gray-500 mt-0.5 border border-orange-300 bg-orange-50 text-orange-800 inline-block px-1.5 py-0.5 rounded">Approved Time Off</p>
                                                            </div>
                                                            <div className="col-span-3 lg:col-span-2 text-right">
                                                                <span className="text-gray-500 line-through text-xs font-semibold uppercase">Taken</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 py-4 text-sm">No time off history.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {['Job', 'Timesheet', 'Benefits'].includes(activeTab) && (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{activeTab}</h3>
                            <p className="text-gray-500">This section is currently under construction.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfileModal;

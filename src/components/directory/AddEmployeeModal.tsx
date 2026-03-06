import React, { useState } from 'react';
import { X, Trash2, FileText } from 'lucide-react';
import type { Employee } from '../../types/Employee';

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
        jobTitle: '',
        reportingTo: '',
        status: 'Active',
        bankName: '',
        bankAccountNumber: '',
        photoUrl: '',
        hrDocuments: []
    });
    const [sendOnboardingEmail, setSendOnboardingEmail] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Auto generate ID and pass back to parent
        const newEmployee: Employee = {
            ...(formData as Employee),
            id: Math.random().toString(36).substring(2, 9)
        };

        if (sendOnboardingEmail && formData.email) {
            try {
                const response = await fetch('/api/send-onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        firstName: formData.firstName
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
            department: 'HR', location: '', jobTitle: '', reportingTo: '', status: 'Active',
            bankName: '', bankAccountNumber: '', photoUrl: '', hrDocuments: []
        });
        setSendOnboardingEmail(false);
        setIsSubmitting(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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

        const reader = new FileReader();
        reader.onloadend = () => {
            const newDoc = {
                id: Math.random().toString(36).substring(2, 9),
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

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input name="location" value={formData.location} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#4F7BFE] focus:border-[#4F7BFE] outline-none" />
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

                    </div>
                    <div className="flex justify-between items-center p-6 pt-4 border-t border-gray-100 shrink-0 bg-white w-full">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sendOnboardingEmail}
                                onChange={(e) => setSendOnboardingEmail(e.target.checked)}
                                className="w-4 h-4 text-[#4F7BFE] bg-gray-100 border-gray-300 rounded focus:ring-[#4F7BFE] focus:ring-2 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700 select-none">Send Onboarding Email</span>
                        </label>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F7BFE] disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-[#4F7BFE] border border-transparent rounded-md hover:bg-[#3B5BDB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F7BFE] disabled:opacity-50 flex items-center justify-center">
                                {isSubmitting ? 'Saving...' : 'Save Employee'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;

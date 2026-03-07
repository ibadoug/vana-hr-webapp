import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee } from '../types/Employee';
import { Check, X, Clock, AlertCircle, CheckSquare, Heart, DollarSign, Calendar, UserPlus, UserMinus, Plus } from 'lucide-react';
import AddHolidays from '../components/admin/AddHolidays';

const Admin = () => {
    const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Approvals');
    const [showAddHolidays, setShowAddHolidays] = useState(false);

    const tabs = [
        { id: 'Approvals', label: 'Approvals', icon: CheckSquare },
        { id: 'Benefits', label: 'Benefits', icon: Heart },
        { id: 'Compensation', label: 'Compensation', icon: DollarSign },
        { id: 'Holidays', label: 'Holidays', icon: Calendar },
        { id: 'Onboarding', label: 'Onboarding', icon: UserPlus },
        { id: 'Offboarding', label: 'Offboarding', icon: UserMinus },
    ];

    const fetchPendingApprovals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('status', 'Pending Approval');

            if (error) {
                console.error('Error fetching pending approvals:', error);
                return;
            }

            if (data) {
                const formatted = data.map(emp => ({
                    id: emp.id,
                    firstName: emp.first_name,
                    lastName: emp.last_name,
                    email: emp.email,
                    jobTitle: emp.job_title,
                    department: emp.department,
                    photoUrl: emp.photo_url,
                    status: emp.status,
                    hireDate: emp.hire_date,
                    legalEntity: emp.legal_entity
                })) as Employee[];
                setPendingEmployees(formatted);
            }
        } catch (err) {
            console.error('Unexpected error loading pending approvals:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const handleApprove = async (id: string) => {
        const { error } = await supabase.from('employees').update({
            status: 'Active'
        }).eq('id', id);

        if (error) {
            console.error("Failed to approve employee:", error);
        } else {
            setPendingEmployees(prev => prev.filter(emp => emp.id !== id));
        }
    };

    const handleDeny = async (id: string) => {
        // Denying reverts the employee back to 'Onboarding' status so they can fix their profile
        const { error } = await supabase.from('employees').update({
            status: 'Onboarding'
        }).eq('id', id);

        if (error) {
            console.error("Failed to deny employee:", error);
        } else {
            setPendingEmployees(prev => prev.filter(emp => emp.id !== id));
        }
    };

    return (
        <div className="bg-white min-h-[calc(100vh-8rem)] rounded-lg shadow-sm font-sans flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">System Admin</h2>
                </div>
                <div className="p-3 flex flex-col gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? 'bg-[#4F7BFE] text-white'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50/30">
                {/* Top header for the active tab */}
                <div className="px-6 py-5 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-semibold text-[#4F7BFE]">{activeTab}</h2>
                </div>

                <div className="p-6">
                    {activeTab === 'Approvals' && (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="text-[#4F7BFE]" size={20} />
                                    Onboarding Approvals
                                    {pendingEmployees.length > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                            {pendingEmployees.length}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Review and approve new employees who have finished their profile setup.
                                </p>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center p-8 text-[#4F7BFE] font-medium">Loading approvals...</div>
                            ) : pendingEmployees.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pendingEmployees.map(emp => (
                                        <div key={emp.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="p-5 border-b border-gray-100 flex items-start gap-4">
                                                {emp.photoUrl ? (
                                                    <img src={emp.photoUrl} alt={emp.firstName} className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-white shrink-0" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-[#EEF2FF] text-[#4F7BFE] flex items-center justify-center font-bold text-lg shadow-sm ring-2 ring-white shrink-0">
                                                        {emp.firstName[0]}{emp.lastName[0]}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{emp.firstName} {emp.lastName}</h4>
                                                    <p className="text-sm text-[#4F7BFE] font-medium truncate">{emp.jobTitle}</p>
                                                    <p className="text-xs text-gray-500 mt-1 truncate">{emp.department} • Started: {emp.hireDate}</p>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 px-5 py-3 flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleDeny(emp.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                                >
                                                    <X size={16} /> Deny
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(emp.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#4F7BFE] rounded hover:bg-[#3B5BDB] transition-colors shadow-sm"
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
                                    <AlertCircle size={40} className="text-gray-400 mb-3" />
                                    <h4 className="text-lg font-semibold text-gray-700 mb-1">No Pending Approvals</h4>
                                    <p className="text-gray-500 text-sm max-w-sm">There are currently no new employees waiting for onboarding approval.</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'Holidays' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="text-[#4F7BFE]" size={20} />
                                        Company Holidays
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Manage official holidays for your employees across different countries.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddHolidays(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#4F7BFE] text-white text-sm font-bold rounded hover:bg-[#3B5BDB] transition-colors shadow-sm"
                                >
                                    <Plus size={18} /> Add Holidays
                                </button>
                            </div>

                            <div className="border border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
                                <Calendar size={40} className="text-gray-400 mb-3" />
                                <h4 className="text-lg font-semibold text-gray-700 mb-1">No Holidays Added</h4>
                                <p className="text-gray-500 text-sm max-w-sm">You haven't configured any company holidays yet.</p>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'Approvals' && activeTab !== 'Holidays' && (
                        <div className="border border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white shadow-sm">
                            <AlertCircle size={40} className="text-gray-400 mb-3" />
                            <h4 className="text-lg font-semibold text-gray-700 mb-1">{activeTab}</h4>
                            <p className="text-gray-500 text-sm max-w-sm">
                                The {activeTab.toLowerCase()} feature is currently under development.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Holiday Modal */}
            {showAddHolidays && (
                <AddHolidays onClose={() => setShowAddHolidays(false)} />
            )}
        </div>
    );
};

export default Admin;

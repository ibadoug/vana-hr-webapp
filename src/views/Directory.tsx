import { useState, useMemo, useEffect } from 'react';
import {
    Plus, Upload, Filter, Search, ChevronDown, Network, List
} from 'lucide-react';
import type { Employee } from '../types/Employee';
import AddEmployeeModal from '../components/directory/AddEmployeeModal';
import EmployeeProfileModal from '../components/directory/EmployeeProfileModal';
import OrgChart from '../components/directory/OrgChart';

// Some initial mock data
export const INITIAL_EMPLOYEES: Employee[] = [
    {
        id: '1',
        firstName: 'Charlotte',
        lastName: 'Abbott',
        photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80',
        hireDate: '08/08/2011',
        employmentStatus: 'Full Time',
        department: 'HR',
        location: 'Lindon, Utah',
        jobTitle: 'HR - Payroll',
        reportingTo: 'Daniel John',
        status: 'Active'
    },
    {
        id: '2',
        firstName: 'George',
        lastName: 'Allen',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&q=80',
        hireDate: '02/04/2019',
        employmentStatus: 'Full Time',
        department: 'Product',
        location: 'New York, New York',
        jobTitle: 'Software Engineer',
        reportingTo: 'Karin Petty',
        status: 'Active'
    },
    {
        id: '3',
        firstName: 'Shannon',
        lastName: 'Anderson',
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80',
        hireDate: '08/05/2012',
        employmentStatus: 'Contractor',
        department: 'Operations',
        location: 'Lindon, Utah',
        jobTitle: 'Technical Recruiter',
        reportingTo: 'Dwight Goodman',
        status: 'Active'
    }
];

const Directory = () => {
    const [employees, setEmployees] = useState<Employee[]>(() => {
        const saved = localStorage.getItem('vana_employees');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse employees from local storage', e);
            }
        }
        return INITIAL_EMPLOYEES;
    });

    // Persist to local storage whenever employees array changes
    useEffect(() => {
        localStorage.setItem('vana_employees', JSON.stringify(employees));
    }, [employees]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active');
    const [viewMode, setViewMode] = useState<'list' | 'orgChart'>('list');
    const [orgChartDepartment, setOrgChartDepartment] = useState<string>('All');

    const departments = useMemo(() => {
        const deps = new Set(employees.map(emp => emp.department).filter(Boolean));
        return Array.from(deps).sort();
    }, [employees]);

    // Multi-criteria filter
    const filteredEmployees = useMemo(() => {
        const baseEmployees = statusFilter === 'All' ? employees : employees.filter(emp => {
            const currentStatus = emp.status || 'Active';
            return currentStatus === statusFilter;
        });

        if (!searchQuery) return baseEmployees;
        const q = searchQuery.toLowerCase();

        return baseEmployees.filter(emp => {
            if (!filterCategory) {
                // Global Search
                return emp.firstName.toLowerCase().includes(q) ||
                    emp.lastName.toLowerCase().includes(q) ||
                    emp.jobTitle.toLowerCase().includes(q) ||
                    emp.department.toLowerCase().includes(q) ||
                    emp.location.toLowerCase().includes(q);
            }

            // Category Specific Search
            switch (filterCategory) {
                case 'Name': return emp.firstName.toLowerCase().includes(q);
                case 'Last Name': return emp.lastName.toLowerCase().includes(q);
                case 'Employment Status': return emp.employmentStatus.toLowerCase().includes(q);
                case 'Department': return emp.department.toLowerCase().includes(q);
                case 'Location': return emp.location.toLowerCase().includes(q);
                case 'Job Title': return emp.jobTitle.toLowerCase().includes(q);
                default: return true;
            }
        });
    }, [employees, searchQuery, filterCategory, statusFilter]);

    const handleAddEmployee = (newEmp: Employee) => {
        setEmployees([...employees, newEmp]);
    };

    const handleUpdateEmployee = (updatedEmp: Employee) => {
        setEmployees(employees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp));
        setSelectedEmployee(updatedEmp); // Update selected employee to show new data
    };

    const handleDeleteEmployee = (id: string) => {
        setEmployees(employees.filter(emp => emp.id !== id));
        setSelectedEmployee(null); // Close modal
    };

    return (
        <div className="bg-white min-h-[calc(100vh-8rem)] rounded-lg shadow-sm font-sans flex flex-col">
            {/* Top Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-[#4F7BFE] tracking-tight">Directory</h1>
                </div>
                <div className="flex items-center gap-4">
                    {viewMode === 'orgChart' && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium hidden sm:inline-block">Department:</span>
                            <div className="relative">
                                <select
                                    className="appearance-none border border-gray-300 rounded-lg bg-white py-1.5 pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-[#4F7BFE]/50 shadow-sm text-gray-700"
                                    value={orgChartDepartment}
                                    onChange={(e) => setOrgChartDepartment(e.target.value)}
                                >
                                    <option value="All">All Departments</option>
                                    {departments.map(dep => (
                                        <option key={dep} value={dep}>{dep}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    )}
                    <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg items-center border border-gray-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#4F7BFE]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            <List size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('orgChart')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'orgChart' ? 'bg-white shadow-sm text-[#4F7BFE]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            <Network size={16} /> Org Chart
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#4F7BFE] text-[#4F7BFE] font-semibold text-sm rounded hover:bg-[#EEF2FF] transition-colors"
                    >
                        <Plus size={16} strokeWidth={3} />
                        New Employee
                    </button>
                </div>
            </div>

            {/* Main Content conditionally rendered based on viewMode */}
            {viewMode === 'list' ? (
                <>
                    {/* Toolbar / Search Header */}
                    <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between bg-gray-50/50 gap-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Controls */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`p-2 border rounded bg-white text-gray-600 shadow-sm flex items-center gap-2 transition-colors ${isFilterOpen ? 'border-[#4F7BFE] bg-[#EEF2FF] text-[#4F7BFE]' : 'border-gray-300 hover:bg-gray-50'}`}
                                >
                                    <Filter size={16} />
                                </button>

                                {isFilterOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-10 py-2">
                                        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-gray-800">Filter By</h3>
                                            {filterCategory && (
                                                <button
                                                    onClick={() => { setFilterCategory(null); setIsFilterOpen(false); }}
                                                    className="text-xs text-[#0070c0] hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                                            {['Name', 'Last Name', 'Employment Status', 'Department', 'Location', 'Job Title'].map(category => (
                                                <button
                                                    key={category}
                                                    onClick={() => { setFilterCategory(category); setIsFilterOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center justify-between group ${filterCategory === category ? 'bg-[#EEF2FF] text-[#4F7BFE] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    {category}
                                                    {filterCategory !== category && <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search & Upload Mock */}
                            <div className="relative flex-1 md:w-64 ml-2">
                                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={filterCategory ? `Search by ${filterCategory}...` : "Search people..."}
                                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm shadow-sm outline-none focus:ring-1 focus:ring-[#4F7BFE]"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 shadow-sm ml-2">
                                <Upload size={14} /> Upload CSV
                            </button>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>Showing</span>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'Active' | 'Inactive' | 'All')}
                                    className="appearance-none border border-gray-300 rounded bg-white py-1 pl-3 pr-7 text-sm shadow-sm outline-none focus:ring-1 focus:ring-[#4F7BFE]"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="All">All</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Main Table Area */}
                    <div className="flex-1 overflow-x-auto relative z-0">
                        <table className="w-full text-left text-sm whitespace-nowrap border-t border-gray-200">
                            <thead>
                                <tr className="bg-[#f0f2f5] text-gray-600 font-medium">
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Employee Photo</th>
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Last Name, First Name</th>
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Hire Date</th>
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Employment Status</th>
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Department</th>
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Location</th>
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Job Title</th>
                                    <th className="px-6 py-3 font-medium border-b border-gray-200">Reporting To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((emp) => (
                                        <tr
                                            key={emp.id}
                                            onClick={() => setSelectedEmployee(emp)}
                                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {emp.photoUrl ? (
                                                        <img src={emp.photoUrl} alt={emp.firstName} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white shrink-0" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#4F7BFE] flex items-center justify-center font-bold text-lg shadow-sm ring-2 ring-white shrink-0">
                                                            {emp.firstName[0]}{emp.lastName[0]}
                                                        </div>
                                                    )}
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold tracking-wide ${(emp.status || 'Active') === 'Active'
                                                        ? 'bg-[#E8F5E9] text-[#4CAF50]'
                                                        : 'bg-[#FFEBEE] text-[#C62828]'
                                                        }`}>
                                                        {emp.status || 'Active'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <a href="#" className="text-[#0070c0] hover:underline font-medium">
                                                    {emp.lastName}, {emp.firstName}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{emp.hireDate}</td>
                                            <td className="px-6 py-4 text-gray-700">{emp.employmentStatus}</td>
                                            <td className="px-6 py-4 text-gray-700">{emp.department}</td>
                                            <td className="px-6 py-4 text-gray-700">{emp.location}</td>
                                            <td className="px-6 py-4 text-gray-700">{emp.jobTitle}</td>
                                            <td className="px-6 py-4 text-gray-700">{emp.reportingTo}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            No employees found matching "{searchQuery}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-x-auto bg-[#f9fafb] p-6 pb-20 border-t border-gray-100 shadow-inner">
                    <OrgChart
                        employees={employees.filter(emp =>
                            emp.status !== 'Inactive' &&
                            (orgChartDepartment === 'All' || emp.department === orgChartDepartment)
                        )}
                        onNodeClick={(emp) => setSelectedEmployee(emp)}
                    />
                </div>
            )}

            <AddEmployeeModal
                employees={employees}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddEmployee}
            />

            <EmployeeProfileModal
                employee={selectedEmployee}
                employees={employees}
                isOpen={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                onUpdate={handleUpdateEmployee}
                onDelete={handleDeleteEmployee}
            />
        </div>
    );
};

export default Directory;

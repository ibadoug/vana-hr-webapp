import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Search, ChevronDown, ChevronLeft, CheckCircle2 } from 'lucide-react';
import type { Employee } from '../../types/Employee';

interface Props {
    onClose: () => void;
}

// Mapping from standard country names to ISO 3166-1 alpha-2 codes used by Nager.Date API
const COUNTRY_CODE_MAP: Record<string, string> = {
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Austria': 'AT',
    'New Zealand': 'NZ',
    'Ireland': 'IE',
    'Netherlands': 'NL',
    'South Africa': 'ZA',
    'Germany': 'DE',
    'Guatemala': 'GT',
    'Mexico': 'MX',
    'Colombia': 'CO',
    'Argentina': 'AR',
    'Brazil': 'BR',
    'India': 'IN',
    'Spain': 'ES',
    'France': 'FR',
    'Italy': 'IT',
    'Australia': 'AU'
};

const getCountryCode = (name: string) => COUNTRY_CODE_MAP[name] || 'US';

type CountryStats = {
    name: string;
    code: string;
    employeeCount: number;
    employees: Pick<Employee, 'id' | 'firstName' | 'lastName'>[];
};

type Holiday = {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    fixed: boolean;
    global: boolean;
};

const AddHolidays: React.FC<Props> = ({ onClose }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Step 1 State
    const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());

    // Step 2 State
    const [holidaysData, setHolidaysData] = useState<Record<string, Holiday[]>>({});
    const [employeeSelections, setEmployeeSelections] = useState<Record<string, {
        mode: 'All' | 'Include' | 'Exclude';
        selectedIds: string[];
    }>>({});

    useEffect(() => {
        fetchActiveCountries();
    }, []);

    const fetchActiveCountries = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('id, first_name, last_name, country')
                .eq('status', 'Active');

            if (error) throw error;

            if (data) {
                const statsMap = new Map<string, CountryStats>();

                data.forEach(emp => {
                    const cName = emp.country || 'Unknown';
                    // We only want known countries for the API
                    if (cName !== 'Unknown') {
                        if (!statsMap.has(cName)) {
                            statsMap.set(cName, {
                                name: cName,
                                code: getCountryCode(cName),
                                employeeCount: 0,
                                employees: []
                            });
                        }
                        const cs = statsMap.get(cName)!;
                        cs.employeeCount++;
                        cs.employees.push({
                            id: emp.id,
                            firstName: emp.first_name,
                            lastName: emp.last_name
                        });
                    }
                });

                setCountryStats(Array.from(statsMap.values()).sort((a, b) => b.employeeCount - a.employeeCount));
            }
        } catch (err) {
            console.error('Error fetching countries:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCountry = (countryName: string) => {
        const next = new Set(selectedCountries);
        if (next.has(countryName)) {
            next.delete(countryName);
        } else {
            next.add(countryName);
        }
        setSelectedCountries(next);
    };

    const handleNext = async () => {
        if (selectedCountries.size === 0) return;
        setStep(2);

        // Fetch holidays for selected countries if not already fetched
        const year = new Date().getFullYear();
        const newHolidays: Record<string, Holiday[]> = { ...holidaysData };
        const newSelections = { ...employeeSelections };

        setIsLoading(true);
        try {
            const fetchPromises = Array.from(selectedCountries).map(async (cName) => {
                if (!newHolidays[cName]) {
                    const cCode = getCountryCode(cName);
                    try {
                        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${cCode}`);
                        if (res.ok) {
                            const data: Holiday[] = await res.json();
                            newHolidays[cName] = data;
                        } else {
                            newHolidays[cName] = []; // Fallback
                        }
                    } catch (e) {
                        console.error('Failed to fetch holidays for', cName, e);
                        newHolidays[cName] = [];
                    }
                }

                // Initialize selection state
                if (!newSelections[cName]) {
                    newSelections[cName] = {
                        mode: 'All',
                        selectedIds: []
                    };
                }
            });

            await Promise.all(fetchPromises);
            setHolidaysData(newHolidays);
            setEmployeeSelections(newSelections);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Mock saving logic
            console.log("Saving holidays for the following assignments:", employeeSelections);
            console.log("Holidays data:", holidaysData);

            // In a real scenario:
            // 1. Iterate over selectedCountries
            // 2. Based on employeeSelections[cName].mode, determine the final list of employee IDs.
            // 3. For each employee ID, insert the holidays for that country into `employee_holidays`.

            const payload = Array.from(selectedCountries).map(cName => {
                const stats = countryStats.find(s => s.name === cName);
                const selection = employeeSelections[cName];
                const holidays = holidaysData[cName];

                let targetEmployeeIds: string[] = [];
                if (selection.mode === 'All') {
                    targetEmployeeIds = stats?.employees.map(e => e.id) || [];
                } else if (selection.mode === 'Include') {
                    targetEmployeeIds = selection.selectedIds;
                } else if (selection.mode === 'Exclude') {
                    targetEmployeeIds = stats?.employees
                        .map(e => e.id)
                        .filter(id => !selection.selectedIds.includes(id)) || [];
                }

                return {
                    country: cName,
                    targetEmployeeCount: targetEmployeeIds.length,
                    holidaysCount: holidays?.length || 0,
                    employeeIds: targetEmployeeIds
                };
            });

            console.log("Simulation Payload:", payload);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Close after saving
            onClose();
        } catch (error) {
            console.error("Error saving holidays", error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredStats = useMemo(() => {
        if (!searchQuery) return countryStats;
        const q = searchQuery.toLowerCase();
        return countryStats.filter(s => s.name.toLowerCase().includes(q));
    }, [countryStats, searchQuery]);

    const totalHolidaysCount = Array.from(selectedCountries).reduce((acc, cName) => {
        return acc + (holidaysData[cName]?.length || 0);
    }, 0);

    return (
        <div className="absolute inset-0 bg-gray-50/50 z-10 flex flex-col items-center py-8 overflow-y-auto">
            <div className="w-full max-w-5xl px-6">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={onClose} className="flex items-center text-gray-500 hover:text-gray-800 text-sm font-medium mb-4 transition-colors">
                        <ChevronLeft size={16} className="mr-1" /> Holidays
                    </button>
                    <h1 className="text-3xl font-bold text-[#2A5C2D] mb-2">Add Holidays</h1>
                    <p className="text-gray-500 text-lg">{new Date().getFullYear()}</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#2A5C2D] font-bold' : 'text-gray-500 font-medium'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step === 1 ? 'bg-[#2A5C2D] text-white' : 'bg-gray-200'}`}>1</div>
                        Select Countries
                    </div>
                    <div className="w-8 h-px bg-gray-300"></div>
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#2A5C2D] font-bold' : 'text-gray-500 font-medium'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step === 2 ? 'bg-[#2A5C2D] text-white' : 'bg-gray-200'}`}>2</div>
                        Assign Employees
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                    {isLoading && step === 1 ? (
                        <div className="flex justify-center items-center h-64 text-[#2A5C2D]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A5C2D]"></div>
                        </div>
                    ) : step === 1 ? (
                        <div>
                            <h2 className="text-lg font-bold text-[#2A5C2D] mb-1">Select Countries</h2>
                            <p className="text-sm text-gray-500 mb-6">Select the countries where you want to add holidays</p>

                            <div className="relative mb-6 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search countries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5C2D]/50 focus:border-[#2A5C2D] transition-all bg-gray-50"
                                />
                            </div>

                            {selectedCountries.size > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Selected ({selectedCountries.size}):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(selectedCountries).map(c => (
                                            <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
                                                {c} ({getCountryCode(c)})
                                                <button onClick={() => toggleCountry(c)} className="hover:text-red-500 focus:outline-none bg-gray-200 rounded-full p-0.5"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredStats.map(stat => {
                                    const isSelected = selectedCountries.has(stat.name);
                                    return (
                                        <div
                                            key={stat.name}
                                            onClick={() => toggleCountry(stat.name)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-[#2A5C2D] bg-[#F2F9F3]' : 'border-gray-100 hover:border-gray-200 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-8 rounded shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm text-xs font-bold text-gray-400">
                                                    {stat.code}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-sm ${isSelected ? 'text-[#2A5C2D]' : 'text-gray-900'}`}>
                                                        {stat.name} ({stat.code})
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">{stat.employeeCount} Employee{stat.employeeCount !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {isSelected ? (
                                                    <div className="w-5 h-5 bg-[#2A5C2D] rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white"></div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredStats.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-gray-500">
                                        No active countries found.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center h-64 text-[#2A5C2D]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A5C2D] mb-4"></div>
                                    <p className="text-sm font-medium">Fetching holidays from Nager.Date API...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Array.from(selectedCountries).map(cName => {
                                        const stats = countryStats.find(s => s.name === cName);
                                        const holidays = holidaysData[cName] || [];
                                        const rules = employeeSelections[cName];

                                        return (
                                            <div key={cName} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-6 rounded shrink-0 bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm text-[10px] font-bold text-gray-400">
                                                            {getCountryCode(cName)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900">{cName}</h3>
                                                            <p className="text-xs text-gray-500">{holidays.length} Standard Holidays</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                                                        <UsersIcon size={16} className="text-gray-400" />
                                                        {stats?.employeeCount || 0} Employees
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <div className="mb-6 bg-[#F2F9F3] p-4 rounded-lg border border-[#D5EAD8]">
                                                        <p className="text-sm font-bold text-[#2A5C2D] mb-2">Who is this holiday for?</p>
                                                        <p className="text-xs text-[#2A5C2D] mb-3">
                                                            Assigned Employees: <span className="font-extrabold">{rules?.mode === 'All' ? stats?.employeeCount : rules?.mode === 'Include' ? rules.selectedIds.length : (stats?.employeeCount || 0) - (rules?.selectedIds.length || 0)} Employees</span>
                                                        </p>

                                                        {/* Employee Selection Dropdown simulation */}
                                                        <div className="relative inline-block text-left w-64">
                                                            <select
                                                                className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-[#2A5C2D] text-sm font-medium shadow-sm"
                                                                value={rules?.mode || 'All'}
                                                                onChange={(e) => {
                                                                    setEmployeeSelections(prev => ({
                                                                        ...prev,
                                                                        [cName]: { ...prev[cName], mode: e.target.value as any, selectedIds: [] }
                                                                    }))
                                                                }}
                                                            >
                                                                <option value="All">All Employees</option>
                                                                <option value="Include">Include Specific Employees</option>
                                                                <option value="Exclude">Exclude Specific Employees</option>
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                                <ChevronDown size={14} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <h4 className="font-bold text-sm text-gray-900 mb-3 ml-1">Which holidays to include?</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                                                        {holidays.map((h, i) => {
                                                            const d = new Date(h.date);
                                                            const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` (${d.toLocaleDateString('en-US', { weekday: 'short' })})`;
                                                            return (
                                                                <div key={i} className="flex items-start gap-2">
                                                                    <div className="mt-0.5 text-[#2A5C2D]"><CheckCircle2 size={16} /></div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-gray-800 leading-tight">{h.name}</p>
                                                                        <p className="text-[11px] text-gray-500 mt-0.5">{formattedDate}</p>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center gap-3 mt-6 pb-12">
                    {step === 1 ? (
                        <>
                            <button
                                onClick={handleNext}
                                disabled={selectedCountries.size === 0}
                                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all focus:outline-none shadow-sm ${selectedCountries.size > 0 ? 'bg-[#2A5C2D] hover:bg-[#1f4522] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Next
                            </button>
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#4F7BFE] hover:text-[#3B5BDB] focus:outline-none transition-colors">
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#2A5C2D] hover:bg-[#1f4522] text-white transition-all focus:outline-none shadow-sm flex items-center"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    `Add ${totalHolidaysCount} Holidays`
                                )}
                            </button>
                            <button onClick={() => setStep(1)} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full bg-white transition-colors">
                                Previous Step
                            </button>
                            <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-[#4F7BFE] hover:text-[#3B5BDB] focus:outline-none transition-colors">
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Mini stub for UsersIcon
const UsersIcon: React.FC<any> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
)

export default AddHolidays;

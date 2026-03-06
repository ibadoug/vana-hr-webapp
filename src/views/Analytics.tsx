

import { useState, useMemo, useEffect } from 'react';
import { INITIAL_EMPLOYEES } from './Directory';
import type { Employee } from '../types/Employee';
import { Calendar, TrendingUp } from 'lucide-react';

// Format MM/DD/YYYY
const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
    }
    return new Date(dateStr); // fallback
};

const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatYear = (date: Date) => {
    return date.getFullYear().toString();
};

const Analytics = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);

    // Default to last 5 years up to today
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 5);
        return d.toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [granularity, setGranularity] = useState<'monthly' | 'yearly'>('yearly');

    useEffect(() => {
        const saved = localStorage.getItem('vana_employees');
        if (saved) {
            try {
                setEmployees(JSON.parse(saved));
            } catch (e) {
                setEmployees(INITIAL_EMPLOYEES);
            }
        } else {
            setEmployees(INITIAL_EMPLOYEES);
        }
    }, []);

    const chartData = useMemo(() => {
        // Only active employees
        const activeEmployees = employees.filter(emp => emp.status !== 'Inactive');

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            return [];
        }

        const dataPoints = [];
        let current = new Date(start);

        while (current <= end) {
            let label = '';
            let intervalEnd = new Date(current);

            if (granularity === 'yearly') {
                label = formatYear(current);
                intervalEnd = new Date(current.getFullYear(), 11, 31);
            } else {
                label = formatMonthYear(current);
                intervalEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0); // last day of month
            }

            // Headcount is anyone hired ON or BEFORE this intervalEnd
            const count = activeEmployees.filter(emp => {
                const hDate = parseDate(emp.hireDate);
                return hDate <= intervalEnd;
            }).length;

            dataPoints.push({
                label,
                date: new Date(current),
                count
            });

            // increment current
            if (granularity === 'yearly') {
                current.setFullYear(current.getFullYear() + 1);
            } else {
                current.setMonth(current.getMonth() + 1);
            }
        }

        return dataPoints;
    }, [employees, startDate, endDate, granularity]);

    // SVG parameters
    const width = 800;
    const height = 400;
    const padding = 60;

    const maxCount = Math.max(...chartData.map(d => d.count), 1);

    // Points along the SVG
    const points = chartData.map((d, i) => {
        const x = padding + (i * ((width - padding * 2) / Math.max(chartData.length - 1, 1)));
        const y = height - padding - ((d.count / maxCount) * (height - padding * 2));
        return { x, y, count: d.count, label: d.label };
    });

    const pathD = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : '';

    const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics</h1>
                    <p className="text-gray-500 mt-1">Track company growth and headcount over time.</p>
                </div>

                <div className="flex bg-white shadow-sm border border-gray-200 rounded-lg p-1">
                    <button
                        onClick={() => setGranularity('monthly')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${granularity === 'monthly' ? 'bg-[#4F7BFE] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setGranularity('yearly')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${granularity === 'yearly' ? 'bg-[#4F7BFE] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Yearly
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="w-full sm:w-48 space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" /> Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            onClick={(e) => (e.target as any).showPicker?.()}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4F7BFE] outline-none cursor-pointer"
                        />
                    </div>
                    <div className="w-full sm:w-48 space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" /> End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            onClick={(e) => (e.target as any).showPicker?.()}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4F7BFE] outline-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="border border-gray-100 rounded-lg bg-gray-50/30 p-4">
                    <div className="flex items-center gap-2 mb-4 px-4">
                        <div className="w-8 h-8 rounded bg-[#EEF2FF] flex items-center justify-center">
                            <TrendingUp size={16} className="text-[#4F7BFE]" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Active Headcount Growth</h3>
                    </div>

                    {chartData.length > 0 ? (
                        <div className="w-full overflow-x-auto overflow-y-hidden flex justify-center">
                            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-sm overflow-visible">
                                {/* Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                    const y = padding + (height - padding * 2) * ratio;
                                    const val = Math.round(maxCount * (1 - ratio));
                                    return (
                                        <g key={`grid-y-${i}`}>
                                            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E5E7EB" strokeDasharray="4 4" />
                                            <text x={padding - 10} y={y + 4} textAnchor="end" fill="#6B7280" fontSize="12">{val}</text>
                                        </g>
                                    );
                                })}

                                {/* Area */}
                                <path d={areaD} fill="#EEF2FF" opacity="0.5" />

                                {/* Line */}
                                <path d={pathD} fill="none" stroke="#4F7BFE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Points and Labels */}
                                {points.map((p, i) => (
                                    <g key={`point-${i}`} className="group">
                                        {/* X Axis Label (staggered if many points) */}
                                        {(points.length < 15 || i % Math.ceil(points.length / 10) === 0) && (
                                            <text
                                                x={p.x}
                                                y={height - padding + 20}
                                                textAnchor="middle"
                                                fill="#6B7280"
                                                fontSize="12"
                                                transform={`rotate(-45, ${p.x}, ${height - padding + 20})`}
                                            >
                                                {p.label}
                                            </text>
                                        )}

                                        {/* Data Point */}
                                        <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#4F7BFE" strokeWidth="2" className="transition-all group-hover:r-[7px]" />

                                        {/* Tooltip emulation (shown on hover) */}
                                        <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <rect x={p.x - 30} y={p.y - 45} width="60" height="30" rx="4" fill="#1F2937" />
                                            <text x={p.x} y={p.y - 25} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{p.count}</text>
                                        </g>
                                    </g>
                                ))}
                            </svg>
                        </div>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center text-gray-500">
                            No data available for this date range.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;

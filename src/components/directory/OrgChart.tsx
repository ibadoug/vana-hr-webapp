import React, { useMemo, useState } from 'react';
import type { Employee } from '../../types/Employee';

interface OrgChartProps {
    employees: Employee[];
    onNodeClick?: (employee: Employee) => void;
}

interface TreeNode extends Employee {
    children: TreeNode[];
    calculatedTenure: number;
    totalHeadcount: number;
    averageTenure: number;
    totalSubTenure: number;
}

const calculateTenure = (hireDate: string) => {
    const date = new Date(hireDate);
    if (isNaN(date.getTime())) return 0;
    const now = new Date(); // or assume a fixed date if we want exact mock matching, but let's use now
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffD = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Number((diffD / 365.25).toFixed(2));
};

const OrgNode: React.FC<{ node: TreeNode; onNodeClick?: (employee: Employee) => void }> = ({ node, onNodeClick }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <li>
            <div
                className="inline-flex flex-col bg-white border border-gray-200 shadow-sm rounded-lg min-w-[220px] max-w-[260px] m-2 transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer relative"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onNodeClick) onNodeClick(node);
                }}
            >
                {/* Node Top: Info */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-[#FDFBF7] to-[#F1EBE1] rounded-t-lg border-b border-gray-100">
                    {node.photoUrl ? (
                        <img src={node.photoUrl} alt={node.firstName} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#4F7BFE] flex items-center justify-center font-bold text-lg shadow-sm ring-2 ring-white">
                            {node.firstName[0]}{node.lastName[0]}
                        </div>
                    )}
                    <div className="text-left overflow-hidden">
                        <div className="font-semibold text-gray-800 text-sm truncate">{node.firstName} {node.lastName}</div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">{node.jobTitle}</div>
                    </div>
                </div>

                {/* Node Bottom: Stats */}
                <div className="p-3 bg-white rounded-b-lg text-xs text-gray-600 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tenure:</span>
                        <span className="font-medium text-gray-700">{node.calculatedTenure.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-100 w-full my-0.5" />
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Headcount:</span>
                        <span className="font-medium text-gray-700">{node.totalHeadcount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Avg Tenure:</span>
                        <span className="font-medium text-gray-700">{node.totalHeadcount > 0 ? node.averageTenure.toFixed(2) : '-'}</span>
                    </div>
                </div>

                {/* Collapse Toggle */}
                {node.children && node.children.length > 0 && (
                    <button
                        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCollapsed(!collapsed);
                        }}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {!collapsed && node.children && node.children.length > 0 && (
                <ul>
                    {node.children.map(child => (
                        <OrgNode key={child.id} node={child} onNodeClick={onNodeClick} />
                    ))}
                </ul>
            )}
        </li>
    );
};

const OrgChart: React.FC<OrgChartProps> = ({ employees, onNodeClick }) => {
    const tree = useMemo(() => {
        // Create an indexed map for quick access
        const map = new Map<string, TreeNode>();

        employees.forEach(emp => {
            const fullName = `${emp.firstName} ${emp.lastName}`.trim().toLowerCase();
            map.set(fullName, {
                ...emp,
                children: [],
                calculatedTenure: calculateTenure(emp.hireDate),
                totalHeadcount: 0,
                averageTenure: 0,
                totalSubTenure: 0
            });
        });

        const rootNodes: TreeNode[] = [];

        // Build the tree
        employees.forEach(emp => {
            const fullName = `${emp.firstName} ${emp.lastName}`.trim().toLowerCase();
            const managerName = (emp.reportingTo || '').trim().toLowerCase();

            const node = map.get(fullName);
            if (!node) return;

            if (managerName && map.has(managerName)) {
                map.get(managerName)!.children.push(node);
            } else {
                rootNodes.push(node);
            }
        });

        // Make sure CEO is at the top if present
        let finalRoots = rootNodes;
        const ceoNode = rootNodes.find(n => n.jobTitle.toLowerCase().includes('ceo') || n.jobTitle.toLowerCase().includes('chief executive'));

        if (ceoNode) {
            const otherRoots = rootNodes.filter(n => n.id !== ceoNode.id);
            if (otherRoots.length > 0) {
                // Attach other roots to CEO to ensure a single unified tree
                ceoNode.children.push(...otherRoots);
            }
            finalRoots = [ceoNode];
        }

        // Compute subtree stats bottom-up
        const computeStats = (node: TreeNode): { count: number; tenureSum: number } => {
            let count = 0;
            let tenureSum = 0;

            node.children.forEach(child => {
                const childStats = computeStats(child);
                count += 1 + childStats.count; // Child itself + its direct/indirect reports
                tenureSum += child.calculatedTenure + childStats.tenureSum;
            });

            node.totalHeadcount = count;
            node.totalSubTenure = tenureSum;
            node.averageTenure = count > 0 ? tenureSum / count : 0;

            return { count, tenureSum };
        };

        finalRoots.forEach(root => computeStats(root));

        return finalRoots;
    }, [employees]);

    return (
        <div className="org-tree overflow-auto p-8 flex justify-center w-full min-h-[500px] bg-gray-50 rounded-lg">
            <style>{`
                .org-tree ul {
                    padding-top: 20px; 
                    position: relative;
                    display: flex;
                    justify-content: center;
                }
                .org-tree li {
                    float: left; text-align: center;
                    list-style-type: none;
                    position: relative;
                    padding: 20px 10px 0 10px;
                }
                .org-tree li::before, .org-tree li::after {
                    content: '';
                    position: absolute; top: 0; right: 50%;
                    border-top: 2px solid #cbd5e1;
                    width: 50%; height: 20px;
                }
                .org-tree li::after {
                    right: auto; left: 50%;
                    border-left: 2px solid #cbd5e1;
                }
                .org-tree li:only-child::after, .org-tree li:only-child::before {
                    display: none;
                }
                .org-tree li:only-child { padding-top: 0; }
                .org-tree li:first-child::before, .org-tree li:last-child::after {
                    border: 0 none;
                }
                .org-tree li:last-child::before {
                    border-right: 2px solid #cbd5e1;
                    border-radius: 0 5px 0 0;
                }
                .org-tree li:first-child::after {
                    border-radius: 5px 0 0 0;
                }
                .org-tree ul ul::before {
                    content: '';
                    position: absolute; top: 0; left: 50%;
                    border-left: 2px solid #cbd5e1;
                    width: 0; height: 20px;
                    transform: translateX(-1px);
                }
            `}</style>

            {tree.length === 0 ? (
                <div className="text-gray-500 mt-10">No hierarchical data available. Make sure 'Reporting To' matches employee names.</div>
            ) : (
                <ul>
                    {tree.map(root => (
                        <OrgNode key={root.id} node={root} onNodeClick={onNodeClick} />
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OrgChart;

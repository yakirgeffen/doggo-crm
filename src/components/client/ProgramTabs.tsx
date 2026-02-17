import { ClipboardList, FileSearch, History } from 'lucide-react';
import type { Program } from '../../types';

export type TabId = 'active' | 'intake' | 'history';

interface ProgramTabsProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    programs: Program[];
    selectedProgramId: string | null;
    onSelectProgram: (id: string) => void;
}

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'active', label: 'חבילה פעילה', icon: ClipboardList },
    { id: 'intake', label: 'קבלה', icon: FileSearch },
    { id: 'history', label: 'היסטוריה', icon: History },
];

export function ProgramTabs({ activeTab, onTabChange, programs, selectedProgramId, onSelectProgram }: ProgramTabsProps) {
    const activePrograms = programs.filter(p => p.status === 'active');

    return (
        <div className="mb-6 space-y-3">
            {/* Tab bar */}
            <div className="flex gap-1 bg-surface-warm rounded-xl p-1" role="tablist">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-surface text-text-primary shadow-soft'
                                    : 'text-text-muted hover:text-text-secondary hover:bg-surface/50'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Program selector (if multiple active programs and on "active" tab) */}
            {activeTab === 'active' && activePrograms.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {activePrograms.map((program) => (
                        <button
                            key={program.id}
                            onClick={() => onSelectProgram(program.id)}
                            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedProgramId === program.id
                                    ? 'bg-primary/10 text-primary border-primary/30'
                                    : 'bg-surface text-text-muted border-border hover:border-primary/20'
                                }`}
                        >
                            {program.program_name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

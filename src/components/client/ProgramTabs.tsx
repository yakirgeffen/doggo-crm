import { ClipboardList, History, Paperclip } from 'lucide-react';
import type { Program } from '../../types';

// Tab id type. The 'intake' tab was a Phase-3 placeholder that shipped with
// the bare "נתוני קבלה ואבחון יופיעו כאן בקרוב (Phase 3)" copy and no
// substance. Per Yakir's polish-before-need rule (2026-05-03), an empty tab
// reading 'בקרוב' is a defect — removed iter 136 ahead of the Gaya demo.
// Re-add when there's actual intake UX to ship.
export type TabId = 'active' | 'files' | 'history';

interface ProgramTabsProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    programs: Program[];
    selectedProgramId: string | null;
    onSelectProgram: (id: string) => void;
}

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'active', label: 'חבילה פעילה', icon: ClipboardList },
    { id: 'files', label: 'קבצים', icon: Paperclip },
    { id: 'history', label: 'היסטוריה', icon: History },
];

/**
 * Tabs along the underside of the hero card. Iter 138 redesign (Yakir demo):
 * was a pill-row inside a `bg-surface-warm` rounded chip, which read like a
 * standalone widget detached from the page flow. Switched to a clean
 * underline pattern (active = primary text + 2px primary underline; idle =
 * muted text, hover = secondary text), aligned to the start (RTL right edge).
 * This matches platform-native tab UX and gives the active tab clear
 * affordance without competing visual weight against the hero card above.
 */
export function ProgramTabs({ activeTab, onTabChange, programs, selectedProgramId, onSelectProgram }: ProgramTabsProps) {
    const activePrograms = programs.filter(p => p.status === 'active');

    return (
        <div className="mb-5 space-y-3">
            {/* Underline tab bar */}
            <div className="border-b border-border" role="tablist">
                <div className="flex gap-1 -mb-px">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                    isActive
                                        ? 'text-primary'
                                        : 'text-text-muted hover:text-text-secondary'
                                }`}
                            >
                                <Icon size={15} />
                                {tab.label}
                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 inset-x-2 h-0.5 bg-primary rounded-t-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Program selector (if multiple active programs and on "active" tab) */}
            {activeTab === 'active' && activePrograms.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {activePrograms.map((program) => (
                        <button
                            key={program.id}
                            onClick={() => onSelectProgram(program.id)}
                            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                selectedProgramId === program.id
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

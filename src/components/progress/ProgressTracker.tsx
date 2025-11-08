'use client';

import { useEffect, useState } from 'react';
// Simple progress bar component
function Progress({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface ProgressStats {
  overall: {
    total: number;
    completed: number;
    completionPercentage: number;
  };
  byStage: {
    stage1: { total: number; completed: number; percentage: number };
    stage2: { total: number; completed: number; percentage: number };
    stage3: { total: number; completed: number; percentage: number };
  };
  currentLesson: number;
  currentStage: string;
}

interface ProgressTrackerProps {
  studentId: string;
}

export function ProgressTracker({ studentId }: ProgressTrackerProps) {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [studentId]);

  async function fetchProgress() {
    try {
      const response = await fetch(`/api/students/${studentId}/progress`);
      if (response.ok) {
        const data = await response.json();
        // Calculate stats from progress data
        // For now, we'll use a simplified version
        // In production, you'd want a dedicated stats endpoint
        setStats({
          overall: {
            total: 40,
            completed: data.progress?.filter((p: any) => p.status === 'COMPLETED').length || 0,
            completionPercentage: 0,
          },
          byStage: {
            stage1: { total: 15, completed: 0, percentage: 0 },
            stage2: { total: 15, completed: 0, percentage: 0 },
            stage3: { total: 10, completed: 0, percentage: 0 },
          },
          currentLesson: data.student?.currentLesson || 1,
          currentStage: data.student?.currentStage || 'STAGE_1_PRE_SOLO',
        });
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4">Loading progress...</div>;
  }

  if (!stats) {
    return <div className="p-4">No progress data available</div>;
  }

  const stageNames: Record<string, string> = {
    STAGE_1_PRE_SOLO: 'Stage 1: Pre-Solo',
    STAGE_2_SOLO_XC: 'Stage 2: Solo Cross-Country',
    STAGE_3_CHECKRIDE_PREP: 'Stage 3: Checkride Prep',
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {stats.overall.completed} of {stats.overall.total} lessons completed
            </span>
            <span>{stats.overall.completionPercentage}%</span>
          </div>
          <Progress value={stats.overall.completionPercentage} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Progress by Stage</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{stageNames['STAGE_1_PRE_SOLO']}</span>
              <span>{stats.byStage.stage1.percentage}%</span>
            </div>
            <Progress value={stats.byStage.stage1.percentage} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{stageNames['STAGE_2_SOLO_XC']}</span>
              <span>{stats.byStage.stage2.percentage}%</span>
            </div>
            <Progress value={stats.byStage.stage2.percentage} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{stageNames['STAGE_3_CHECKRIDE_PREP']}</span>
              <span>{stats.byStage.stage3.percentage}%</span>
            </div>
            <Progress value={stats.byStage.stage3.percentage} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-blue-50">
        <p className="text-sm font-medium">Current Status</p>
        <p className="text-lg mt-1">
          Lesson {stats.currentLesson} - {stageNames[stats.currentStage] || stats.currentStage}
        </p>
      </div>
    </div>
  );
}


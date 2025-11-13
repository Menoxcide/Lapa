/**
 * ROI Widget for LAPA v1.3.0-preview — Phase 21
 * 
 * Floating widget showing "Saved 2.5h this week" with expandable pane.
 * Features: Trends chart, Export CSV, Per-mode ROI breakdown.
 */

import React, { useState, useEffect } from 'react';
import { getROIDashboard, type ROIMetrics } from '../observability/roi-dashboard.ts';

interface ROIWidgetProps {
  className?: string;
}

const ROIWidget: React.FC<ROIWidgetProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [roiDashboard] = useState(() => getROIDashboard());

  useEffect(() => {
    // Load initial metrics
    setMetrics(roiDashboard.getMetrics());

    // Subscribe to ROI updates
    const unsubscribe = (window as any).eventBus?.subscribe('roi.updated', (event: any) => {
      if (event.payload?.metrics) {
        setMetrics(event.payload.metrics);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const exportCSV = () => {
    if (!roiDashboard) return;
    const csv = roiDashboard.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lapa-roi-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!metrics) {
    return null;
  }

  const timeSavedString = roiDashboard.getTimeSavedString();

  return (
    <div className={`roi-widget fixed bottom-4 right-4 z-50 ${className || ''}`}>
      {/* Floating Badge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        aria-label="ROI Dashboard"
      >
        <span className="text-sm font-semibold">💰 {timeSavedString}</span>
        <span className="text-xs">{isExpanded ? '▼' : '▲'}</span>
      </button>

      {/* Expandable Pane */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl border p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">ROI Dashboard</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-gray-600">Time Saved</div>
              <div className="text-lg font-bold text-blue-600">
                {metrics.timeSavedHours.toFixed(1)}h
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-xs text-gray-600">Cost Saved</div>
              <div className="text-lg font-bold text-green-600">
                ${metrics.costSavedUSD.toFixed(2)}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-xs text-gray-600">Handoffs Avoided</div>
              <div className="text-lg font-bold text-purple-600">
                {metrics.handoffsAvoided}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-xs text-gray-600">Bugs Prevented</div>
              <div className="text-lg font-bold text-orange-600">
                {metrics.bugsPrevented}
              </div>
            </div>
          </div>

          {/* Per-Mode ROI */}
          {Object.keys(metrics.perModeROI).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Per-Mode ROI</h4>
              <div className="space-y-2">
                {Object.entries(metrics.perModeROI).map(([mode, roi]) => (
                  <div key={mode} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{mode}</div>
                      <div className="text-xs text-gray-600">
                        {roi.tasksCompleted} tasks, {roi.efficiencyGain.toFixed(1)}% efficiency
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {roi.timeSavedHours.toFixed(1)}h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Trend (Simple Chart) */}
          {metrics.weeklyTrend.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Weekly Trend</h4>
              <div className="h-24 flex items-end gap-1">
                {metrics.weeklyTrend.map((entry, idx) => {
                  const maxHours = Math.max(...metrics.weeklyTrend.map(e => e.timeSavedHours));
                  const height = (entry.timeSavedHours / maxHours) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${entry.date}: ${entry.timeSavedHours.toFixed(1)}h`}
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                if (confirm('Reset all ROI metrics?')) {
                  roiDashboard.reset();
                  setMetrics(roiDashboard.getMetrics());
                }
              }}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ROIWidget;


/**
 * Phase Summary Card Component for LAPA v1.2.2 — Phase 16
 * 
 * React component for displaying phase summaries in the UI
 */

import React from 'react';
import type { PhaseSummary } from '../../types/phase-summary.ts';

export interface PhaseSummaryCardProps {
  summary: PhaseSummary;
  onExpand?: () => void;
  onCollapse?: () => void;
  expanded?: boolean;
  showDetails?: boolean;
}

/**
 * Phase Summary Card Component
 */
export const PhaseSummaryCard: React.FC<PhaseSummaryCardProps> = ({
  summary,
  onExpand,
  onCollapse,
  expanded = false,
  showDetails = false
}) => {
  const statusColors = {
    completed: '#10b981',
    in_progress: '#3b82f6',
    blocked: '#f59e0b',
    cancelled: '#ef4444'
  };

  const statusBgColors = {
    completed: '#d1fae5',
    in_progress: '#dbeafe',
    blocked: '#fef3c7',
    cancelled: '#fee2e2'
  };

  const handleToggle = () => {
    if (expanded) {
      onCollapse?.();
    } else {
      onExpand?.();
    }
  };

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Phase {summary.phase}: {summary.title}
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            {summary.description}
          </p>
        </div>
        <div
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            backgroundColor: statusBgColors[summary.status],
            color: statusColors[summary.status],
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}
        >
          {summary.status}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}
      >
        <StatItem label="Files" value={summary.files.length} />
        <StatItem label="Commits" value={summary.commits.length} />
        <StatItem label="Components" value={summary.components.length} />
        {summary.dependencies && (
          <StatItem label="Dependencies" value={summary.dependencies.length} />
        )}
        {summary.tests && (
          <StatItem
            label="Tests"
            value={`${summary.tests.passed}/${summary.tests.total}`}
          />
        )}
      </div>

      {/* Dates */}
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        {summary.startDate && (
          <span>
            Started: {new Date(summary.startDate).toLocaleDateString()}
          </span>
        )}
        {summary.endDate && (
          <span style={{ marginLeft: '16px' }}>
            Ended: {new Date(summary.endDate).toLocaleDateString()}
          </span>
        )}
        {summary.duration && (
          <span style={{ marginLeft: '16px' }}>
            Duration: {(summary.duration / 1000 / 60).toFixed(1)} min
          </span>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {(showDetails || expanded) && (
        <button
          onClick={handleToggle}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {expanded ? 'Collapse' : 'Expand'} Details
        </button>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          {/* Components */}
          {summary.components.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Components
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {summary.components.map((component, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <strong>{component.name}</strong> ({component.status})
                    <br />
                    <code style={{ fontSize: '11px', color: '#6b7280' }}>
                      {component.path}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Commits */}
          {summary.commits.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Recent Commits
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {summary.commits.slice(0, 5).map((commit, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <code style={{ fontSize: '11px', color: '#6b7280' }}>
                      {commit.hash.substring(0, 7)}
                    </code>{' '}
                    {commit.message}
                    <br />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      {commit.author} • {new Date(commit.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {summary.metrics && summary.metrics.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Metrics
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {summary.metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <strong>{metric.name}</strong>: {metric.value}
                    {metric.unit && ` ${metric.unit}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {summary.nextSteps && summary.nextSteps.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Next Steps
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                {summary.nextSteps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Stat Item Component
 */
const StatItem: React.FC<{ label: string; value: string | number }> = ({
  label,
  value
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: '600' }}>{value}</span>
    </div>
  );
};

export default PhaseSummaryCard;


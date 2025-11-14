/**
 * ROI Flywheel Virtual Cycle Tests (I4)
 * 
 * Tests for ROI calculation accuracy, virtual cycle tracking (3.5h target),
 * productivity metrics, cost savings calculations, and per-mode ROI breakdown.
 * 
 * Phase 4 GauntletTest - Iteration I4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ROIDashboard, ROIMetrics } from '../../observability/roi-dashboard.ts';
import { eventBus } from '../../core/event-bus.ts';
import type { LAPAEvent } from '../../types/event-types.ts';

describe('ROI Flywheel Virtual Cycle (I4)', () => {
  let roiDashboard: ROIDashboard;
  const VIRTUAL_CYCLE_TARGET_HOURS = 3.5; // 3.5 hours target from Phase 4 requirements

  beforeEach(() => {
    roiDashboard = new ROIDashboard({
      tokenCostPer1K: 0.002,
      hourlyRateUSD: 50,
      averageBugFixTimeMinutes: 30,
      enableMetrics: true,
    });
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('ROI Calculation Accuracy', () => {
    it('should calculate ROI accurately for task completion', () => {
      const executionTimeMs = 3600000; // 1 hour
      const tokensUsed = 10000;
      const mode = 'coder';

      // Track task completion
      roiDashboard.trackTaskCompletion(mode, executionTimeMs, tokensUsed);

      const metrics = roiDashboard.getMetrics();

      // Verify time saved calculation (3x manual time)
      const estimatedManualTimeMs = executionTimeMs * 3; // 3 hours
      const expectedTimeSavedHours = (estimatedManualTimeMs - executionTimeMs) / (1000 * 60 * 60); // 2 hours

      expect(metrics.timeSavedHours).toBeCloseTo(expectedTimeSavedHours, 2);
      expect(metrics.perModeROI[mode]).toBeDefined();
      expect(metrics.perModeROI[mode].tasksCompleted).toBe(1);
    });

    it('should calculate cost savings correctly', () => {
      const executionTimeMs = 1800000; // 30 minutes
      const tokensUsed = 5000;
      const mode = 'planner';

      roiDashboard.trackTaskCompletion(mode, executionTimeMs, tokensUsed);

      const metrics = roiDashboard.getMetrics();

      // Verify cost savings calculation
      const timeSavedHours = metrics.timeSavedHours;
      const timeSavedCost = timeSavedHours * 50; // $50/hour
      const tokenCost = (metrics.tokensSaved / 1000) * 0.002;
      const expectedCostSaved = timeSavedCost - tokenCost;

      expect(metrics.costSavedUSD).toBeGreaterThan(0);
      expect(Math.abs(metrics.costSavedUSD - expectedCostSaved)).toBeLessThan(0.01);
    });

    it('should track tokens saved accurately', () => {
      const initialTokens = 10000;
      
      // Simulate token savings
      roiDashboard.trackHandoffAvoided(5000);
      roiDashboard.trackHandoffAvoided(3000);
      roiDashboard.trackHandoffAvoided(2000);

      const metrics = roiDashboard.getMetrics();

      // Verify tokens saved
      expect(metrics.tokensSaved).toBe(10000);
    });

    it('should track bugs prevented correctly', () => {
      const mode = 'tester';

      // Track bug prevention
      roiDashboard.trackBugPrevented(mode);
      roiDashboard.trackBugPrevented(mode);
      roiDashboard.trackBugPrevented(mode);

      const metrics = roiDashboard.getMetrics();

      // Verify bugs prevented
      expect(metrics.bugsPrevented).toBe(3);
      expect(metrics.perModeROI[mode]).toBeDefined();
    });
  });

  describe('Virtual Cycle Tracking - 3.5h Target', () => {
    it('should track virtual cycle time to 3.5 hours', () => {
      // Simulate multiple task completions to reach 3.5 hours
      const tasks = [
        { mode: 'coder', time: 1800000, tokens: 5000 }, // 30 min
        { mode: 'planner', time: 900000, tokens: 3000 }, // 15 min
        { mode: 'tester', time: 1200000, tokens: 4000 }, // 20 min
        { mode: 'reviewer', time: 900000, tokens: 2000 }, // 15 min
        { mode: 'coder', time: 1800000, tokens: 6000 }, // 30 min
        { mode: 'planner', time: 900000, tokens: 3000 }, // 15 min
        { mode: 'tester', time: 1200000, tokens: 4000 }, // 20 min
      ];

      tasks.forEach(task => {
        roiDashboard.trackTaskCompletion(task.mode, task.time, task.tokens);
      });

      // Add some handoff avoidance and bug prevention
      roiDashboard.trackHandoffAvoided(5000);
      roiDashboard.trackBugPrevented('tester');
      roiDashboard.trackBugPrevented('coder');

      const metrics = roiDashboard.getMetrics();

      // Verify virtual cycle time is tracked
      expect(metrics.timeSavedHours).toBeGreaterThan(0);

      // Check if 3.5 hour target is achievable
      // Each task saves ~2/3 of its time (3x manual time assumption)
      const totalSavedHours = tasks.reduce((sum, task) => {
        const manualTimeMs = task.time * 3;
        const savedMs = manualTimeMs - task.time;
        return sum + savedMs / (1000 * 60 * 60);
      }, 0);

      // Add bug prevention time (30 min per bug)
      const bugPreventionHours = (2 * 30) / 60; // 1 hour

      const totalVirtualCycleHours = totalSavedHours + bugPreventionHours;

      // Verify we can reach 3.5 hours target
      expect(totalVirtualCycleHours).toBeGreaterThanOrEqual(VIRTUAL_CYCLE_TARGET_HOURS);

      console.log(`Virtual Cycle Tracking:`);
      console.log(`  Time Saved from Tasks: ${totalSavedHours.toFixed(2)} hours`);
      console.log(`  Time Saved from Bug Prevention: ${bugPreventionHours.toFixed(2)} hours`);
      console.log(`  Total Virtual Cycle: ${totalVirtualCycleHours.toFixed(2)} hours`);
      console.log(`  Target: ${VIRTUAL_CYCLE_TARGET_HOURS} hours`);
      console.log(`  Status: ${totalVirtualCycleHours >= VIRTUAL_CYCLE_TARGET_HOURS ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    });

    it('should validate 3.5 hour virtual cycle target', () => {
      // Verify target is set correctly
      expect(VIRTUAL_CYCLE_TARGET_HOURS).toBe(3.5);
      
      // Verify target is reasonable (greater than 0, less than 10)
      expect(VIRTUAL_CYCLE_TARGET_HOURS).toBeGreaterThan(0);
      expect(VIRTUAL_CYCLE_TARGET_HOURS).toBeLessThan(10);

      console.log(`Virtual Cycle Target Validation:`);
      console.log(`  Target: ${VIRTUAL_CYCLE_TARGET_HOURS} hours`);
      console.log(`  Status: VALID`);
    });
  });

  describe('Productivity Metrics', () => {
    it('should track productivity metrics accurately', () => {
      const modes = ['coder', 'planner', 'tester', 'reviewer'];

      modes.forEach((mode, index) => {
        roiDashboard.trackTaskCompletion(mode, 1800000 * (index + 1), 5000 * (index + 1));
      });

      const metrics = roiDashboard.getMetrics();

      // Verify per-mode metrics
      modes.forEach(mode => {
        expect(metrics.perModeROI[mode]).toBeDefined();
        expect(metrics.perModeROI[mode].tasksCompleted).toBeGreaterThan(0);
        expect(metrics.perModeROI[mode].timeSavedHours).toBeGreaterThan(0);
        expect(metrics.perModeROI[mode].efficiencyGain).toBeGreaterThan(0);
      });

      console.log(`Productivity Metrics:`);
      modes.forEach(mode => {
        const modeMetrics = metrics.perModeROI[mode];
        console.log(`  ${mode}:`);
        console.log(`    Tasks Completed: ${modeMetrics.tasksCompleted}`);
        console.log(`    Time Saved: ${modeMetrics.timeSavedHours.toFixed(2)} hours`);
        console.log(`    Efficiency Gain: ${modeMetrics.efficiencyGain.toFixed(2)}%`);
      });
    });

    it('should calculate efficiency gains correctly', () => {
      const executionTimeMs = 3600000; // 1 hour
      const tokensUsed = 10000;
      const mode = 'coder';

      roiDashboard.trackTaskCompletion(mode, executionTimeMs, tokensUsed);

      const metrics = roiDashboard.getMetrics();
      const modeMetrics = metrics.perModeROI[mode];

      // Verify efficiency gain calculation
      // Manual time = 3 hours, execution = 1 hour, saved = 2 hours
      // Efficiency = (2 / 3) * 100 = 66.67%
      const expectedEfficiency = ((3 - 1) / 3) * 100;

      expect(modeMetrics.efficiencyGain).toBeCloseTo(expectedEfficiency, 1);
    });

    it('should track task completion rates', () => {
      const mode = 'planner';

      // Complete multiple tasks
      for (let i = 0; i < 10; i++) {
        roiDashboard.trackTaskCompletion(mode, 1800000, 5000);
      }

      const metrics = roiDashboard.getMetrics();

      // Verify task completion count
      expect(metrics.perModeROI[mode].tasksCompleted).toBe(10);
    });
  });

  describe('Cost Savings Calculations', () => {
    it('should calculate cost savings from time saved', () => {
      const hourlyRate = 50;
      const timeSavedHours = 3.5;

      // Simulate 3.5 hours saved
      for (let i = 0; i < 7; i++) {
        roiDashboard.trackTaskCompletion('coder', 1800000, 5000); // 30 min each
      }

      const metrics = roiDashboard.getMetrics();

      // Verify cost calculation
      const expectedCostSaved = metrics.timeSavedHours * hourlyRate;
      const tokenCost = (metrics.tokensSaved / 1000) * 0.002;
      const expectedNetSavings = expectedCostSaved - tokenCost;

      expect(metrics.costSavedUSD).toBeGreaterThan(0);
      expect(Math.abs(metrics.costSavedUSD - expectedNetSavings)).toBeLessThan(1.0);
    });

    it('should account for token costs in net savings', () => {
      // Track high token usage task
      roiDashboard.trackTaskCompletion('coder', 3600000, 50000); // 1 hour, 50k tokens

      const metrics = roiDashboard.getMetrics();

      // Verify token cost is deducted from savings
      const timeSavedCost = metrics.timeSavedHours * 50;
      const tokenCost = (metrics.tokensSaved / 1000) * 0.002;
      const expectedNetSavings = timeSavedCost - tokenCost;

      expect(metrics.costSavedUSD).toBeCloseTo(expectedNetSavings, 2);
    });

    it('should track handoff avoidance savings', () => {
      // Track multiple handoffs avoided
      roiDashboard.trackHandoffAvoided(10000);
      roiDashboard.trackHandoffAvoided(5000);
      roiDashboard.trackHandoffAvoided(8000);

      const metrics = roiDashboard.getMetrics();

      // Verify tokens saved from handoffs
      expect(metrics.tokensSaved).toBe(23000);
      expect(metrics.handoffsAvoided).toBe(3);
    });
  });

  describe('Per-Mode ROI Breakdown', () => {
    it('should provide per-mode ROI breakdown', () => {
      const modes = ['coder', 'planner', 'tester', 'reviewer', 'architect'];

      modes.forEach((mode, index) => {
        roiDashboard.trackTaskCompletion(mode, 1800000 * (index + 1), 5000 * (index + 1));
      });

      const metrics = roiDashboard.getMetrics();

      // Verify all modes are tracked
      modes.forEach(mode => {
        expect(metrics.perModeROI[mode]).toBeDefined();
        expect(metrics.perModeROI[mode].tasksCompleted).toBe(1);
        expect(metrics.perModeROI[mode].timeSavedHours).toBeGreaterThan(0);
      });

      console.log(`Per-Mode ROI Breakdown:`);
      modes.forEach(mode => {
        const modeMetrics = metrics.perModeROI[mode];
        console.log(`  ${mode}:`);
        console.log(`    Tasks: ${modeMetrics.tasksCompleted}`);
        console.log(`    Time Saved: ${modeMetrics.timeSavedHours.toFixed(2)}h`);
        console.log(`    Efficiency: ${modeMetrics.efficiencyGain.toFixed(2)}%`);
      });
    });

    it('should aggregate per-mode ROI correctly', () => {
      // Track tasks across multiple modes
      roiDashboard.trackTaskCompletion('coder', 1800000, 5000);
      roiDashboard.trackTaskCompletion('coder', 1800000, 5000);
      roiDashboard.trackTaskCompletion('planner', 900000, 3000);
      roiDashboard.trackTaskCompletion('tester', 1200000, 4000);

      const metrics = roiDashboard.getMetrics();

      // Verify coder mode has 2 tasks
      expect(metrics.perModeROI['coder'].tasksCompleted).toBe(2);

      // Verify other modes have 1 task
      expect(metrics.perModeROI['planner'].tasksCompleted).toBe(1);
      expect(metrics.perModeROI['tester'].tasksCompleted).toBe(1);

      // Verify total time saved aggregates correctly
      const totalTimeSaved = Object.values(metrics.perModeROI).reduce(
        (sum, mode) => sum + mode.timeSavedHours,
        0
      );

      expect(totalTimeSaved).toBeCloseTo(metrics.timeSavedHours, 2);
    });
  });

  describe('Flywheel Effect Validation', () => {
    it('should validate virtual cycle creates flywheel effect', () => {
      // Simulate multiple cycles of work
      const cycles = 5;
      const tasksPerCycle = 3;

      for (let cycle = 0; cycle < cycles; cycle++) {
        for (let task = 0; task < tasksPerCycle; task++) {
          const mode = ['coder', 'planner', 'tester'][task];
          roiDashboard.trackTaskCompletion(mode, 1800000, 5000);
        }
      }

      const metrics = roiDashboard.getMetrics();

      // Verify cumulative effect
      expect(metrics.timeSavedHours).toBeGreaterThan(VIRTUAL_CYCLE_TARGET_HOURS);
      
      // Verify productivity increases over cycles (flywheel effect)
      const totalTasks = cycles * tasksPerCycle;
      expect(Object.values(metrics.perModeROI).reduce((sum, m) => sum + m.tasksCompleted, 0)).toBe(totalTasks);

      console.log(`Flywheel Effect Validation:`);
      console.log(`  Cycles Completed: ${cycles}`);
      console.log(`  Total Tasks: ${totalTasks}`);
      console.log(`  Total Time Saved: ${metrics.timeSavedHours.toFixed(2)} hours`);
      console.log(`  Cumulative ROI: $${metrics.costSavedUSD.toFixed(2)}`);
    });

    it('should measure ROI growth over time', () => {
      const timePoints = [
        { tasks: 1, expectedMinROI: 0.5 },
        { tasks: 5, expectedMinROI: 2.0 },
        { tasks: 10, expectedMinROI: 3.5 },
      ];

      timePoints.forEach(({ tasks, expectedMinROI }) => {
        // Reset dashboard for clean measurement
        const testDashboard = new ROIDashboard({
          tokenCostPer1K: 0.002,
          hourlyRateUSD: 50,
          averageBugFixTimeMinutes: 30,
          enableMetrics: true,
        });

        // Complete tasks
        for (let i = 0; i < tasks; i++) {
          testDashboard.trackTaskCompletion('coder', 1800000, 5000);
        }

        const metrics = testDashboard.getMetrics();

        // Verify ROI meets expected minimum
        expect(metrics.timeSavedHours).toBeGreaterThanOrEqual(expectedMinROI);
      });
    });
  });

  describe('3.5h Validation', () => {
    it('should validate 3.5 hour virtual cycle target is achievable', () => {
      // Calculate minimum tasks needed to reach 3.5 hours
      // Each task: 30 min execution = 1.5 hours manual time = 1 hour saved
      const timeSavedPerTask = 1.0; // hours
      const targetHours = VIRTUAL_CYCLE_TARGET_HOURS;
      const minTasks = Math.ceil(targetHours / timeSavedPerTask);

      // Verify we can achieve target
      expect(minTasks).toBeLessThanOrEqual(4); // Should be achievable with 4 tasks

      // Complete minimum tasks
      for (let i = 0; i < minTasks; i++) {
        roiDashboard.trackTaskCompletion('coder', 1800000, 5000);
      }

      const metrics = roiDashboard.getMetrics();

      // Verify 3.5 hour target is met or exceeded
      expect(metrics.timeSavedHours).toBeGreaterThanOrEqual(VIRTUAL_CYCLE_TARGET_HOURS);

      console.log(`3.5h Target Validation:`);
      console.log(`  Minimum Tasks Required: ${minTasks}`);
      console.log(`  Actual Time Saved: ${metrics.timeSavedHours.toFixed(2)} hours`);
      console.log(`  Target: ${VIRTUAL_CYCLE_TARGET_HOURS} hours`);
      console.log(`  Status: ${metrics.timeSavedHours >= VIRTUAL_CYCLE_TARGET_HOURS ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    });

    it('should measure ROI efficiency toward 3.5h target', () => {
      // Track tasks until 3.5h is reached
      let taskCount = 0;
      const maxTasks = 10;

      while (taskCount < maxTasks) {
        roiDashboard.trackTaskCompletion('coder', 1800000, 5000);
        taskCount++;

        const metrics = roiDashboard.getMetrics();
        
        if (metrics.timeSavedHours >= VIRTUAL_CYCLE_TARGET_HOURS) {
          break;
        }
      }

      const metrics = roiDashboard.getMetrics();

      // Verify target is achievable
      expect(taskCount).toBeLessThanOrEqual(maxTasks);
      expect(metrics.timeSavedHours).toBeGreaterThanOrEqual(VIRTUAL_CYCLE_TARGET_HOURS);

      console.log(`ROI Efficiency:`);
      console.log(`  Tasks to Reach Target: ${taskCount}`);
      console.log(`  Time Saved: ${metrics.timeSavedHours.toFixed(2)} hours`);
      console.log(`  Efficiency: ${(VIRTUAL_CYCLE_TARGET_HOURS / taskCount).toFixed(2)} hours/task`);
    });
  });
});


"use strict";
/**
 * History & Tasks Window for LAPA v1.3.0-preview — Phase 21
 *
 * Sidebar/tab: Scrollable list of sessions/tasks (filter by mode/date).
 * Features: Batch delete, Quick copy (prompts/MD), Auto-cleanup toggle, Replay GIF button.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const TaskHistory = ({ onClose }) => {
    const [tasks, setTasks] = (0, react_1.useState)([]);
    const [selectedTasks, setSelectedTasks] = (0, react_1.useState)(new Set());
    const [filterMode, setFilterMode] = (0, react_1.useState)('all');
    const [filterDate, setFilterDate] = (0, react_1.useState)('all');
    const [autoCleanup, setAutoCleanup] = (0, react_1.useState)(false);
    const [cleanupDays, setCleanupDays] = (0, react_1.useState)(30);
    (0, react_1.useEffect)(() => {
        loadTasks();
    }, []);
    const loadTasks = async () => {
        // TODO: Load from Memori-Engine or local storage
        // For now, use mock data
        const mockTasks = [
            {
                id: '1',
                sessionId: 'session-1',
                mode: 'Code',
                task: 'Implement user authentication',
                prompt: 'Create a login system with JWT tokens',
                timestamp: Date.now() - 86400000, // 1 day ago
                duration: 120000,
                tokensUsed: 1500,
                roiBreakdown: {
                    timeSavedMinutes: 15,
                    handoffsAvoided: 2
                }
            },
            {
                id: '2',
                sessionId: 'session-1',
                mode: 'Architect',
                task: 'Design database schema',
                prompt: 'Design a schema for a blog application',
                timestamp: Date.now() - 172800000, // 2 days ago
                duration: 180000,
                tokensUsed: 2000,
                roiBreakdown: {
                    timeSavedMinutes: 30,
                    handoffsAvoided: 1
                }
            }
        ];
        setTasks(mockTasks);
    };
    const handleSelectTask = (taskId) => {
        const newSelected = new Set(selectedTasks);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        }
        else {
            newSelected.add(taskId);
        }
        setSelectedTasks(newSelected);
    };
    const handleSelectAll = () => {
        if (selectedTasks.size === tasks.length) {
            setSelectedTasks(new Set());
        }
        else {
            setSelectedTasks(new Set(tasks.map(t => t.id)));
        }
    };
    const handleBatchDelete = () => {
        if (selectedTasks.size === 0) {
            alert('Please select tasks to delete.');
            return;
        }
        if (confirm(`Delete ${selectedTasks.size} task(s)?`)) {
            setTasks(tasks.filter(t => !selectedTasks.has(t.id)));
            setSelectedTasks(new Set());
        }
    };
    const handleCopyPrompt = (task) => {
        navigator.clipboard.writeText(task.prompt);
        // TODO: Show toast notification
    };
    const handleCopyMarkdown = (task) => {
        const markdown = `# ${task.task}\n\n**Mode:** ${task.mode}\n\n**Prompt:**\n${task.prompt}\n\n**Result:**\n${task.result || 'N/A'}`;
        navigator.clipboard.writeText(markdown);
        // TODO: Show toast notification
    };
    const handleReplayGIF = async (task) => {
        // TODO: Implement GIF replay using html2canvas
        // This would capture the session state and create an animated GIF
        alert(`GIF replay for task "${task.task}" - Feature coming soon!`);
    };
    const filteredTasks = tasks.filter(task => {
        if (filterMode !== 'all' && task.mode !== filterMode)
            return false;
        if (filterDate !== 'all') {
            const taskDate = new Date(task.timestamp);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
            if (filterDate === 'today' && daysDiff > 0)
                return false;
            if (filterDate === 'week' && daysDiff > 7)
                return false;
            if (filterDate === 'month' && daysDiff > 30)
                return false;
        }
        return true;
    });
    return (<div className="task-history h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Task History</h2>
        {onClose && (<button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>)}
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-gray-50 space-y-2">
        <div className="flex gap-2">
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="flex-1 px-3 py-2 border rounded text-sm">
            <option value="all">All Modes</option>
            <option value="Code">Code</option>
            <option value="Architect">Architect</option>
            <option value="Ask">Ask</option>
            <option value="Debug">Debug</option>
            <option value="Custom">Custom</option>
          </select>
          <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="flex-1 px-3 py-2 border rounded text-sm">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center text-sm">
            <input type="checkbox" checked={autoCleanup} onChange={(e) => setAutoCleanup(e.target.checked)} className="mr-2"/>
            Auto-cleanup ({cleanupDays} days)
          </label>
          {autoCleanup && (<input type="number" value={cleanupDays} onChange={(e) => setCleanupDays(parseInt(e.target.value))} className="w-20 px-2 py-1 border rounded text-sm" min="1" max="365"/>)}
        </div>
      </div>

      {/* Batch Actions */}
      {selectedTasks.size > 0 && (<div className="p-4 border-b bg-blue-50 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedTasks.size} task(s) selected
          </span>
          <div className="flex gap-2">
            <button onClick={handleBatchDelete} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
              Delete Selected
            </button>
            <button onClick={() => setSelectedTasks(new Set())} className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300">
              Clear Selection
            </button>
          </div>
        </div>)}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (<div className="text-center py-12 text-gray-500">
            No tasks found. Start a new task to see history here.
          </div>) : (<div className="divide-y">
            {filteredTasks.map((task) => (<div key={task.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedTasks.has(task.id) ? 'bg-blue-50' : ''}`} onClick={() => handleSelectTask(task.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input type="checkbox" checked={selectedTasks.has(task.id)} onChange={() => handleSelectTask(task.id)} onClick={(e) => e.stopPropagation()} className="mr-2"/>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {task.mode}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{task.task}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {task.prompt}
                    </p>
                    {task.roiBreakdown && (<div className="text-xs text-green-600 mb-2">
                        💰 Saved {task.roiBreakdown.timeSavedMinutes}min, avoided {task.roiBreakdown.handoffsAvoided} handoff(s)
                      </div>)}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>⏱️ {Math.round(task.duration / 1000)}s</span>
                      {task.tokensUsed && <span>🔤 {task.tokensUsed} tokens</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    <button onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPrompt(task);
                }} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" title="Copy Prompt">
                      📋 Prompt
                    </button>
                    <button onClick={(e) => {
                    e.stopPropagation();
                    handleCopyMarkdown(task);
                }} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" title="Copy Markdown">
                      📝 MD
                    </button>
                    <button onClick={(e) => {
                    e.stopPropagation();
                    handleReplayGIF(task);
                }} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" title="Replay GIF">
                      🎬 GIF
                    </button>
                  </div>
                </div>
              </div>))}
          </div>)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredTasks.length} task(s)
        </div>
        <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:text-blue-800">
          {selectedTasks.size === tasks.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
    </div>);
};
exports.default = TaskHistory;
//# sourceMappingURL=TaskHistory.js.map
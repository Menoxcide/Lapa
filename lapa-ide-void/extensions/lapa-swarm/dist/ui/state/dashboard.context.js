"use strict";
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
exports.useDashboard = exports.DashboardProvider = exports.dashboardReducer = void 0;
const react_1 = __importStar(require("react"));
// Initial state
const initialState = {
    isRunning: true,
    agents: [],
    messages: [],
    nodes: [],
    edges: [],
    metrics: {
        tasksCompleted: 0,
        successRate: 0,
        activeAgents: 0,
        avgResponseTime: 0,
    },
};
// Reducer
const dashboardReducer = (state, action) => {
    switch (action.type) {
        case 'SET_RUNNING':
            return { ...state, isRunning: action.payload };
        case 'ADD_AGENT':
            return { ...state, agents: [...state.agents, action.payload] };
        case 'UPDATE_AGENT_STATUS':
            return {
                ...state,
                agents: state.agents.map(agent => agent.id === action.payload.id
                    ? { ...agent, status: action.payload.status }
                    : agent),
            };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'ADD_NODE':
            return { ...state, nodes: [...state.nodes, action.payload] };
        case 'ADD_EDGE':
            return { ...state, edges: [...state.edges, action.payload] };
        case 'UPDATE_METRICS':
            return { ...state, metrics: { ...state.metrics, ...action.payload } };
        case 'RESET_DASHBOARD':
            return initialState;
        default:
            return state;
    }
};
exports.dashboardReducer = dashboardReducer;
const DashboardContext = (0, react_1.createContext)(undefined);
const DashboardProvider = ({ children }) => {
    const [state, dispatch] = (0, react_1.useReducer)(exports.dashboardReducer, initialState);
    // Action handlers
    const pauseSwarm = () => {
        dispatch({ type: 'SET_RUNNING', payload: false });
        // In a real implementation, this would call the backend
        console.log('Pausing swarm...');
    };
    const resumeSwarm = () => {
        dispatch({ type: 'SET_RUNNING', payload: true });
        // In a real implementation, this would call the backend
        console.log('Resuming swarm...');
    };
    const redirectTask = () => {
        // In a real implementation, this would open a dialog and call the backend
        console.log('Redirecting task...');
    };
    const resetSwarm = () => {
        dispatch({ type: 'RESET_DASHBOARD' });
        // In a real implementation, this would call the backend
        console.log('Resetting swarm...');
    };
    const value = {
        state,
        dispatch,
        pauseSwarm,
        resumeSwarm,
        redirectTask,
        resetSwarm,
    };
    return (<DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>);
};
exports.DashboardProvider = DashboardProvider;
// Hook
const useDashboard = () => {
    const context = (0, react_1.useContext)(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
exports.useDashboard = useDashboard;
//# sourceMappingURL=dashboard.context.js.map
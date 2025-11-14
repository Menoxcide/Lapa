"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_ts_1 = require("./state/index.ts");
const Dashboard_tsx_1 = __importDefault(require("./Dashboard.tsx"));
const Root = () => {
    return (<index_ts_1.DashboardProvider>
      <Dashboard_tsx_1.default />
    </index_ts_1.DashboardProvider>);
};
exports.default = Root;
//# sourceMappingURL=Root.js.map
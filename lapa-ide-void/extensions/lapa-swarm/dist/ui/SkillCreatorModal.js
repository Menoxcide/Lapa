"use strict";
/**
 * Skill Creator Modal for LAPA v1.3 - Phase 22
 *
 * Modal dialog for creating and managing skills
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SkillManager_tsx_1 = __importDefault(require("./components/SkillManager.tsx"));
const SkillCreatorModal = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <SkillManager_tsx_1.default onClose={onClose}/>
      </div>
    </div>);
};
exports.default = SkillCreatorModal;
//# sourceMappingURL=SkillCreatorModal.js.map
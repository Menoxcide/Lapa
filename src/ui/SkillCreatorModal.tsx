/**
 * Skill Creator Modal for LAPA v1.3 - Phase 22
 * 
 * Modal dialog for creating and managing skills
 */

import React from 'react';
import SkillManager from './components/SkillManager';

interface SkillCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SkillCreatorModal: React.FC<SkillCreatorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <SkillManager onClose={onClose} />
      </div>
    </div>
  );
};

export default SkillCreatorModal;
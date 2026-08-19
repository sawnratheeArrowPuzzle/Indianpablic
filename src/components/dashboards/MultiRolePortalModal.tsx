import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/school-system';
import { AdminRecord, StudentData } from '../../types';
import { getSavedAuthSession, logoutUser, subscribeToAuthChanges } from '../../services/multiRoleAuth';
import { CommonLoginModal } from '../auth/CommonLoginModal';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { SchoolAdminDashboard } from './SchoolAdminDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from './StudentDashboard';

interface MultiRolePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AdminRecord[];
  onPreviewStudentCard?: (student: StudentData) => void;
}

export const MultiRolePortalModal: React.FC<MultiRolePortalModalProps> = ({
  isOpen,
  onClose,
  records,
  onPreviewStudentCard,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      const session = getSavedAuthSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
      const unsubscribe = subscribeToAuthChanges((profile) => {
        setCurrentUser(profile);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // If no user is logged in, show the Common Login Page
  if (!currentUser) {
    return (
      <CommonLoginModal
        isOpen={isOpen}
        onClose={onClose}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Automatic role-based routing based on Firestore user profile
  switch (currentUser.role) {
    case 'super_admin':
      return (
        <SuperAdminDashboard
          currentUser={currentUser}
          records={records}
          onLogout={handleLogout}
          onClose={onClose}
          onPreviewStudentCard={onPreviewStudentCard}
        />
      );

    case 'school_admin':
      return (
        <SchoolAdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onClose={onClose}
        />
      );

    case 'teacher':
      return (
        <TeacherDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onClose={onClose}
        />
      );

    case 'student':
      return (
        <StudentDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onClose={onClose}
        />
      );

    default:
      return (
        <CommonLoginModal
          isOpen={isOpen}
          onClose={onClose}
          onLoginSuccess={handleLoginSuccess}
        />
      );
  }
};

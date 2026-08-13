import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Download,
  Printer,
  Sparkles,
  CheckCircle,
  FileSpreadsheet,
  Phone,
  X
} from 'lucide-react';
import { StudentData } from '../types';
import { saveUserRecord } from '../utils/storage';

interface BulkStudentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  baseCardData: StudentData;
  onSelectStudent: (student: StudentData) => void;
  onPrintAll: (students: StudentData[]) => void;
}

export const BulkStudentGenerator: React.FC<BulkStudentGeneratorProps> = ({
  isOpen,
  onClose,
  baseCardData,
  onSelectStudent,
  onPrintAll,
}) => {
  const [students, setStudents] = useState<StudentData[]>([
    {
      ...baseCardData,
      id: '1',
      name: 'Sawvan Kumar',
      phone: '9876543210',
      idNumber: 'IND-15AUG-2025-08765',
      dob: '14 February 2006',
      role: 'Proud Citizen',
    },
    {
      ...baseCardData,
      id: '2',
      name: 'Aarav Sharma',
      phone: '9812345678',
      idNumber: 'IND-15AUG-2025-08766',
      dob: '05 July 2008',
      role: 'Student - Class 10-A',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    },
    {
      ...baseCardData,
      id: '3',
      name: 'Ananya Verma',
      phone: '9765432109',
      idNumber: 'IND-15AUG-2025-08767',
      dob: '22 October 2007',
      role: 'Head Girl - Class 11',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDob, setNewDob] = useState('');
  const [pasteData, setPasteData] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);

  if (!isOpen) return null;

  const handleAddStudent = () => {
    if (!newName.trim()) return;
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newStudent: StudentData = {
      ...baseCardData,
      id: `std-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim() || '9800000000',
      idNumber: `IND-15AUG-${baseCardData.year || '2025'}-${randomNum}`,
      dob: newDob.trim() || '15 August 2008',
      role: newRole.trim() || 'Student',
      createdAt: new Date().toISOString(),
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    };
    
    // Save to storage
    saveUserRecord(newStudent);
    
    setStudents([...students, newStudent]);
    setNewName('');
    setNewPhone('');
    setNewRole('');
    setNewDob('');
  };

  const handleRemove = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const handleImportList = () => {
    const lines = pasteData.split('\n');
    const imported: StudentData[] = [];
    lines.forEach((line) => {
      const parts = line.split(/[,\t]/);
      const name = parts[0]?.trim();
      if (name) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const item: StudentData = {
          ...baseCardData,
          id: `imp-${Math.random().toString(36).substr(2, 6)}`,
          name,
          phone: parts[1]?.trim() || '',
          idNumber: parts[2]?.trim() || `IND-15AUG-${baseCardData.year || '2025'}-${randomNum}`,
          dob: parts[3]?.trim() || '15 August 2008',
          role: parts[4]?.trim() || 'Student',
          createdAt: new Date().toISOString(),
          photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
        };
        saveUserRecord(item);
        imported.push(item);
      }
    });
    if (imported.length > 0) {
      setStudents([...students, ...imported]);
      setPasteData('');
      setShowPasteModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-amber-900/20 w-full max-w-4xl rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-base sm:text-lg text-[#0B1E36]">
                School Batch & Bulk ID Generator (स्कूल के बच्चों के लिए)
              </h2>
              <p className="text-xs text-slate-500">
                एक साथ कई विद्यार्थियों का आईडी कार्ड बनाएं, प्रिंट करें एवं एडमिन में सुरक्षित करें।
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Student Controls */}
        <div className="mt-4 p-3.5 bg-[#FAF6ED] rounded-xl border border-amber-900/15">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder="विद्यार्थी नाम (Full Name) *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white border border-amber-900/20 text-xs rounded-xl px-3 py-2 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-amber-600"
            />
            <input
              type="tel"
              placeholder="मोबाइल नंबर (Phone)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="bg-white border border-amber-900/20 text-xs rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold placeholder-slate-400 focus:outline-none focus:border-amber-600"
            />
            <input
              type="text"
              placeholder="Class (e.g. 10-A)"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-white border border-amber-900/20 text-xs rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600"
            />
            <input
              type="text"
              placeholder="DOB (15 Aug 2008)"
              value={newDob}
              onChange={(e) => setNewDob(e.target.value)}
              className="bg-white border border-amber-900/20 text-xs rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600"
            />
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={handleAddStudent}
                className="flex-1 bg-[#0B1E36] hover:bg-[#1E3A8A] text-white font-bold text-xs rounded-xl px-3 py-2 flex items-center justify-center space-x-1 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs rounded-xl px-2.5 py-2 flex items-center shadow-xs"
                title="Paste batch list from Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Paste from Excel / CSV sub-modal */}
        {showPasteModal && (
          <div className="my-3 p-3.5 bg-white rounded-xl border border-amber-600 shadow-md">
            <span className="block text-xs font-bold text-amber-900 mb-1">
              Paste from Excel or Table (Name, Phone, ID, DOB, Role per line):
            </span>
            <textarea
              rows={3}
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="Rahul Singh, 9876543210, IND-001, 10 March 2007, Student Class 10&#10;Priya Sharma, 9812345678, IND-002, 12 May 2008, Head Girl"
              className="w-full bg-[#FFFDF9] border border-amber-900/20 text-xs text-slate-900 p-2 rounded-xl font-mono focus:border-amber-600 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1 text-xs bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportList}
                className="px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs"
              >
                Import Batch
              </button>
            </div>
          </div>
        )}

        {/* Student Table List */}
        <div className="flex-1 overflow-y-auto mt-4 border border-amber-900/15 rounded-xl bg-white">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-[#FAF6ED] text-slate-700 font-bold sticky top-0 uppercase text-[10px] tracking-wider border-b border-amber-900/15">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">फोटो</th>
                <th className="p-3">विद्यार्थी नाम</th>
                <th className="p-3">फोन (Phone)</th>
                <th className="p-3">पहचान संख्या (ID)</th>
                <th className="p-3">जन्म तिथि</th>
                <th className="p-3">कक्षा / पद</th>
                <th className="p-3 text-right">कार्य</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-3 text-slate-400 font-bold">{index + 1}</td>
                  <td className="p-3">
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-8 h-9 object-cover rounded shadow-2xs border border-slate-200"
                    />
                  </td>
                  <td className="p-3 font-bold text-[#0B1E36]">{student.name}</td>
                  <td className="p-3 font-mono font-semibold text-blue-900">
                    {student.phone || '—'}
                  </td>
                  <td className="p-3 font-mono font-medium text-amber-900">{student.idNumber}</td>
                  <td className="p-3">{student.dob}</td>
                  <td className="p-3">{student.role}</td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectStudent(student);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-[11px] bg-[#0B1E36] hover:bg-[#1E3A8A] text-white font-bold rounded-lg shadow-2xs"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(student.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-amber-900/10">
          <span className="text-xs font-bold text-slate-600">कुल विद्यार्थी: {students.length}</span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onPrintAll(students)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print All ({students.length}) Cards</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


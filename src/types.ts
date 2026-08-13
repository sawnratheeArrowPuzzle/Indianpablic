export type CardTheme = 'independence_day' | 'school_id' | 'republic_day' | 'sports_cultural';

export interface StudentData {
  id: string;
  name: string;
  phone: string; // User contact number
  idNumber: string;
  dob: string;
  role: string; // e.g. "Proud Citizen", "Student - Class 10-A", "House Captain"
  className?: string;
  rollNo?: string;
  date: string;
  place: string;
  state?: string;
  photoUrl: string;
  schoolName: string;
  eventTitle: string;
  eventSubtitle: string;
  bannerText: string;
  badgeTitle: string;
  badgeSubtitle: string;
  badgeCategory: string;
  signatoryName: string;
  signatoryTitle: string;
  signatoryAuthority: string;
  mottoText: string;
  qrData?: string;
  theme: CardTheme;
  year: string;
  createdAt: string;
}

export interface AdminRecord extends StudentData {
  ipAddress?: string;
  downloadCount?: number;
}


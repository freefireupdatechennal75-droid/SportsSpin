/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TeamColor = 'blue' | 'red' | 'green' | 'yellow';

export interface TeamDetail {
  id: TeamColor;
  name: string;
  captainName: string;
  captainImage?: string;
  description: string;
  benefits: string[];
}

export interface Student {
  id: string;
  name: string;
  registerNumber: string;
  department: string;
  year: string;
  phone: string;
  gender: string;
  team: TeamColor | null;
  registeredAt: string;
  spunAt: string | null;
  sports?: string[];
  idCardPhoto?: string;
  aiReason?: string;
}

export interface TeamStats {
  blue: number;
  red: number;
  green: number;
  yellow: number;
}

export interface TeamLimits {
  blue: number;
  red: number;
  green: number;
  yellow: number;
}

export interface AppSettings {
  totalCapacity: number;
  title: string;
  collegeLogoUrl?: string;
  collegeName?: string;
  showCaptainDetails?: boolean;
  allowViewingTeamReports?: boolean;
  enrollmentDeadline?: string;
  enableTimeLimit?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface DashboardStats {
  totalRegistered: number;
  totalCapacity: number;
  teamCounts: TeamStats;
  teamLimits: TeamLimits;
  recentStudents: Student[];
  recentLogs: ActivityLog[];
}

export interface AdminUser {
  username: string;
  name: string;
}

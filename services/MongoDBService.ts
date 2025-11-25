import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Fixed backend host IP (your laptop's IP)
// For Android emulators in Expo Go, use '10.0.2.2' to access the host machine
// For physical Android devices, use your actual laptop IP address
// For iOS simulator, use 'localhost'
let host = Platform.OS === 'android' ? '10.215.64.128' : 'localhost';
let API_BASE_URL = `http://${host}:3003/api`;

// Fallback hosts for different environments
const fallbackHosts = [
  '10.215.64.128',  // Your actual laptop IP
  'localhost',     // Default localhost
  '127.0.0.1',     // IPv4 localhost
  '10.0.2.2',      // Android emulator
];

console.log(`🔧 API Base URL set to: ${API_BASE_URL}`);

// Helper function to get working API base URL
const getWorkingApiBaseUrl = async (): Promise<string> => {
  // First try the current host
  try {
    const testUrl = `http://${host}:3003/health`;
    console.log(`📡 Testing connectivity to: ${testUrl}`);
    const response = await axios.get(testUrl, { timeout: 5000 });
    if (response.status === 200) {
      console.log(`✅ Connectivity test successful with current host: ${host}`);
      return `http://${host}:3003/api`;
    }
  } catch (error: any) {
    console.log(`❌ Connectivity test failed with current host ${host}:`, error.message || 'Network Error');
  }

  // Try fallback hosts
  for (const fallbackHost of fallbackHosts) {
    try {
      const fallbackUrl = `http://${fallbackHost}:3003/health`;
      console.log(`📡 Trying fallback host: ${fallbackUrl}`);
      const response = await axios.get(fallbackUrl, { timeout: 5000 });
      if (response.status === 200) {
        console.log(`✅ Fallback connectivity test successful with host: ${fallbackHost}`);
        host = fallbackHost;
        return `http://${host}:3003/api`;
      }
    } catch (fallbackError: any) {
      console.log(`❌ Fallback test failed for ${fallbackHost}:`, fallbackError.message || 'Network Error');
    }
  }

  // If all else fails, return the original URL
  console.log(`⚠️ All connectivity tests failed, using original URL: ${API_BASE_URL}`);
  return API_BASE_URL;
};

// ✅ Simple connectivity test function
const testConnectivity = async () => {
  try {
    const baseUrl = await getWorkingApiBaseUrl();
    const testUrl = baseUrl.replace('/api', '/health');
    console.log(`📡 Testing connectivity to: ${testUrl}`);
    const response = await axios.get(testUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error: any) {
    console.log(`❌ Connectivity test failed:`, error.message || 'Network Error');
    return false;
  }
};

// ✅ Interfaces
export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  fullName: string;
  collegeId?: string;
  course?: string;
  department?: string;
  professorId?: string;
  createdAt: Date;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  topic: string;
  description: string;
  course: string;
  department: string;
  status: 'submitted' | 'pending' | 'in_progress' | 'solved' | 'rejected';
  assignedProfessorId?: string;
  assignedProfessorName?: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
  solvedByProfessorId?: string;
  solvedByProfessorName?: string;
  replies: ComplaintReply[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplaintReply {
  id: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'professor' | 'admin';
  message: string;
  createdAt: Date;
}

class MongoDBService {
  private token: string | null = null;
  private isServerReachable: boolean = false;
  private userCache: Map<string, { data: any; timestamp: number }> = new Map();
  private complaintCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  private readonly SHORT_CACHE_DURATION = 30 * 1000;

  // ✅ Server health check
  private async checkServerHealth(): Promise<boolean> {
    try {
      const healthUrl = `http://${host}:3003/health`;
      console.log(`🩺 Checking server health at: ${healthUrl}`);
      const response = await axios.get(healthUrl, { timeout: 5000 });
      this.isServerReachable = response.status === 200;
      console.log(`🏥 Server health check: ${this.isServerReachable ? 'HEALTHY' : 'UNHEALTHY'}`);
      return this.isServerReachable;
    } catch (error: any) {
      console.log('🏥 Server health check failed:', error.message || 'Unknown error');
      this.isServerReachable = false;
      return false;
    }
  }

  // ✅ Token management
  private async loadToken() {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) this.token = storedToken;
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  private async setToken(token: string) {
    this.token = token;
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  private async getHeaders() {
    if (!this.token) await this.loadToken();
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  // ✅ Cache helpers
  private getCachedData(key: string, useShortCache: boolean = false): any | null {
    const cache = useShortCache ? this.complaintCache : this.userCache;
    const cached = cache.get(key);
    const cacheDuration = useShortCache ? this.SHORT_CACHE_DURATION : this.CACHE_DURATION;
    if (cached && Date.now() - cached.timestamp < cacheDuration) return cached.data;
    return null;
  }

  private setCachedData(key: string, data: any, useShortCache: boolean = false): void {
    const cache = useShortCache ? this.complaintCache : this.userCache;
    cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.userCache.clear();
    this.complaintCache.clear();
  }

  // ✅ Sign Up
  async signUp(email: string, password: string, userData: Partial<UserProfile>) {
    try {
      let endpoint = '';
      let requestBody: any = { email, password };

      const baseUrl = await getWorkingApiBaseUrl();

      if (userData.role === 'student') {
        endpoint = `${baseUrl}/register/student`;
        requestBody = {
          ...requestBody,
          name: userData.fullName,
          collegeId: userData.collegeId,
          course: userData.course,
        };
      } else if (userData.role === 'professor') {
        endpoint = `${baseUrl}/register/professor`;
        requestBody = {
          ...requestBody,
          name: userData.fullName,
          professorId: userData.professorId,
          department: userData.department,
        };
      } else {
        throw new Error('Invalid role for signup');
      }

      console.log('Sending signup request to:', endpoint);
      const response = await axios.post(endpoint, requestBody);
      this.clearCache();
      return response.data;
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data.message || 'Unable to connect to the server. Please ensure backend is running on port 3003.');
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Unable to connect to the server. Please check your internet connection and ensure the backend server is running on port 3003.');
      } else {
        // Something else happened
        throw new Error('An unexpected error occurred during signup.');
      }
    }
  }

  // ✅ Sign In
  async signIn(email: string, password: string) {
    try {
      console.log(`🔐 Attempting login for: ${email}`);
      
      const baseUrl = await getWorkingApiBaseUrl();
      console.log(`🌐 API URL: ${baseUrl}`);

      const isConnected = await testConnectivity();
      if (!isConnected) {
        console.log('⚠️ Connectivity test failed. Trying anyway...');
      }

      const response = await axios.post(`${baseUrl}/login`, {
        email: email.trim().toLowerCase(),
        password,
      }, { timeout: 10000 });

      console.log('✅ Login successful');
      if (response.data.token) await this.setToken(response.data.token);
      return response.data;
    } catch (error: any) {
      console.error('❌ SignIn failed:', error.message || 'Unknown error');
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data.message || 'Invalid credentials. Please check your email and password.');
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Unable to connect to the backend. Please ensure the server is running on the correct IP and port 3003.');
      } else {
        // Something else happened
        throw new Error('An unexpected error occurred during login.');
      }
    }
  }

  // ✅ Logout
  async logout() {
    this.token = null;
    this.clearCache();
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // ✅ Fetch current user
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/auth/me`, { headers: await this.getHeaders() });
      return response.data ? { ...response.data, id: response.data._id } : null;
    } catch (error: any) {
      console.error('Error fetching current user:', error.message || 'Unknown error');
      return null;
    }
  }

  // ✅ User management operations
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/users`, { headers: await this.getHeaders() });
      return response.data.map((user: any) => ({ 
        ...user, 
        id: user._id,
        fullName: user.name,
        department: user.department
      }));
    } catch (error: any) {
      console.error('Error fetching all users:', error.message || 'Unknown error');
      throw error;
    }
  }

  async getPendingUsers(): Promise<UserProfile[]> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/users/pending`, { headers: await this.getHeaders() });
      return response.data.map((user: any) => ({ ...user, id: user._id }));
    } catch (error: any) {
      console.error('Error fetching pending users:', error.message || 'Unknown error');
      throw error;
    }
  }

  async approveUser(userId: string): Promise<void> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      await axios.patch(`${baseUrl}/users/${userId}/approve`, {}, { headers: await this.getHeaders() });
    } catch (error: any) {
      console.error('Error approving user:', error.message || 'Unknown error');
      throw error;
    }
  }

  async rejectUser(userId: string): Promise<void> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      await axios.patch(`${baseUrl}/users/${userId}/reject`, {}, { headers: await this.getHeaders() });
    } catch (error: any) {
      console.error('Error rejecting user:', error.message || 'Unknown error');
      throw error;
    }
  }

  // ✅ Assign complaint to professor (admin only)
  async assignComplaintToProfessor(complaintId: string, professorId: string): Promise<Complaint> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.patch(
        `${baseUrl}/complaints/${complaintId}/assign`,
        { professorId },
        { headers: await this.getHeaders() }
      );
      return {
        ...response.data,
        id: response.data._id,
        studentName: response.data.studentId?.name || response.data.studentName || 'Unknown Student',
        studentEmail: response.data.studentId?.email || response.data.studentEmail || 'Unknown Email',
        department: response.data.department || response.data.course || 'Unknown Department',
        solvedByProfessorId: response.data.solvedByProfessorId,
        solvedByProfessorName: response.data.solvedByProfessorName,
        replies: response.data.replies.map((r: any) => ({ ...r, id: r._id, createdAt: new Date(r.createdAt) })),
      };
    } catch (error: any) {
      console.error('Error assigning complaint to professor:', error.message || 'Unknown error');
      throw error;
    }
  }

  // ✅ Complaint operations
  async createComplaint(
    complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'replies'>
  ): Promise<string> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.post(`${baseUrl}/complaints`, complaintData, {
        headers: await this.getHeaders(),
      });
      return response.data._id;
    } catch (error: any) {
      console.error('Error creating complaint:', error.message || 'Unknown error');
      throw error;
    }
  }

  async getComplaintsByStudent(studentId: string): Promise<Complaint[]> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/complaints/student/${studentId}`, {
        headers: await this.getHeaders(),
      });
      return response.data.map((c: any) => ({
        ...c,
        id: c._id,
        studentName: c.studentId?.name || 'Your Information',
        studentEmail: c.studentId?.email || 'Your Email',
        department: c.department || c.course || 'Unknown Department',
        assignedAdminId: c.assignedAdminId,
        assignedAdminName: c.assignedAdminName,
        solvedByProfessorId: c.solvedByProfessorId,
        solvedByProfessorName: c.solvedByProfessorName,
        replies: c.replies.map((r: any) => ({ ...r, id: r._id, createdAt: new Date(r.createdAt) })),
      }));
    } catch (error: any) {
      console.error('Error fetching complaints by student:', error.message || 'Unknown error');
      throw error;
    }
  }

  // ✅ New method to get complaints count for current week
  async getWeeklyComplaintCount(studentId: string): Promise<number> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/complaints/student/${studentId}/weekly-count`, {
        headers: await this.getHeaders(),
      });
      return response.data.count || 0;
    } catch (error: any) {
      console.error('Error fetching weekly complaint count:', error.message || 'Unknown error');
      throw error;
    }
  }

  // ✅ Check if student has exceeded complaint limit
  async checkStudentComplaintLimit(studentId: string): Promise<{ exceeded: boolean; count: number; limit: number }> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/complaints/student/${studentId}/exceeded-limit`, {
        headers: await this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error checking student complaint limit:', error.message || 'Unknown error');
      throw error;
    }
  }

  async getComplaintsByProfessor(professorId: string): Promise<Complaint[]> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/complaints/professor/${professorId}`, {
        headers: await this.getHeaders(),
      });
      return response.data.map((c: any) => ({
        ...c,
        id: c._id,
        studentName: c.studentId?.name || 'Student Information Restricted',
        studentEmail: c.studentId?.email || 'Student Information Restricted',
        department: c.department || c.course || 'Unknown Department',
        assignedAdminId: c.assignedAdminId,
        assignedAdminName: c.assignedAdminName,
        solvedByProfessorId: c.solvedByProfessorId,
        solvedByProfessorName: c.solvedByProfessorName,
        replies: c.replies.map((r: any) => ({ ...r, id: r._id, createdAt: new Date(r.createdAt) })),
      }));
    } catch (error: any) {
      console.error('Error fetching complaints by professor:', error.message || 'Unknown error');
      throw error;
    }
  }

  async updateComplaintStatus(complaintId: string, status: Complaint['status']): Promise<Complaint> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.patch(
        `${baseUrl}/complaints/${complaintId}/status`, 
        { status }, 
        { headers: await this.getHeaders() }
      );
      
      return {
        ...response.data,
        id: response.data._id,
        studentName: response.data.studentId?.name || response.data.studentName || 'Unknown Student',
        studentEmail: response.data.studentId?.email || response.data.studentEmail || 'Unknown Email',
        department: response.data.department || response.data.course || 'Unknown Department',
        assignedAdminId: response.data.assignedAdminId,
        assignedAdminName: response.data.assignedAdminName,
        solvedByProfessorId: response.data.solvedByProfessorId,
        solvedByProfessorName: response.data.solvedByProfessorName,
        replies: response.data.replies.map((r: any) => ({ ...r, id: r._id, createdAt: new Date(r.createdAt) })),
      };
    } catch (error: any) {
      console.error('Error updating complaint status:', error.message || 'Unknown error');
      throw error;
    }
  }

  async uploadAttachment(file: any, complaintId: string): Promise<string> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('complaintId', complaintId);

      const response = await axios.post(`${baseUrl}/complaints/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      });

      return response.data.url;
    } catch (error: any) {
      console.error('Error uploading attachment:', error.message || 'Unknown error');
      throw error;
    }
  }

  async addReply(complaintId: string, reply: Omit<ComplaintReply, 'id' | 'createdAt'>): Promise<Complaint> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.post(
        `${baseUrl}/complaints/${complaintId}/reply`, 
        reply, 
        { headers: await this.getHeaders() }
      );
      
      return {
        ...response.data,
        id: response.data._id,
        studentName: response.data.studentId?.name || response.data.studentName || 'Unknown Student',
        studentEmail: response.data.studentId?.email || response.data.studentEmail || 'Unknown Email',
        department: response.data.department || response.data.course || 'Unknown Department',
        assignedAdminId: response.data.assignedAdminId,
        assignedAdminName: response.data.assignedAdminName,
        solvedByProfessorId: response.data.solvedByProfessorId,
        solvedByProfessorName: response.data.solvedByProfessorName,
        replies: response.data.replies.map((r: any) => ({ ...r, id: r._id, createdAt: new Date(r.createdAt) })),
      };
    } catch (error: any) {
      console.error('Error adding reply:', error.message || 'Unknown error');
      throw error;
    }
  }

  // ✅ Get all complaints (admin only)
  async getAllComplaints(): Promise<Complaint[]> {
    try {
      const baseUrl = await getWorkingApiBaseUrl();
      const response = await axios.get(`${baseUrl}/complaints`, { headers: await this.getHeaders() });
      return response.data.map((c: any) => ({
        ...c,
        id: c._id,
        studentName: c.studentId?.name || c.studentName || 'Unknown Student',
        studentEmail: c.studentId?.email || c.studentEmail || 'Unknown Email',
        department: c.department || c.course || 'Unknown Department',
        assignedAdminId: c.assignedAdminId,
        assignedAdminName: c.assignedAdminName,
        solvedByProfessorId: c.solvedByProfessorId,
        solvedByProfessorName: c.solvedByProfessorName,
        replies: c.replies.map((r: any) => ({ ...r, id: r._id, createdAt: new Date(r.createdAt) })),
      }));
    } catch (error: any) {
      console.error('Error fetching all complaints:', error.message || 'Unknown error');
      throw error;
    }
  }
}

export const mongoService = new MongoDBService();
export default mongoService;
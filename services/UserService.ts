import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../contexts/AuthContext';

export class UserService {
  static async getPendingUsers(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as UserProfile[];
    } catch (error) {
      console.error('Error fetching pending users:', error);
      throw error;
    }
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as UserProfile[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  static async approveUser(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'approved',
      });
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  }

  static async rejectUser(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'rejected',
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  }

  static async getUsersByRole(role: 'student' | 'professor' | 'admin'): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as UserProfile[];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  static async getUserStats(): Promise<{
    totalUsers: number;
    pendingApprovals: number;
    students: number;
    professors: number;
  }> {
    try {
      const allUsers = await this.getAllUsers();
      const pendingUsers = await this.getPendingUsers();
      
      return {
        totalUsers: allUsers.length,
        pendingApprovals: pendingUsers.length,
        students: allUsers.filter(user => user.role === 'student').length,
        professors: allUsers.filter(user => user.role === 'professor').length,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
}

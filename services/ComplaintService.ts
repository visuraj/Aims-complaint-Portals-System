import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  topic: string;
  description: string;
  course: string;
  department: string; // Added department field
  status: 'submitted' | 'pending' | 'in_progress' | 'solved' | 'rejected';
  assignedProfessorId?: string;
  assignedProfessorName?: string;
  assignedAdminId?: string;
  replies: ComplaintReply[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplaintReply {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'professor' | 'admin';
  message: string;
  createdAt: Date;
}

export class ComplaintService {
  static async createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'complaints'), {
        ...complaintData,
        replies: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  }

  static async getComplaintsByStudent(studentId: string): Promise<Complaint[]> {
    try {
      const q = query(
        collection(db, 'complaints'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        replies: doc.data().replies?.map((reply: any) => ({
          ...reply,
          createdAt: reply.createdAt?.toDate() || new Date(),
        })) || [],
      })) as Complaint[];
    } catch (error) {
      console.error('Error fetching student complaints:', error);
      throw error;
    }
  }

  static async getComplaintsByProfessor(professorId: string): Promise<Complaint[]> {
    try {
      const q = query(
        collection(db, 'complaints'),
        where('assignedProfessorId', '==', professorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        replies: doc.data().replies?.map((reply: any) => ({
          ...reply,
          createdAt: reply.createdAt?.toDate() || new Date(),
        })) || [],
      })) as Complaint[];
    } catch (error) {
      console.error('Error fetching professor complaints:', error);
      throw error;
    }
  }

  static async getAllComplaints(): Promise<Complaint[]> {
    try {
      const q = query(
        collection(db, 'complaints'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        replies: doc.data().replies?.map((reply: any) => ({
          ...reply,
          createdAt: reply.createdAt?.toDate() || new Date(),
        })) || [],
      })) as Complaint[];
    } catch (error) {
      console.error('Error fetching all complaints:', error);
      throw error;
    }
  }

  static async updateComplaintStatus(complaintId: string, status: Complaint['status']): Promise<void> {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw error;
    }
  }

  static async addReply(complaintId: string, reply: Omit<ComplaintReply, 'id' | 'createdAt'>): Promise<void> {
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      const complaintDoc = await getDocs(query(collection(db, 'complaints'), where('__name__', '==', complaintId)));
      
      if (complaintDoc.empty) {
        throw new Error('Complaint not found');
      }
      
      const complaintData = complaintDoc.docs[0].data();
      const newReply = {
        ...reply,
        id: Date.now().toString(),
        createdAt: Timestamp.now(),
      };
      
      await updateDoc(complaintRef, {
        replies: [...(complaintData.replies || []), newReply],
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }

  static async uploadAttachment(file: any, complaintId: string): Promise<string> {
    try {
      const fileName = `${complaintId}_${Date.now()}_${file.name || 'attachment'}`;
      const storageRef = ref(storage, `complaints/${fileName}`);
      
      // Convert URI to blob for upload
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  static subscribeToComplaints(callback: (complaints: Complaint[]) => void) {
    const q = query(
      collection(db, 'complaints'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const complaints = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        replies: doc.data().replies?.map((reply: any) => ({
          ...reply,
          createdAt: reply.createdAt?.toDate() || new Date(),
        })) || [],
      })) as Complaint[];
      
      callback(complaints);
    });
  }
}

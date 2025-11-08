import { useState, useEffect } from 'react';
import { database } from '../config/firebase';
import { ref, onValue, off } from 'firebase/database';

export function useFirebaseRealtime(path: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const dbRef = ref(database, path);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const value = snapshot.val();
      setData(value);
    }, (error) => {
      console.error('Firebase realtime error:', error);
      setData(null);
    });

    return () => {
      off(dbRef);
    };
  }, [path]);

  return data;
}


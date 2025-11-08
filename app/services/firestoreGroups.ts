
import { firestore, auth } from '../../firebase';
import { doc, arrayUnion, runTransaction, onSnapshot, collection } from 'firebase/firestore';

const db = firestore;

export function getUserDocRef(userId: string) {
  return doc(db, 'users', userId);
}

export function getGroupDocRef(groupId: string) {
  return doc(db, 'groups', groupId);
}

export async function joinGroup(groupId: string, userId?: string): Promise<void> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) throw new Error('No authenticated user');
  const userRef = getUserDocRef(uid);
  const groupRef = getGroupDocRef(groupId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error('Group does not exist');
    if (!userSnap.exists()) throw new Error('User does not exist');
    const userData = userSnap.data();
    const groupData = groupSnap.data();
    if (groupData.members?.includes(uid)) throw new Error('Already a member');
    transaction.update(groupRef, {
      members: arrayUnion(uid)
    });
    transaction.update(userRef, {
      joinedGroups: arrayUnion(groupId)
    });
  });
}


export function subscribeToUserJoinedGroups(userId: string, onUpdate: (groups: any[]) => void, onError?: (err: any) => void) {
  const userRef = getUserDocRef(userId);
  let unsubUser: (() => void) | null = null;
  let unsubGroups: (() => void) | null = null;
  unsubUser = onSnapshot(userRef, async (userSnap) => {
    const userData = userSnap.data();
    const joinedGroups: string[] = userData?.joinedGroups || [];
    if (joinedGroups.length === 0) {
      onUpdate([]);
      return;
    }
    // Listen to only the joined groups
    unsubGroups?.(); // Unsubscribe previous
    let groupUnsubs: Array<() => void> = [];
    let groupResults: any[] = [];
    let completed = 0;
    joinedGroups.forEach((groupId, idx) => {
      const groupRef = getGroupDocRef(groupId);
      const unsub = onSnapshot(groupRef, (groupSnap) => {
        completed++;
        if (groupSnap.exists()) {
          groupResults[idx] = { id: groupSnap.id, ...groupSnap.data() };
        } else {
          groupResults[idx] = null;
        }
        if (completed === joinedGroups.length) {
          onUpdate(groupResults.filter(Boolean));
        }
      }, onError);
      groupUnsubs.push(unsub);
    });
    unsubGroups = () => {
      groupUnsubs.forEach(fn => fn());
    };
  }, onError);
  return () => {
    unsubUser?.();
    unsubGroups?.();
  };
}

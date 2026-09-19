/**
 * One-time/dev Firestore seed script for the single-branch Gymli data model.
 *
 * Requires a Firebase service-account key: set GOOGLE_APPLICATION_CREDENTIALS
 * to the path of a (gitignored) service-account JSON file before running.
 *
 * Usage:
 *   npm run seed            # seed config/gym, classes, trainers if missing
 *   npm run seed -- --reset # also delete legacy multi-gym collections/fields
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const RESET = process.argv.includes('--reset');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function deleteCollection(name: string) {
  const snapshot = await db.collection(name).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Deleted ${snapshot.size} doc(s) from ${name}`);
}

async function deleteLegacyChats() {
  const gymsSnapshot = await db.collection('gyms').get();
  for (const gymDoc of gymsSnapshot.docs) {
    const messages = await db.collection('chats').doc(gymDoc.id).collection('messages').get();
    if (!messages.empty) {
      const batch = db.batch();
      messages.docs.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
      await batch.commit();
    }
  }
}

async function stripPrimaryGymFromUsers() {
  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();
  let count = 0;
  usersSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
    if ('primaryGym' in doc.data()) {
      batch.update(doc.ref, { primaryGym: FieldValue.delete() });
      count++;
    }
  });
  if (count > 0) {
    await batch.commit();
    console.log(`Stripped primaryGym from ${count} user doc(s)`);
  }
}

async function reset() {
  console.log('Resetting legacy multi-gym data...');
  await deleteLegacyChats();
  await deleteCollection('gyms');
  await deleteCollection('chats');
  await stripPrimaryGymFromUsers();
}

async function seedGym() {
  const gymRef = db.collection('config').doc('gym');
  const existing = await gymRef.get();
  if (existing.exists && !RESET) {
    console.log('config/gym already exists, skipping (use --reset to overwrite)');
    return;
  }
  await gymRef.set({
    gymName: 'Gymli',
    address: '123 Fitness Ave, Gymtown',
    imageUrl: '',
    latitude: 0,
    longitude: 0,
    geofenceRadiusMeters: 100,
    waitTime: '',
    thresholdLow: 20,
    thresholdModerate: 50,
    thresholdPacked: 80,
    promotionTags: '',
    workoutFocusAreas: 'Cardio, Strength Training, HIIT',
    trainerOrGuestInfo: '',
    generalGymNotice: '',
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log('Seeded config/gym');
}

async function seedClasses() {
  const existing = await db.collection('classes').limit(1).get();
  if (!existing.empty && !RESET) {
    console.log('classes already seeded, skipping (use --reset to overwrite)');
    return;
  }
  if (RESET) await deleteCollection('classes');

  const classes = [
    { day: 'Monday', time: '06:00', name: 'Spinning' },
    { day: 'Monday', time: '18:00', name: 'HIIT' },
    { day: 'Tuesday', time: '07:00', name: 'Body Con' },
    { day: 'Tuesday', time: '17:30', name: 'Box' },
    { day: 'Wednesday', time: '06:00', name: 'Step' },
    { day: 'Wednesday', time: '18:00', name: 'Spinning' },
    { day: 'Thursday', time: '07:00', name: 'HIIT' },
    { day: 'Thursday', time: '18:00', name: 'Small Group PT' },
    { day: 'Friday', time: '06:00', name: 'Box' },
    { day: 'Friday', time: '17:00', name: 'Only for the Brave' },
  ] as const;

  const batch = db.batch();
  classes.forEach((c) => {
    const ref = db.collection('classes').doc();
    batch.set(ref, c);
  });
  await batch.commit();
  console.log(`Seeded ${classes.length} classes`);
}

async function seedTrainers() {
  const existing = await db.collection('trainers').limit(1).get();
  if (!existing.empty && !RESET) {
    console.log('trainers already seeded, skipping (use --reset to overwrite)');
    return;
  }
  if (RESET) await deleteCollection('trainers');

  const trainers = [
    {
      name: 'Sipho Nkosi',
      specialties: ['Strength', 'HIIT'],
      availability: { Monday: ['06:00', '18:00'], Wednesday: ['06:00', '18:00'] },
      avatarUrl: 'https://placehold.co/200x200.png',
    },
    {
      name: 'Aisha Patel',
      specialties: ['Cardio', 'Boxing'],
      availability: { Tuesday: ['07:00', '17:00'], Friday: ['07:00'] },
      avatarUrl: 'https://placehold.co/200x200.png',
    },
    {
      name: 'Marco Silva',
      specialties: ['Spinning', 'Body Con'],
      availability: { Monday: ['17:00'], Thursday: ['07:00', '18:00'] },
      avatarUrl: 'https://placehold.co/200x200.png',
    },
  ];

  const batch = db.batch();
  trainers.forEach((t) => {
    const ref = db.collection('trainers').doc();
    batch.set(ref, t);
  });
  await batch.commit();
  console.log(`Seeded ${trainers.length} trainers`);
}

async function main() {
  if (RESET) await reset();
  await seedGym();
  await seedClasses();
  await seedTrainers();
  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

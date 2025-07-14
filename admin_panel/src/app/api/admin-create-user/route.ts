import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK yapılandırması
const firebaseAdminConfig = {
  projectId: "zamanyonet-90325",
  clientEmail: "firebase-adminsdk-xxxxx@zamanyonet-90325.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
};

// Firebase Admin SDK'yı başlat
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(firebaseAdminConfig),
    });
  } catch (error) {
    console.error('Firebase Admin SDK başlatılamadı:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone, role, active } = body;

    // Firebase Admin SDK ile kullanıcı oluştur
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phone || undefined,
      disabled: !active,
    });

    // Firestore'a kullanıcı bilgilerini kaydet
    await getFirestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      role,
      status: active ? 'active' : 'inactive',
      created_at: new Date(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    console.error('Kullanıcı oluşturma hatası:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Kullanıcı oluşturulurken bir hata oluştu' 
    }, { status: 400 });
  }
} 
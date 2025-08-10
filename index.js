const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Fungsi untuk jadikan pengguna sebagai admin
exports.tetapkanAdmin = functions.https.onCall(async (data, context) => {
  // 1. Semak jika yang memanggil fungsi sudah admin
  if (!context.auth || !context.auth.token.superAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Hanya Super Admin boleh menetapkan admin baru'
    );
  }

  // 2. Dapatkan UID pengguna yang ingin dijadikan admin
  const targetUid = data.uid;
  if (!targetUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'UID pengguna diperlukan'
    );
  }

  try {
    // 3. Tetapkan custom claim "admin: true"
    await admin.auth().setCustomUserClaims(targetUid, { 
      admin: true 
    });

    // 4. Kemaskini data pengguna di Firestore (jika perlu)
    await admin.firestore().collection('users').doc(targetUid).update({
      isAdmin: true,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      message: `Berhasil menjadikan pengguna ${targetUid} sebagai admin` 
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Gagal menetapkan admin',
      error.message
    );
  }
});
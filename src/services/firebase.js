// Fichier: src/services/firebase.js
// Version de développement qui n'initialise pas Firebase

console.log('⚠️ Utilisation de la version de développement sans Firebase');

// Exporter des objets fictifs pour éviter les erreurs
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    callback(null);
    return () => {}; // fonction de nettoyage
  },
  signInWithEmailAndPassword: async () => {
    return { user: { uid: '12345', email: 'test@example.com', displayName: 'Test User' } };
  },
  signOut: async () => {},
  createUserWithEmailAndPassword: async () => {
    return { user: { uid: '12345', email: 'test@example.com', displayName: 'Test User' } };
  }
};

export const db = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: true,
        data: () => ({}),
        id: '12345'
      }),
      set: async () => {},
      update: async () => {},
      delete: async () => {}
    }),
    add: async () => ({ id: '12345' }),
    where: () => ({
      get: async () => ({
        docs: [],
        empty: true
      })
    })
  })
};

export default {
  name: 'mock-firebase-app'
};
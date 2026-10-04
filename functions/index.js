const {
    onCall,
    HttpsError
} = require("firebase-functions/v2/https");

const {
    initializeApp
} = require("firebase-admin/app");

const {
    getAuth
} = require("firebase-admin/auth");

const {
    getFirestore,
    FieldValue
} = require("firebase-admin/firestore");


initializeApp();


const db =
    getFirestore();


const auth =
    getAuth();



/*
|--------------------------------------------------------------------------
| Vérifier que l'appelant est admin
|--------------------------------------------------------------------------
*/

async function requireAdmin(request) {

    if (!request.auth) {

        throw new HttpsError(
            "unauthenticated",
            "Vous devez être connecté."
        );

    }


    const uid =
        request.auth.uid;


    const userSnapshot =
        await db
            .collection("users")
            .doc(uid)
            .get();


    if (!userSnapshot.exists) {

        throw new HttpsError(
            "permission-denied",
            "Compte administrateur introuvable."
        );

    }


    const data =
        userSnapshot.data();


    if (data.role !== "admin") {

        throw new HttpsError(
            "permission-denied",
            "Vous devez être administrateur."
        );

    }


    return uid;

}



/*
|--------------------------------------------------------------------------
| Lister les utilisateurs
|--------------------------------------------------------------------------
*/

exports.listAdminUsers =
    onCall(
        async request => {

            await requireAdmin(request);


            const result =
                await auth.listUsers(1000);


            const usersSnapshot =
                await db
                    .collection("users")
                    .get();


            const firestoreUsers =
                new Map();


            usersSnapshot.forEach(
                doc => {

                    firestoreUsers.set(
                        doc.id,
                        doc.data()
                    );

                }
            );


            const users =
                result.users.map(
                    user => {

                        const data =
                            firestoreUsers.get(
                                user.uid
                            ) || {};


                        return {

                            uid:
                                user.uid,

                            email:
                                user.email ||
                                "",

                            displayName:
                                user.displayName ||
                                data.displayName ||
                                data.username ||
                                "",

                            photoURL:
                                user.photoURL ||
                                data.photoURL ||
                                "",

                            role:
                                data.role ||
                                "user",

                            disabled:
                                user.disabled === true,

                            emailVerified:
                                user.emailVerified === true,

                            createdAt:
                                user.metadata
                                    .creationTime ||
                                null,

                            lastSignIn:
                                user.metadata
                                    .lastSignInTime ||
                                null

                        };

                    }
                );


            return {
                users
            };

        }
    );



/*
|--------------------------------------------------------------------------
| Modifier le rôle
|--------------------------------------------------------------------------
*/

exports.changeUserRole =
    onCall(
        async request => {

            await requireAdmin(request);


            const {
                uid,
                role
            } =
                request.data || {};


            if (
                typeof uid !== "string" ||
                typeof role !== "string"
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "UID ou rôle invalide."
                );

            }


            const allowedRoles = [

                "user",

                "staff_site",

                "staff_roblox",

                "staff_discord",

                "staff_application",

                "admin"

            ];


            if (
                !allowedRoles.includes(
                    role
                )
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "Rôle invalide."
                );

            }


            /*
             * Empêche un administrateur de modifier
             * accidentellement son propre rôle.
             */

            if (
                uid === request.auth.uid
            ) {

                throw new HttpsError(
                    "failed-precondition",
                    "Tu ne peux pas modifier ton propre rôle."
                );

            }


            await db
                .collection("users")
                .doc(uid)
                .set(
                    {
                        role: role
                    },
                    {
                        merge: true
                    }
                );


            return {
                success: true,
                role: role
            };

        }
    );



/*
|--------------------------------------------------------------------------
| Bannir / débannir
|--------------------------------------------------------------------------
*/

exports.setUserBanned =
    onCall(
        async request => {

            await requireAdmin(request);


            const {
                uid,
                banned
            } =
                request.data || {};


            if (
                typeof uid !== "string" ||
                typeof banned !== "boolean"
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "Paramètres invalides."
                );

            }


            if (
                uid === request.auth.uid
            ) {

                throw new HttpsError(
                    "failed-precondition",
                    "Tu ne peux pas te bannir toi-même."
                );

            }


            await auth.updateUser(
                uid,
                {
                    disabled: banned
                }
            );


            await db
                .collection("users")
                .doc(uid)
                .set(
                    {
                        banned: banned
                    },
                    {
                        merge: true
                    }
                );


            /*
             * Lors d'un bannissement, on révoque
             * également les refresh tokens.
             */

            if (banned) {

                await auth.revokeRefreshTokens(
                    uid
                );

            }


            return {
                success: true,
                banned: banned
            };

        }
    );



/*
|--------------------------------------------------------------------------
| Réinitialiser le mot de passe
|--------------------------------------------------------------------------
*/

exports.resetUserPassword =
    onCall(
        async request => {

            await requireAdmin(request);


            const {
                uid,
                password
            } =
                request.data || {};


            if (
                typeof uid !== "string" ||
                typeof password !== "string"
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "Paramètres invalides."
                );

            }


            if (
                password.length < 6
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "Le mot de passe doit contenir au moins 6 caractères."
                );

            }


            if (
                uid === request.auth.uid
            ) {

                throw new HttpsError(
                    "failed-precondition",
                    "Utilise la procédure normale de changement de mot de passe pour ton propre compte."
                );

            }


            await auth.updateUser(
                uid,
                {
                    password: password
                }
            );


            /*
             * Force l'utilisateur à refaire une
             * authentification avec le nouveau mot de passe.
             */

            await auth.revokeRefreshTokens(
                uid
            );


            return {
                success: true
            };

        }
    );

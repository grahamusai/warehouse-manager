import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const signUp = async (email, password) => {
  await createUserWithEmailAndPassword(auth, email, password);
};

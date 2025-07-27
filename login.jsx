import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../modules/shared/firebase";
import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Ingreso exitoso");
    } catch (error) {
      alert("Error de login: " + error.message);
    }
  };

  return (
    <form onSubmit={handleLogin} className="p-4">
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Ingresar</button>
    </form>
  );
}

export default Login;

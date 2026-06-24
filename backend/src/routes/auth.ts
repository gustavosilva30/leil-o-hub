import { Router, Response } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByEmail, updateUserAttempts, resetUserAttempts } from "@/db/users";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/authMiddleware";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "leilao-hub-secret-key-12345";

// Rate limiting to prevent distributed brute force
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: {
    error: "Muitas tentativas de login a partir deste IP. Tente novamente em um minuto."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    return;
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      // Return general error message to prevent email enumeration
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }

    // Check account lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockout_until).getTime() - new Date().getTime()) / 60000
      );
      res.status(403).json({
        error: `Esta conta está temporariamente bloqueada por excesso de tentativas falhas. Tente novamente em ${remainingMinutes} minuto(s).`
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      let lockoutUntil: Date | null = null;

      if (newAttempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await updateUserAttempts(user.id, newAttempts, lockoutUntil);

      if (newAttempts >= 5) {
        res.status(403).json({
          error: "Conta bloqueada por 15 minutos devido a 5 tentativas falhas consecutivas."
        });
        return;
      } else {
        res.status(401).json({
          error: `E-mail ou senha incorretos. Tentativa ${newAttempts} de 5.`
        });
        return;
      }
    }

    // Success! Reset attempts
    await resetUserAttempts(user.id);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome
      }
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor durante a autenticação." });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;

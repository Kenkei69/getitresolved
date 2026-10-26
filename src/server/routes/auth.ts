import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { RegisterSchema, LoginSchema } from '../../shared/schemas';
import { signToken, setAuthCookie, clearAuthCookie, authenticateToken, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../services/audit';

const router = Router();

// Register as a citizen (citizens cannot register as staff or admin)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid registration data' });
      return;
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CITIZEN', // Strictly CITIZEN
      },
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: null,
      department: null,
      createdAt: user.createdAt.toISOString(),
    };

    const token = signToken(safeUser);
    setAuthCookie(res, token);

    await logAuditEvent(prisma, {
      actorId: user.id,
      action: 'USER_REGISTER',
      details: { email: user.email, role: 'CITIZEN' },
    });

    res.status(201).json({
      success: true,
      data: { user: safeUser },
      message: 'Account created successfully.',
    });
  } catch (err: any) {
    console.error('[Register Error]', err);
    res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid login credentials' });
      return;
    }

    const { email, password } = parsed.data;

    // In production, block known default demo passwords when demo mode is disabled
    const isProd = process.env.NODE_ENV === 'production';
    const demoEnabled =
      process.env.ENABLE_DEMO_ACCOUNTS === 'true' ||
      (!isProd && process.env.ENABLE_DEMO_ACCOUNTS !== 'false');

    const KNOWN_DEMO_PASSWORDS = ['Admin123!', 'Staff123!', 'Citizen123!'];
    if (!demoEnabled && KNOWN_DEMO_PASSWORDS.includes(password)) {
      res.status(403).json({
        success: false,
        error: 'Demonstration logins are disabled in production. Please use your official credentials.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: { id: true, name: true, code: true, description: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      createdAt: user.createdAt.toISOString(),
    };

    const token = signToken(safeUser);
    setAuthCookie(res, token);

    await logAuditEvent(prisma, {
      actorId: user.id,
      action: 'USER_LOGIN',
      details: { email: user.email, role: user.role },
    });

    res.json({
      success: true,
      data: { user: safeUser },
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    res.status(500).json({ success: false, error: 'Login failed. Please try again later.' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    await logAuditEvent(prisma, {
      actorId: req.user.id,
      action: 'USER_LOGOUT',
      details: { email: req.user.email },
    });
  }
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Current User Me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

export default router;

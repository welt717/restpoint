import { Request, Response, NextFunction } from 'express';

export const validateOnboarding = (req: Request, res: Response, next: NextFunction) => {
  // Get data from either body or fields (multipart form-data)
  const data = req.body || {};
  const organizationName = data.organizationName || req.body.organizationName;
  const email = data.email || req.body.email;
  const location = data.location || req.body.location;
  const password = data.password || req.body.password;
  const termsAccepted = data.termsAccepted === true || data.termsAccepted === 'true' || data.termsAccepted === 1;

  const errors: string[] = [];

  if (!organizationName) errors.push('Organization name is required');
  if (!email) errors.push('Email is required');
  if (!location) errors.push('Location is required');
  if (!password) errors.push('Password is required');
  if (!termsAccepted) errors.push('You must accept terms and conditions');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Attach validated data to request body for controller
  req.body = {
    organizationName,
    email,
    location,
    password,
    termsAccepted
  };

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body || {};
  const email = data.email || req.body.email;
  const password = data.password || req.body.password;

  const errors: string[] = [];

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

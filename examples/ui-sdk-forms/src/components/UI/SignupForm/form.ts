import { z } from 'zod';

export const ROLES = [
  { value: 'designer', label: 'Designer' },
  { value: 'developer', label: 'Developer' },
  { value: 'manager', label: 'Manager' }
] as const;

export const PLANS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
] as const;

export const SOURCES = [
  { value: 'search', label: 'Search engine' },
  { value: 'colleague', label: 'A colleague' },
  { value: 'event', label: 'An event' }
] as const;

export const COUNTRIES = [
  { value: 'be', label: 'Belgium' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'fr', label: 'France' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'us', label: 'United States' }
] as const;

/**
 * Returns the values of an options list as a non-empty tuple for `z.enum`.
 * @param options - The options list
 */
const values = <T extends string>(
  options: readonly { value: T }[]
): [T, ...T[]] => options.map((option) => option.value) as [T, ...T[]];

/**
 * Choice fields are `z.string().min(1).pipe(z.enum(...))`: the form's value is
 * a plain string that starts empty, and the parsed output is the narrow union.
 */
export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  role: z
    .string()
    .min(1, 'Choose a role.')
    .pipe(z.enum(values(ROLES), 'Choose a role.')),
  message: z.string().max(280, 'Keep it under 280 characters.'),
  plan: z
    .string()
    .min(1, 'Choose a plan.')
    .pipe(z.enum(values(PLANS), 'Choose a plan.')),
  source: z
    .string()
    .min(1, 'Tell us how you heard about us.')
    .pipe(z.enum(values(SOURCES), 'Tell us how you heard about us.')),
  country: z
    .string()
    .min(1, 'Choose a country.')
    .pipe(z.enum(values(COUNTRIES), 'Choose a country.')),
  terms: z
    .boolean()
    .refine((accepted) => accepted, 'Accept the terms to continue.')
});

/** What the schema returns once it passes: narrowed unions. */
export type SignupInput = z.output<typeof signupSchema>;
/** What the form holds while the user edits: strings that may still be empty. */
export type SignupValues = z.input<typeof signupSchema>;

import z from 'zod';
import { PTRT_ADMIN_ROLE_NAME, PTRT_USER_ROLE_NAME } from '../../../constants/admin';

export const AddNewUserSchema = z.object({
    firstName: z.string({required_error: 'First name is required'}).min(1),
    email: z.string({required_error: 'Email is required'}).email('Not a valid email address'),
    role: z.enum(['PTRT-ADMIN', 'PTRT-USER'], {required_error: 'Role is required'}),
});

export type AddNewUserType = z.infer<typeof AddNewUserSchema>;

export const ASSIGN_ROLE_SCHEMA = z.object({
  role: z.enum([PTRT_ADMIN_ROLE_NAME, PTRT_USER_ROLE_NAME]),
});

export type AssignRoleType = z.infer<typeof ASSIGN_ROLE_SCHEMA>;
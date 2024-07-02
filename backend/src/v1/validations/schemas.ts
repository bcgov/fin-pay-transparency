import z from 'zod';

export const AddNewUserSchema = z.object({
    firstName: z.string({required_error: 'First name is required'}).min(1),
    email: z.string({required_error: 'Email is required'}).email('Not a valid email address'),
    role: z.enum(['PTRT-ADMIN', 'PTRT-USER'], {required_error: 'Role is required'}),
});

export type AddNewUserType = z.infer<typeof AddNewUserSchema>;
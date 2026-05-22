import {
  RegisterInputSchema,
  LoginInputSchema,
  ChangePasswordInputSchema,
  UpdateProfileInputSchema,
  type RegisterInput,
  type LoginInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from './api-schemas';
export {
  RegisterInputSchema,
  LoginInputSchema,
  ChangePasswordInputSchema,
  UpdateProfileInputSchema,
};

export type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  UpdateProfileInput,
};
export const registerSchema = RegisterInputSchema;
export const loginSchema = LoginInputSchema;
export const changePasswordSchema = ChangePasswordInputSchema;
export const updateProfileSchema = UpdateProfileInputSchema;


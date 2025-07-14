export interface User {
  id: string
  email: string
  name?: string
  role?: string
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  name: string
} 
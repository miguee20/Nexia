import { PrismaClient } from '@prisma/client';
import { IUserRepository, UserEntity } from '../../../domain/interfaces/IUserRepository';

const prisma = new PrismaClient();

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.usuario.findFirst({
      where: { email },
      include: {
        condominio: {
          select: { activo: true }
        }
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      condominio_id: user.condominio_id,
      email: user.email,
      password_hash: user.password_hash,
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      activo: user.activo,
      condominio: user.condominio
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.usuario.findUnique({
      where: { id },
      include: {
        condominio: {
          select: { activo: true }
        }
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      condominio_id: user.condominio_id,
      email: user.email,
      password_hash: user.password_hash,
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      activo: user.activo,
      condominio: user.condominio
    };
  }
}

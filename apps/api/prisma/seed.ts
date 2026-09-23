import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de base de datos...');

  // Limpiar BD
  await prisma.notificacion.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.amenidad.deleteMany();
  await prisma.registroGarita.deleteMany();
  await prisma.alertaDelivery.deleteMany();
  await prisma.paseVisita.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.cuota.deleteMany();
  await prisma.marbete.deleteMany();
  await prisma.vehiculo.deleteMany();
  await prisma.propiedad.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.condominio.deleteMany();

  console.log('Base de datos limpiada.');

  // Configurar hashes (12 rounds según PRD/HashService)
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const guardiaHash = await bcrypt.hash('Guardia1234!', 12);
  const residenteHash = await bcrypt.hash('Residente1234!', 12);

  // 1. Crear Condominio "Residencial Los Altos"
  const condominio = await prisma.condominio.create({
    data: {
      nombre: 'Residencial Los Altos',
      direccion: 'Km 20 Carretera a El Salvador',
      activo: true,
      configuracion: {
        modulos: {
          garita_qr: true,
          finanzas: true,
          amenidades: true,
          marbetes: true,
        },
        politicas: {
          dia_corte_cuota: 5,
          monto_cuota_base: 500,
          recargo_mora_porcentaje: 10,
          meses_para_moroso: 2,
          bloquear_visitas_morosos: true,
          vigencia_pase_qr_horas: 8,
          vigencia_alerta_delivery_horas: 2,
          moneda: 'GTQ',
          marbetes_incluidos_por_propiedad: 2,
          costo_marbete_extra: 50,
          periodo_marbete: 'MENSUAL',
        }
      }
    }
  });

  console.log(`Condominio creado: ${condominio.nombre} (${condominio.id})`);

  // 2. Crear SuperAdmin
  // SuperAdmin no necesita estar atado a un condominio obligatoriamente en SaaS puro,
  // pero según el schema requiere condominio_id. Lo asociaremos al primer condominio para este MVP.
  await prisma.usuario.create({
    data: {
      condominio_id: condominio.id,
      email: 'superadmin@nexia.lat',
      password_hash: adminHash,
      nombre_completo: 'Super Administrador Nexia',
      telefono: '+502 00000000',
      rol: 'SUPERADMIN',
      activo: true,
    }
  });

  // 3. Crear Admin Condominio
  await prisma.usuario.create({
    data: {
      condominio_id: condominio.id,
      email: 'admin@losaltos.gt',
      password_hash: adminHash,
      nombre_completo: 'Administrador Los Altos',
      telefono: '+502 11111111',
      rol: 'ADMIN_CONDOMINIO',
      activo: true,
    }
  });

  // 4. Crear Guardia
  await prisma.usuario.create({
    data: {
      condominio_id: condominio.id,
      email: 'guardia@losaltos.gt',
      password_hash: guardiaHash,
      nombre_completo: 'Guardia Turno Día',
      telefono: '+502 22222222',
      rol: 'GUARDIA',
      activo: true,
    }
  });

  // 5. Crear 2 Residentes
  await prisma.usuario.create({
    data: {
      condominio_id: condominio.id,
      email: 'residente1@losaltos.gt',
      password_hash: residenteHash,
      nombre_completo: 'Residente Propietario 1',
      telefono: '+502 33333333',
      rol: 'RESIDENTE',
      tipo_residencia: 'PROPIETARIO',
      activo: true,
    }
  });

  await prisma.usuario.create({
    data: {
      condominio_id: condominio.id,
      email: 'residente2@losaltos.gt',
      password_hash: residenteHash,
      nombre_completo: 'Residente Inquilino 1',
      telefono: '+502 44444444',
      rol: 'RESIDENTE',
      tipo_residencia: 'INQUILINO',
      activo: true,
    }
  });

  console.log('Usuarios creados correctamente.');
  console.log('Seed de base de datos finalizado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

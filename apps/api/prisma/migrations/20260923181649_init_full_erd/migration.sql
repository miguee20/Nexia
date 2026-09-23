-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'ADMIN_CONDOMINIO', 'RESIDENTE', 'GUARDIA');

-- CreateEnum
CREATE TYPE "TipoResidencia" AS ENUM ('PROPIETARIO', 'INQUILINO');

-- CreateEnum
CREATE TYPE "TipoPropiedad" AS ENUM ('CASA', 'APARTAMENTO', 'LOTE', 'LOCAL_COMERCIAL');

-- CreateEnum
CREATE TYPE "EstadoPropiedad" AS ENUM ('OCUPADA', 'DESOCUPADA', 'EN_CONSTRUCCION');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('SEDAN', 'PICKUP', 'MOTO');

-- CreateEnum
CREATE TYPE "EstadoMarbete" AS ENUM ('ACTIVO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'PARCIAL');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE_REVISION', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "MotivoVisita" AS ENUM ('VISITA_PERSONAL', 'SERVICIO_TECNICO', 'EVENTO');

-- CreateEnum
CREATE TYPE "EstadoPase" AS ENUM ('ACTIVO', 'UTILIZADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ACTIVA', 'COMPLETADA', 'EXPIRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('ENTRADA_QR', 'SALIDA_QR', 'ENTRADA_MANUAL', 'SALIDA_MANUAL', 'DELIVERY', 'VERIFICACION_LLAMADA');

-- CreateEnum
CREATE TYPE "EstadoAmenidad" AS ENUM ('ACTIVA', 'EN_MANTENIMIENTO', 'DESHABILITADA');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('SISTEMA', 'FINANZAS', 'GARITA', 'RESERVA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "tipo_residencia" "TipoResidencia",
    "datos_extra" JSONB DEFAULT '{}',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propiedad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "identificador" TEXT NOT NULL,
    "tipo" "TipoPropiedad" NOT NULL,
    "estado" "EstadoPropiedad" NOT NULL,
    "propietario_id" UUID,
    "inquilino_id" UUID,
    "area_m2" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "propiedad_id" UUID NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "modelo" TEXT,
    "tipo" "TipoVehiculo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marbete" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "propiedad_id" UUID NOT NULL,
    "vehiculo_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "es_extra" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoMarbete" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marbete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "propiedad_id" UUID NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto_original" DECIMAL(10,2) NOT NULL,
    "monto_recargo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cuota_id" UUID NOT NULL,
    "residente_id" UUID NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "referencia_bancaria" TEXT,
    "comprobante_url" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "motivo_rechazo" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "fecha_revision" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaseVisita" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "residente_id" UUID NOT NULL,
    "propiedad_id" UUID NOT NULL,
    "nombre_visitante" TEXT NOT NULL,
    "motivo" "MotivoVisita" NOT NULL,
    "qr_token" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPase" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaseVisita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaDelivery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "residente_id" UUID NOT NULL,
    "propiedad_id" UUID NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nombre_repartidor" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroGarita" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "pase_id" UUID,
    "alerta_delivery_id" UUID,
    "guardia_id" UUID NOT NULL,
    "nombre_visitante" TEXT,
    "placa_vehiculo" TEXT,
    "tipo_registro" "TipoRegistro" NOT NULL,
    "entrada" TIMESTAMP(3),
    "salida" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroGarita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenidad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "condominio_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "requiere_reserva" BOOLEAN NOT NULL DEFAULT true,
    "anticipacion_minima_horas" INTEGER NOT NULL DEFAULT 0,
    "aforo_maximo" INTEGER,
    "costo_adicional" DECIMAL(10,2),
    "horario_disponible" JSONB NOT NULL DEFAULT '{}',
    "estado" "EstadoAmenidad" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amenidad_id" UUID NOT NULL,
    "residente_id" UUID NOT NULL,
    "condominio_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "condominio_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Usuario_condominio_id_idx" ON "Usuario"("condominio_id");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_condominio_id_email_key" ON "Usuario"("condominio_id", "email");

-- CreateIndex
CREATE INDEX "Propiedad_condominio_id_idx" ON "Propiedad"("condominio_id");

-- CreateIndex
CREATE UNIQUE INDEX "Propiedad_condominio_id_identificador_key" ON "Propiedad"("condominio_id", "identificador");

-- CreateIndex
CREATE INDEX "Vehiculo_condominio_id_idx" ON "Vehiculo"("condominio_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_condominio_id_placa_key" ON "Vehiculo"("condominio_id", "placa");

-- CreateIndex
CREATE INDEX "Marbete_condominio_id_idx" ON "Marbete"("condominio_id");

-- CreateIndex
CREATE UNIQUE INDEX "Marbete_condominio_id_codigo_key" ON "Marbete"("condominio_id", "codigo");

-- CreateIndex
CREATE INDEX "Cuota_condominio_id_idx" ON "Cuota"("condominio_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaseVisita_qr_token_key" ON "PaseVisita"("qr_token");

-- CreateIndex
CREATE INDEX "PaseVisita_condominio_id_idx" ON "PaseVisita"("condominio_id");

-- CreateIndex
CREATE INDEX "AlertaDelivery_condominio_id_idx" ON "AlertaDelivery"("condominio_id");

-- CreateIndex
CREATE INDEX "RegistroGarita_condominio_id_idx" ON "RegistroGarita"("condominio_id");

-- CreateIndex
CREATE INDEX "Amenidad_condominio_id_idx" ON "Amenidad"("condominio_id");

-- CreateIndex
CREATE INDEX "Reserva_condominio_id_idx" ON "Reserva"("condominio_id");

-- CreateIndex
CREATE INDEX "Notificacion_condominio_id_idx" ON "Notificacion"("condominio_id");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_inquilino_id_fkey" FOREIGN KEY ("inquilino_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marbete" ADD CONSTRAINT "Marbete_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marbete" ADD CONSTRAINT "Marbete_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marbete" ADD CONSTRAINT "Marbete_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuota_id_fkey" FOREIGN KEY ("cuota_id") REFERENCES "Cuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaseVisita" ADD CONSTRAINT "PaseVisita_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaseVisita" ADD CONSTRAINT "PaseVisita_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaseVisita" ADD CONSTRAINT "PaseVisita_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaDelivery" ADD CONSTRAINT "AlertaDelivery_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaDelivery" ADD CONSTRAINT "AlertaDelivery_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaDelivery" ADD CONSTRAINT "AlertaDelivery_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGarita" ADD CONSTRAINT "RegistroGarita_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGarita" ADD CONSTRAINT "RegistroGarita_pase_id_fkey" FOREIGN KEY ("pase_id") REFERENCES "PaseVisita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGarita" ADD CONSTRAINT "RegistroGarita_alerta_delivery_id_fkey" FOREIGN KEY ("alerta_delivery_id") REFERENCES "AlertaDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGarita" ADD CONSTRAINT "RegistroGarita_guardia_id_fkey" FOREIGN KEY ("guardia_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amenidad" ADD CONSTRAINT "Amenidad_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_amenidad_id_fkey" FOREIGN KEY ("amenidad_id") REFERENCES "Amenidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

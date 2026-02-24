import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // counselors 테이블
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "counselors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "name" character varying(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_counselors_email" UNIQUE ("email"),
        CONSTRAINT "PK_counselors" PRIMARY KEY ("id")
      )
    `);

    // schedules 테이블
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "counselor_id" uuid NOT NULL,
        "date" date NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "max_capacity" integer NOT NULL DEFAULT 3,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_schedules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_schedules_counselor" FOREIGN KEY ("counselor_id")
          REFERENCES "counselors"("id") ON DELETE CASCADE
      )
    `);

    // bookings 테이블
    await queryRunner.query(`
      CREATE TYPE IF NOT EXISTS "booking_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "schedule_id" uuid NOT NULL,
        "client_name" character varying(100) NOT NULL,
        "client_email" character varying(255) NOT NULL,
        "client_phone" character varying(20),
        "status" "booking_status_enum" NOT NULL DEFAULT 'confirmed',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_schedule" FOREIGN KEY ("schedule_id")
          REFERENCES "schedules"("id") ON DELETE CASCADE
      )
    `);

    // consultation_records 테이블
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consultation_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "notes" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_consultation_records_booking" UNIQUE ("booking_id"),
        CONSTRAINT "PK_consultation_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_consultation_records_booking" FOREIGN KEY ("booking_id")
          REFERENCES "bookings"("id") ON DELETE CASCADE
      )
    `);

    // invitation_links 테이블
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invitation_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "counselor_id" uuid NOT NULL,
        "token" character varying(255) NOT NULL,
        "recipient_email" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invitation_links_token" UNIQUE ("token"),
        CONSTRAINT "PK_invitation_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invitation_links_counselor" FOREIGN KEY ("counselor_id")
          REFERENCES "counselors"("id") ON DELETE CASCADE
      )
    `);

    // 인덱스 생성
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_schedules_date_counselor" ON "schedules" ("date", "counselor_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_schedule" ON "bookings" ("schedule_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_status" ON "bookings" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_invitation_token" ON "invitation_links" ("token")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "consultation_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invitation_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "counselors"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
  }
}
